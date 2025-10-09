/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/customers/CustomerManagement.tsx
import { Plus, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Customer } from "../../types";

import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import AccountFormModal, { AccountFormState } from "../ui/common/AccountFormModal";
import CustomerFormModal, { CustomerFormState } from "./CustomerFormModal";
import CustomerTable from "./CustomerTable";
import TicketHistoryModal from "./TicketHistoryModal";
import useCustomerSearch from "./useCustomerSearch";

const CustomerManagement: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [selectedCustomerForAccount, setSelectedCustomerForAccount] = useState<Customer | null>(null);
  const [existingAccountData, setExistingAccountData] = useState<AccountFormState | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { searchTerm, setSearchTerm, filtered } = useCustomerSearch(customers);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setErrorMsg(null);
    try {
      const res = await apiRequest<any>({ method: "GET", url: "/customers?unmask=true" });
      setCustomers(res?.data ?? []);
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to fetch customers");
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

  const manageAccount = async (customer: Customer) => {
    setSelectedCustomerForAccount(customer);
    
    if (customer.accountId) {
      // Fetch existing account data
      try {
        const response = await apiRequest<any>({
          method: "GET",
          url: `/customers/${customer.id}/account`,
        });
        if (response?.status === "success" && response?.data) {
          setExistingAccountData({
            id: response.data.id,
            bankName: response.data.bankName || "",
            ifscCode: response.data.ifscCode || "",
            branchName: response.data.branchName || "",
            accountNo: response.data.accountNo || "",
            upiId: response.data.upiId || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch account data:", error);
        setExistingAccountData(null);
      }
    } else {
      setExistingAccountData(null);
    }
    
    setIsAccountFormOpen(true);
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
          <Button
            variant="outline"
            onClick={() => (window.location.hash = "#tickets")}
            icon={Upload}
          >
            Upload Tickets
          </Button>
          <Button onClick={() => openForm()} icon={Plus}>
            Add Customer
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
      {customers.length > 0 && (
        <CustomerTable
          customers={filtered}
          onEdit={openForm}
          onDelete={askDelete}
          onViewTickets={viewTicketHistory}
          onManageAccount={manageAccount}
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
