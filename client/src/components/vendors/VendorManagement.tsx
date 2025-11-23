import { Plus, Search, RefreshCw, Building2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCachedSearch } from "../../hooks/useCachedSearch";
import { Vendor } from "../../types";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import AccountFormModal, { AccountFormState } from "../ui/common/AccountFormModal";
import VendorFormModal, { VendorFormState } from "./VendorFormModal";
import VendorTable from "./VendorTable";

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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorFormState | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Account management state
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [selectedVendorForAccount, setSelectedVendorForAccount] = useState<Vendor | null>(null);
  const [existingAccountData, setExistingAccountData] = useState<AccountFormState | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Search with caching ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    invalidateCache,
  } = useCachedSearch<Vendor>({
    endpoint: "/vendors",
    searchFields: (vendor) => [
      vendor.name || "",
      vendor.serviceType || "",
      vendor.pocName || "",
    ],
    initialFetch: true,
    unmask: true,
  });

  // Replace with API/selector
  const expenses: Expense[] = [];

  // Derived
  const filteredVendors = useMemo(() => {
    // Use search results when searching, otherwise use paginated vendors
    return searchTerm ? searchResults : vendors;
  }, [searchTerm, searchResults, vendors]);

  const totalExpensesAmount = useMemo(
    () => expenses.reduce((t, e) => t + (e.amount || 0), 0),
    [expenses]
  );

  // Helpers
  const fetchVendors = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({ 
        method: "GET", 
        url: `/vendors?unmask=true&limit=${itemsPerPage}&offset=${offset}` 
      });
      const data = res?.data ?? [];
      setVendors(data);
      // Use count from API response if available
      setTotalItems(res?.count ?? data.length);
    } catch (e) {
      const err = e as ApiError;
      setErrorMsg(err.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
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
      invalidateCache(); // Invalidate search cache when data changes
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
    invalidateCache(); // Invalidate search cache when data changes
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
  }, [currentPage, itemsPerPage]);

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
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchVendors}
            icon={RefreshCw}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button onClick={() => openForm()} icon={Plus}>
            Create Vendor
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
      <div className="grid grid-cols-1 gap-6">
        <VendorTable.SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Pagination */}
      {!loading && (
        filteredVendors.length > 0 && (
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
              <span className="text-gray-600">Loading vendors...</span>
            </div>
          </CardContent>
        </Card>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Found</h3>
          <p className="text-gray-500">Get started by adding your first vendor.</p>
        </div>
      ) : (
        <VendorTable
          vendors={filteredVendors}
          onEdit={openForm}
          onDelete={askDelete}
          onManageAccount={manageAccount}
          getVendorExpenseTotal={getVendorExpenseTotal}
          totalExpense={0}
        />
      )}

      {/* Add/Edit Vendor Modal */}
      <VendorFormModal
        isOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        title={selectedVendor ? "Edit Vendor" : "Create Vendor"}
        isEditing={Boolean(selectedVendor)}
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
        serviceTypes={[...SERVICE_TYPES] as unknown as string[]}
        onVendorSaved={() => {
          invalidateCache(); // Invalidate search cache when data changes
          fetchVendors();
        }}
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
