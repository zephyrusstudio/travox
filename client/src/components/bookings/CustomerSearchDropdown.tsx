/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown, Loader2, Plus, Search, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../utils/apiConnector';
import { errorToast, successToast } from '../../utils/toasts';
import { CustomerLite } from './booking.v2.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerSearchDropdownProps {
  value: string; // customerId
  customers: CustomerLite[];
  onChange: (customerId: string) => void;
  onCustomerCreated?: (customer: CustomerLite) => void;
  disabled?: boolean;
}

interface CustomerSearchResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CustomerSearchDropdown: React.FC<CustomerSearchDropdownProps> = ({
  value,
  customers,
  onChange,
  onCustomerCreated,
  disabled = false,
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Get selected customer display name
  const selectedCustomer = customers.find((c) => c.customer_id === value);
  const displayValue = selectedCustomer?.full_name || '';

  // ───────────────────────────────────────────────────────────────────────────
  // Search API
  // ───────────────────────────────────────────────────────────────────────────

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      // Build search params - try to detect if it looks like phone, email, or gstin
      const params = new URLSearchParams();
      
      // Use general 'q' for broad search, but also add specific field if detected
      const trimmedQuery = query.trim();
      
      // Check if query looks like a phone number (digits only)
      if (/^\d+$/.test(trimmedQuery)) {
        params.set('phone', trimmedQuery);
      }
      // Check if query looks like an email
      else if (trimmedQuery.includes('@')) {
        params.set('email', trimmedQuery);
      }
      // Check if query looks like GSTIN (alphanumeric, 15 chars starting with number)
      else if (/^\d{2}[A-Z0-9]+$/i.test(trimmedQuery) && trimmedQuery.length >= 10) {
        params.set('gstin', trimmedQuery);
      }
      // Default to name search
      else {
        params.set('name', trimmedQuery);
      }

      const response = await apiRequest<{ data: CustomerSearchResult[] }>({
        url: `/customers/search?${params.toString()}`,
        method: 'GET',
      });

      if (response?.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
      setHasSearched(true);
    } catch (err) {
      console.error('Customer search failed:', err);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchCustomers(query);
      }, 300);
    },
    [searchCustomers]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Create Customer
  // ───────────────────────────────────────────────────────────────────────────

  const handleCreateCustomer = async () => {
    const customerName = searchQuery.trim();
    
    if (!customerName) {
      errorToast('Please enter a customer name in the search field');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: customerName,
        email: 'esanchar@gmail.com',
        phone: '+91-9332100485',
      };

      const response = await apiRequest<{ data: any }>({
        url: '/customers',
        method: 'POST',
        data: payload,
      });

      if (response?.data) {
        const newCustomer: CustomerLite = {
          customer_id: response.data.id,
          full_name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          gstin: response.data.gstin,
          passportNo: response.data.passportNo,
        };

        // Notify parent about the new customer
        onCustomerCreated?.(newCustomer);

        // Select the new customer
        onChange(newCustomer.customer_id);

        // Reset and close
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);

        successToast('Customer created successfully');
      }
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      errorToast(err.message || 'Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Selection
  // ───────────────────────────────────────────────────────────────────────────

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Click outside handler
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
          }`}
        >
          <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
            {displayValue || 'Search or select customer...'}
          </span>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, phone, email, or GSTIN..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-56 overflow-y-auto">
              {/* Search Results */}
              {hasSearched && searchResults.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                    Search Results
                  </div>
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelect(customer.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-start gap-3 ${
                        value === customer.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {[customer.phone, customer.email, customer.gstin].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results - Show message only */}
              {hasSearched && searchResults.length === 0 && searchQuery.trim() && (
                <div className="py-4 px-3 text-center">
                  <p className="text-sm text-gray-500">
                    No customers found for "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Default: Show existing customers from props when no search */}
              {!hasSearched && customers.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                    Recent Customers
                  </div>
                  {customers.slice(0, 10).map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => handleSelect(customer.customer_id)}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-start gap-3 ${
                        value === customer.customer_id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{customer.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {[customer.phone, customer.email, customer.gstin].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!hasSearched && customers.length === 0 && !searchQuery && (
                <div className="py-4 px-3 text-center">
                  <p className="text-sm text-gray-500">No customers available</p>
                </div>
              )}
            </div>

            {/* Create New Customer Option - Always visible at bottom */}
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isCreating ? 'Creating...' : 'Create New Customer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerSearchDropdown;
