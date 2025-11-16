/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/customers/CustomerManagement.tsx
import { Plus, RefreshCw, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Customer } from "../../types";

import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import AccountFormModal, {
  AccountFormState,
} from "../ui/common/AccountFormModal";
import CustomerFormModal, { CustomerFormState } from "./CustomerFormModal";
import CustomerTable from "./CustomerTable";
import TicketHistoryModal from "./TicketHistoryModal";
import useCustomerSearch from "./useCustomerSearch";

const CustomerManagement: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerFormState | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Account management state
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [selectedCustomerForAccount, setSelectedCustomerForAccount] =
    useState<Customer | null>(null);
  const [existingAccountData, setExistingAccountData] =
    useState<AccountFormState | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { searchTerm, setSearchTerm, filtered } = useCustomerSearch(customers);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/customers?unmask=true",
      });
      setCustomers(res?.data ?? []);
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

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
      fetchCustomers();
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const viewTicketHistory = (customer: Customer) => {
    // Replace with API integration when available
    const mockTickets = [
      {
        id: "1",
        fileName: "Delhi_Mumbai_Ticket.pdf",
        uploadDate: "2024-12-01",
        pnr: "ABC123",
        route: "DEL-BOM",
        amount: 15000,
        status: "finalized",
        linkedBookingId: "booking-1",
      },
      {
        id: "2",
        fileName: "International_Flight_Ticket.pdf",
        uploadDate: "2024-11-15",
        pnr: "XYZ789",
        route: "DEL-LHR",
        amount: 85000,
        status: "finalized",
        linkedBookingId: "booking-2",
      },
    ];
    setSelectedCustomer(customer);
    setHistoryTickets(mockTickets);
    setIsHistoryOpen(true);
  };

  const handleAccountLinked = () => {
    // Refresh customers list to get updated accountId
    fetchCustomers();
    setIsAccountFormOpen(false);
    setSelectedCustomerForAccount(null);
    setExistingAccountData(null);
  };

  // placeholder until wired from context/store
  const getBookingsByCustomer = (_id: string) => [] as any[];

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCustomers();
  }, []);

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
          <Button onClick={() => openForm()} icon={Plus}>
            Save & Add Customer
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
          customers={filtered}
          onEdit={openForm}
          onDelete={askDelete}
          onViewTickets={viewTicketHistory}
          getBookingsByCustomer={getBookingsByCustomer}
        />
      )}

      {/* Ticket History Modal */}
      <TicketHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={selectedCustomer}
        tickets={historyTickets}
      />

      {/* Add/Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
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
