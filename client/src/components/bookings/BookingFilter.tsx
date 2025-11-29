import React, { useState, useCallback, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import Button from "../ui/Button";

export interface BookingFilterParams {
  status?: string;
  paymentStatus?: "paid" | "partial" | "unpaid";
  bookingDateFrom?: string;
  bookingDateTo?: string;
  travelStartFrom?: string;
  travelStartTo?: string;
  travelEndFrom?: string;
  travelEndTo?: string;
  dueAmountMin?: number;
  dueAmountMax?: number;
}

interface BookingFilterProps {
  onFilter: (params: BookingFilterParams) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const BookingFilter: React.FC<BookingFilterProps> = ({
  onFilter,
  onClear,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<BookingFilterParams>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof BookingFilterParams, value: string | number | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value === "" ? undefined : value,
      }));
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    // Remove undefined/empty values
    const cleanedFilters: BookingFilterParams = {};

    if (filters.status) {
      cleanedFilters.status = filters.status;
    }
    if (filters.paymentStatus) {
      cleanedFilters.paymentStatus = filters.paymentStatus;
    }
    if (filters.bookingDateFrom) {
      cleanedFilters.bookingDateFrom = filters.bookingDateFrom;
    }
    if (filters.bookingDateTo) {
      cleanedFilters.bookingDateTo = filters.bookingDateTo;
    }
    if (filters.travelStartFrom) {
      cleanedFilters.travelStartFrom = filters.travelStartFrom;
    }
    if (filters.travelStartTo) {
      cleanedFilters.travelStartTo = filters.travelStartTo;
    }
    if (filters.travelEndFrom) {
      cleanedFilters.travelEndFrom = filters.travelEndFrom;
    }
    if (filters.travelEndTo) {
      cleanedFilters.travelEndTo = filters.travelEndTo;
    }
    if (filters.dueAmountMin !== undefined && filters.dueAmountMin !== null) {
      cleanedFilters.dueAmountMin = filters.dueAmountMin;
    }
    if (filters.dueAmountMax !== undefined && filters.dueAmountMax !== null) {
      cleanedFilters.dueAmountMax = filters.dueAmountMax;
    }

    onFilter(cleanedFilters);
    setIsOpen(false);
  }, [filters, onFilter]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    onClear();
    setIsOpen(false);
  }, [onClear]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 border transition-colors ${
          activeFilterCount > 0
            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[480px] bg-white border border-gray-200 shadow-lg z-50">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Booking Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Status
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    handleInputChange("status", e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="">All</option>
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Ticketed">Ticketed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "paymentStatus",
                      e.target.value as
                        | "paid"
                        | "partial"
                        | "unpaid"
                        | undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Due Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Amount <span className="text-blue-500 text-xs">Minimum</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.dueAmountMin ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "dueAmountMin",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Amount <span className="text-blue-500 text-xs">Maximum</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.dueAmountMax ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "dueAmountMax",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              {/* Booking Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Date <span className="text-blue-500 text-xs">Range From</span>
                </label>
                <input
                  type="date"
                  value={filters.bookingDateFrom || ""}
                  onChange={(e) =>
                    handleInputChange("bookingDateFrom", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Date <span className="text-blue-500 text-xs">Range To</span>
                </label>
                <input
                  type="date"
                  value={filters.bookingDateTo || ""}
                  onChange={(e) =>
                    handleInputChange("bookingDateTo", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              {/* Travel Start Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Start <span className="text-blue-500 text-xs">Range From</span>
                </label>
                <input
                  type="datetime-local"
                  value={filters.travelStartFrom || ""}
                  onChange={(e) =>
                    handleInputChange("travelStartFrom", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Start <span className="text-blue-500 text-xs">Range To</span>
                </label>
                <input
                  type="datetime-local"
                  value={filters.travelStartTo || ""}
                  onChange={(e) =>
                    handleInputChange("travelStartTo", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              {/* Travel End Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel End <span className="text-blue-500 text-xs">Range From</span>
                </label>
                <input
                  type="datetime-local"
                  value={filters.travelEndFrom || ""}
                  onChange={(e) =>
                    handleInputChange("travelEndFrom", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel End <span className="text-blue-500 text-xs">Range To</span>
                </label>
                <input
                  type="datetime-local"
                  value={filters.travelEndTo || ""}
                  onChange={(e) =>
                    handleInputChange("travelEndTo", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={X}
                  onClick={handleClearFilters}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={Filter}
                onClick={handleApplyFilters}
                disabled={isLoading}
              >
                {isLoading ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFilter;
