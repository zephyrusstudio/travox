import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import { Vendor } from '../../types';

const VendorManagement: React.FC = () => {
  const { vendors, addVendor, updateVendor, deleteVendor, expenses } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    vendor_name: '',
    service_type: '',
    contact_person: '',
    email: '',
    phone: '',
    bank_details: ''
  });

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData({
        vendor_name: vendor.vendor_name,
        service_type: vendor.service_type,
        contact_person: vendor.contact_person || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        bank_details: vendor.bank_details || ''
      });
    } else {
      setSelectedVendor(null);
      setFormData({
        vendor_name: '',
        service_type: '',
        contact_person: '',
        email: '',
        phone: '',
        bank_details: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVendor(null);
    setFormData({
      vendor_name: '',
      service_type: '',
      contact_person: '',
      email: '',
      phone: '',
      bank_details: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVendor) {
      updateVendor(selectedVendor.vendor_id, formData);
    } else {
      addVendor(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (vendorId: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteVendor(vendorId);
    }
  };

  const getVendorExpenseTotal = (vendorId: string) => {
    return expenses
      .filter(expense => expense.vendor_id === vendorId)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getServiceTypeVariant = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'flight':
        return 'info';
      case 'hotel':
        return 'success';
      case 'visa':
        return 'warning';
      default:
        return 'default';
    }
  };

  const serviceTypes = ['Flight', 'Hotel', 'Visa', 'Transport', 'Insurance', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage your travel service providers and suppliers</p>
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
              ₹{expenses.reduce((total, expense) => total + expense.amount, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => {
          const totalExpenses = getVendorExpenseTotal(vendor.vendor_id);
          return (
            <Card key={vendor.vendor_id} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.vendor_name}</h3>
                      <Badge 
                        variant={getServiceTypeVariant(vendor.service_type) as any} 
                        size="sm"
                      >
                        {vendor.service_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleOpenModal(vendor)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(vendor.vendor_id)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {vendor.contact_person && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span> {vendor.contact_person}
                    </p>
                  )}
                  {vendor.email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {vendor.email}
                    </p>
                  )}
                  {vendor.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {vendor.phone}
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Expenses:</span>
                      <span className="text-green-600 font-semibold ml-2">
                        ₹{totalExpenses.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Details
            </label>
            <textarea
              rows={3}
              value={formData.bank_details}
              onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
              placeholder="Bank name, account number, IFSC code, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorManagement;