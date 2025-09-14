import { Plus, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Vendor } from "../../types";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import VendorFormModal from "./VendorFormModal";
import VendorGrid from "./VendorGrid";
const serviceTypes = [
  "Flight",
  "Hotel",
  "Visa",
  "Transport",
  "Insurance",
  "Other",
] as const;

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    serviceType: "",
    pocName: "",
    phone: "",
    email: "",
    gstin: "",
    accountId: "",
  });

  // NOTE: placeholder; wire your real expenses source here
  const expenses: Array<{ vendor_id: string; amount: number }> = [];

  const filteredVendors = useMemo(
    () =>
      vendors.filter(
        (vendor) =>
          vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.service_type
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vendor.contact_person
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [vendors, searchTerm]
  );

  const getVendorExpenseTotal = (vendorId: string) =>
    expenses
      .filter((e) => e.vendor_id === vendorId)
      .reduce((t, e) => t + e.amount, 0);

  const totalExpensesAmount = useMemo(
    () => expenses.reduce((t, e) => t + e.amount, 0),
    [expenses]
  );

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData({
        name: vendor.name,
        serviceType: vendor.serviceType,
        pocName: vendor.pocName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        gstin: vendor.gstin || "",
        accountId: vendor.accountId || "",
      });
    } else {
      setSelectedVendor(null);
      setFormData({
        name: "",
        serviceType: "",
        pocName: "",
        email: "",
        phone: "",
        gstin: "",
        accountId: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVendor(null);
    setFormData({
      name: "",
      serviceType: "",
      pocName: "",
      email: "",
      phone: "",
      gstin: "",
      accountId: "",
    });
  };

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    // if (selectedVendor) {
    //   updateVendor(selectedVendor.vendor_id, formData);
    // } else {
    //   addVendor(formData);
    // }
    handleCloseModal();
  };

  const handleDelete = (vendorId: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      // deleteVendor(vendorId);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{vendors.length}</p>
            <p className="text-sm text-gray-600">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              ₹{totalExpensesAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Cards Grid */}
      <VendorGrid
        vendors={filteredVendors}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        getVendorExpenseTotal={getVendorExpenseTotal}
      />

      {/* Add/Edit Vendor Modal */}
      <VendorFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedVendor ? "Edit Vendor" : "Add New Vendor"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        serviceTypes={serviceTypes as unknown as string[]}
      />
    </div>
  );
};

export default VendorManagement;
