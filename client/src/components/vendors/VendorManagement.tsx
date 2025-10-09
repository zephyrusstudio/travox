/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/vendors/VendorManagement.tsx
import { Plus, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Vendor } from "../../types";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { errorToast } from "../../utils/toasts";
import Button from "../ui/Button";
import VendorFormModal from "./VendorFormModal";
import VendorGrid from "./VendorGrid";

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  "Flight",
  "Hotel",
  "Visa",
  "Transport",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    serviceType: string;
    pocName: string;
    phone: string;
    email: string;
    gstin: string;
    accountId: string;
  }>({
    name: "",
    serviceType: "",
    pocName: "",
    phone: "",
    email: "",
    gstin: "",
    accountId: "",
  });

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
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      serviceType: "",
      pocName: "",
      phone: "",
      email: "",
      gstin: "",
      accountId: "",
    });
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await apiRequest<any>({ method: "GET", url: "/vendors" });
      setVendors(res?.data ?? []);
    } catch (e) {
      const err = e as ApiError;
      errorToast("Failed to fetch vendors");
    }
  };

  const getVendorExpenseTotal = useCallback(
    (vendorId: string) =>
      expenses
        .filter((e) => e.vendor_id === vendorId)
        .reduce((t, e) => t + (e.amount || 0), 0),
    [expenses]
  );

  // Handlers
  const handleOpenModal = useCallback(
    (vendor?: Vendor) => {
      if (vendor) {
        setSelectedVendor(vendor);
        setFormData({
          name: vendor.name || "",
          serviceType: vendor.serviceType || "",
          pocName: vendor.pocName || "",
          email: vendor.email || "",
          phone: vendor.phone || "",
          gstin: vendor.gstin || "",
          accountId: vendor.accountId || "",
        });
      } else {
        setSelectedVendor(null);
        resetForm();
      }
      setIsModalOpen(true);
    },
    [resetForm]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVendor(null);
    resetForm();
  }, [resetForm]);

  const handleSubmit: React.FormEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      // TODO: wire to API
      // if (selectedVendor) {
      //   updateVendor(selectedVendor.id, formData)
      //     .then(() => refreshList());
      // } else {
      //   createVendor(formData)
      //     .then(() => refreshList());
      // }
      handleCloseModal();
    },
    [handleCloseModal /*, selectedVendor, formData */]
  );

  const handleDelete = useCallback((vendorId: string) => {
    if (!window.confirm("Delete this vendor?")) return;
    // TODO: wire to API
    // deleteVendor(vendorId).then(() => refreshList());
  }, []);

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
        <Button onClick={() => handleOpenModal()} icon={Plus}>
          Add Vendor
        </Button>
      </div>

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
      <VendorGrid
        vendors={filteredVendors}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        getVendorExpenseTotal={getVendorExpenseTotal}
      />

      {/* Modal */}
      <VendorFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedVendor ? "Edit Vendor" : "Add New Vendor"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        serviceTypes={[...SERVICE_TYPES] as unknown as string[]}
      />
    </div>
  );
};

export default VendorManagement;
