import { Plus, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Vendor } from "../../types";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import AccountFormModal, { AccountFormState } from "../ui/common/AccountFormModal";
import VendorFormModal, { VendorFormState } from "./VendorFormModal";
import VendorGrid from "./VendorGrid";

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  "Airline",
  "Hotel", 
  "Rail",
  "Bus",
  "Cab",
  "DMC",
  "Visa",
  "Insurance",
  "Other",
] as const;

// Placeholder; replace with your real source
type Expense = { vendor_id: string; amount: number };

// ───────────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────────
const VendorManagement: React.FC = () => {
  // State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorFormState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Account management state
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [selectedVendorForAccount, setSelectedVendorForAccount] = useState<Vendor | null>(null);
  const [existingAccountData, setExistingAccountData] = useState<AccountFormState | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Replace with API/selector
  const expenses: Expense[] = [];

  // Derived
  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const name = v.name?.toLowerCase() || "";
      const type = v.serviceType?.toLowerCase() || "";
      const poc = v.pocName?.toLowerCase() || "";
      return name.includes(q) || type.includes(q) || poc.includes(q);
    });
  }, [vendors, searchTerm]);

  const totalExpensesAmount = useMemo(
    () => expenses.reduce((t, e) => t + (e.amount || 0), 0),
    [expenses]
  );

  // Helpers
  const fetchVendors = async () => {
    setErrorMsg(null);
    try {
      const res = await apiRequest<any>({ method: "GET", url: "/vendors?unmask=true" });
      setVendors(res?.data ?? []);
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to fetch vendors");
    }
  };

  const openForm = (vendor?: Vendor) => {
    setSelectedVendor(vendor ?? null);
    setIsFormOpen(true);
  };

  const askDelete = (vendorId: string) => {
    setDeleteTargetId(vendorId);
    setIsDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await apiRequest({
        method: "DELETE",
        url: `/vendors/${deleteTargetId}`,
      });
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      fetchVendors();
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to delete vendor");
    } finally {
      setDeleting(false);
    }
  };

  const manageAccount = async (vendor: Vendor) => {
    setSelectedVendorForAccount(vendor);
    
    if (vendor.accountId) {
      // Fetch existing account data
      try {
        const response = await apiRequest<any>({
          method: "GET",
          url: `/vendors/${vendor.id}/account`,
        });
        setExistingAccountData({
          id: response.data.id,
          bankName: response.data.bankName || "",
          ifscCode: response.data.ifscCode || "",
          branchName: response.data.branchName || "",
          accountNo: response.data.accountNo || "",
          upiId: response.data.upiId || "",
        });
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMsg(apiError.message);
        setExistingAccountData(null);
      }
    } else {
      setExistingAccountData(null);
    }
    
    setIsAccountFormOpen(true);
  };

  const handleAccountLinked = () => {
    // Refresh vendors list to get updated accountId
    fetchVendors();
    setIsAccountFormOpen(false);
    setSelectedVendorForAccount(null);
    setExistingAccountData(null);
  };

  const getVendorExpenseTotal = useCallback(
    (vendorId: string) =>
      expenses
        .filter((e) => e.vendor_id === vendorId)
        .reduce((t, e) => t + (e.amount || 0), 0),
    [expenses]
  );

  // placeholder until wired from context/store
  const getExpensesByVendor = (_id: string) => [] as any[];

  useEffect(() => {
    fetchVendors();
  }, []);

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vendor Management
          </h1>
          <p className="text-gray-600">
            Manage your travel service providers and suppliers
          </p>
        </div>
        <Button onClick={() => openForm()} icon={Plus}>
          Add Vendor
        </Button>
      </div>

      {/* Inline error */}
      {errorMsg && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Search and Stats */}
      <div className="grid grid-cols-1  gap-6">
        <div className="">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
        </div>
      </div>

      {/* Grid */}
      {vendors.length > 0 && (
        <VendorGrid
          vendors={filteredVendors}
          onEdit={openForm}
          onDelete={askDelete}
          onManageAccount={manageAccount}
          getVendorExpenseTotal={getVendorExpenseTotal}
        />
      )}

      {/* Add/Edit Vendor Modal */}
      <VendorFormModal
        isOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        title={selectedVendor ? "Edit Vendor" : "Add New Vendor"}
        isEditing={Boolean(selectedVendor)}
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
        serviceTypes={[...SERVICE_TYPES] as unknown as string[]}
        onVendorSaved={fetchVendors}
      />

      {/* Account Management Modal */}
      <AccountFormModal
        isOpen={isAccountFormOpen}
        onClose={() => {
          setIsAccountFormOpen(false);
          setSelectedVendorForAccount(null);
          setExistingAccountData(null);
        }}
        entityId={selectedVendorForAccount?.id || ""}
        entityType="vendor"
        entityName={selectedVendorForAccount?.name || ""}
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
        title="Delete vendor?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            This action will permanently remove the vendor record.
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

export default VendorManagement;
