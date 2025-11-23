/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/customers/CustomerManagement.tsx
import { Plus, RefreshCw, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Customer } from "../../types";

import { useCachedSearch } from "../../hooks/useCachedSearch";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import AccountFormModal, {
  AccountFormState,
} from "../ui/common/AccountFormModal";
import CustomerFormModal, { CustomerFormState } from "./CustomerFormModal";
import CustomerTable from "./CustomerTable";
import CustomerBookingsModal from "./CustomerBookingsModal";

const CustomerManagement: React.FC = () => {
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

  // ── Search with caching ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    invalidateCache,
  } = useCachedSearch<Customer>({
    endpoint: "/customers",
    searchFields: (customer) => [
      customer.name || "",
      customer.email || "",
      customer.phone || "",
    ],
    initialFetch: true,
    unmask: true,
  });

  // Use search results if searching, otherwise use paginated customers
  const displayCustomers = searchTerm ? searchResults : customers;

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
      invalidateCache(); // Invalidate search cache when data changes
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
    invalidateCache(); // Invalidate search cache when data changes
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600">
            Manage your travel customers and their information
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchCustomers}
            icon={RefreshCw}
            variant="outline"
            className="flex gap-3"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button onClick={() => openForm()} className="flex gap-3">
            Save / Add Customer
          </Button>
        </div>
      </div>

      {/* Inline error */}
      {errorMsg && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
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
        </div>
      </div>

      {/* Pagination */}
      {loading ? (
        <div className="flex items-center rounded-xl justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-52"></div>
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-8 bg-gray-200 rounded-md animate-pulse w-16"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      ) : (
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  All Customers
                </h3>
                <p className="text-sm text-gray-600">
                  Manage customer information and view booking history
                </p>
              </div>
              <div className="flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Loading customers...
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      GSTIN
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Bookings
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Total Spent
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-28"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-36"></div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-12"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div>
                          <div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div>
                          <div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div>
                          <div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteOpen(false);
            setDeleteTargetId(null);
          }
        }}
        title="Delete customer?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            This action will permanently remove the customer record.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm"
              onClick={() => {
                setIsDeleteOpen(false);
                setDeleteTargetId(null);
              }}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-60"
              onClick={doDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
