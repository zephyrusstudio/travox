import { Building2, FileText, Plus, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import { Vendor } from "../../types";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import ConfirmDestructionModal from "../ui/common/ConfirmDestructionModal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Loader from "../ui/Loader";
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
  const navigate = useNavigate();
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

  // ── Search ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    invalidateCache,
  } = useSearch<Vendor>({
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
  const expenses = useMemo(() => [] as Expense[], []);

  // Derived
  const filteredVendors = useMemo(() => {
    const result = searchTerm ? searchResults : vendors;
    return Array.isArray(result) ? result : [];
  }, [searchTerm, searchResults, vendors]);

  // Helpers
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<{ data: Vendor[]; count?: number }>({ 
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
  }, [currentPage, itemsPerPage]);

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
        const response = await apiRequest<{
          data: {
            id: string;
            bankName: string;
            ifscCode: string;
            branchName: string;
            accountNo: string;
            upiId: string;
          };
        }>({
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

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Vendor Management
          </h1>
          <p className="text-gray-600">
            Manage your travel service providers and suppliers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            onClick={() => navigate("/vendors/report")}
            icon={FileText}
            variant="outline"
          >
            Report
          </Button>
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
        <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div className="grid grid-cols-1 gap-6">
        <div className="relative">
          <VendorTable.SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Loader isLoading={isSearching} />
        </div>
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
      <ConfirmDestructionModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteOpen(false);
            setDeleteTargetId(null);
          }
        }}
        title="Delete vendor?"
        message="This action will permanently remove the vendor record."
        error={errorMsg}
        onConfirm={doDelete}
        loading={deleting}
        confirmText="Delete"
      />
    </div>
  );
};

export default VendorManagement;
