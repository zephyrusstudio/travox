/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/customers/CustomerManagement.tsx
import { FileText, Plus, RefreshCw, Users } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Customer } from "../../types";

import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import ConfirmDestructionModal from "../ui/common/ConfirmDestructionModal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Loader from "../ui/Loader";
import AccountFormModal, {
  AccountFormState,
} from "../ui/common/AccountFormModal";
import CustomerFormModal, { CustomerFormState } from "./CustomerFormModal";
import CustomerTable from "./CustomerTable";
import CustomerBookingsModal from "./CustomerBookingsModal";

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  // ── State ────────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerFormState | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Account management state
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [selectedCustomerForAccount, setSelectedCustomerForAccount] =
    useState<Customer | null>(null);
  const [existingAccountData, setExistingAccountData] =
    useState<AccountFormState | null>(null);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Use search results if searching, otherwise use paginated customers
  const displayCustomers = searchTerm ? searchResults : customers;

  // ── Search function using /customers/search endpoint ────────────────────────
  const performSearch = useCallback(async (term: string) => {
    // Cancel any ongoing search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      params.append("q", trimmedTerm);
      params.append("unmask", "true");

      const res = await apiRequest<any>({
        method: "GET",
        url: `/customers/search?${params.toString()}`,
      });

      if (abortController.signal.aborted) return;

      let data = res?.data ?? [];
      // Sort by updatedAt descending (most recently updated first)
      data = data.sort((a: Customer, b: Customer) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      setSearchResults(data);
    } catch (e) {
      if (!abortController.signal.aborted) {
        const err = e as ApiError;
        setErrorMsg(err.message || "Search failed");
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
        searchAbortControllerRef.current = null;
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({
        method: "GET",
        url: `/customers?unmask=true&limit=${itemsPerPage}&offset=${offset}`,
      });
      let data = res?.data ?? [];
      // Sort by updatedAt descending (most recently updated first)
      data = data.sort((a: Customer, b: Customer) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      setCustomers(data);
      // Use count from API response if available
      setTotalItems(res?.count ?? data.length);
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const openForm = (customer?: Customer) => {
    setSelectedCustomer(customer ?? null);
    setIsFormOpen(true);
  };

  const askDelete = (customerId: string) => {
    setDeleteTargetId(customerId);
    setIsDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await apiRequest({
        method: "DELETE",
        url: `/customers/${deleteTargetId}`,
      });
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      // Clear search results to force re-search if needed
      if (searchTerm) {
        performSearch(searchTerm);
      }
      fetchCustomers();
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const viewTicketHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
  };

  const handleAccountLinked = () => {
    // Refresh customers list to get updated accountId
    // Re-trigger search if active to refresh results
    if (searchTerm) {
      performSearch(searchTerm);
    }
    fetchCustomers();
    setIsAccountFormOpen(false);
    setSelectedCustomerForAccount(null);
    setExistingAccountData(null);
  };

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600">
            Manage your travel customers and their information
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            onClick={() => navigate("/customers/report")}
            icon={FileText}
            variant="outline"
          >
            Report
          </Button>
          <Button
            onClick={fetchCustomers}
            icon={RefreshCw}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button onClick={() => openForm()} icon={Plus}>
            Save / Add Customer
          </Button>
        </div>
      </div>

      {/* Inline error */}
      {errorMsg && (
        <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div className="grid grid-cols-1">
        <div className="relative">
          <CustomerTable.SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Loader isLoading={isSearching} />
        </div>
      </div>

      {/* Pagination */}
      {!loading && (
        !searchTerm && displayCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
          />
        )
      )}

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading customers...</span>
            </div>
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Customers Found
          </h3>
          <p className="text-gray-500">
            Get started by adding your first customer.
          </p>
        </div>
      ) : (
        <CustomerTable
          customers={displayCustomers}
          onEdit={openForm}
          onDelete={askDelete}
          onViewTickets={viewTicketHistory}
        />
      )}

      {/* Customer Bookings Modal */}
      <CustomerBookingsModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={selectedCustomer}
      />

      {/* Add/Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        title={selectedCustomer ? "Edit Customer" : "Create Customer"}
        isEditing={Boolean(selectedCustomer)}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />

      {/* Account Management Modal */}
      <AccountFormModal
        isOpen={isAccountFormOpen}
        onClose={() => {
          setIsAccountFormOpen(false);
          setSelectedCustomerForAccount(null);
          setExistingAccountData(null);
        }}
        entityId={selectedCustomerForAccount?.id || ""}
        entityType="customer"
        entityName={selectedCustomerForAccount?.name || ""}
        existingAccount={existingAccountData}
        onAccountLinked={handleAccountLinked}
      />

      {/* Delete Confirm Modal */}
      <ConfirmDestructionModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteOpen(false);
            setDeleteTargetId(null);
          }
        }}
        title="Delete customer?"
        message="This action will permanently remove the customer record."
        error={errorMsg}
        onConfirm={doDelete}
        loading={deleting}
        confirmText="Delete"
      />
    </div>
  );
};

export default CustomerManagement;
