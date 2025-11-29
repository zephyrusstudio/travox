import React, { useState } from 'react';
import { Search, Download, Eye, Calendar, IndianRupee, CreditCard, Building2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const VendorLedger: React.FC = () => {
  const { vendors, expenses } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: (() => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })()
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVendorData, setSelectedVendorData] = useState<any>(null);

  const serviceTypes = [...new Set(vendors.map(v => v.service_type))];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesServiceType = !serviceTypeFilter || vendor.service_type === serviceTypeFilter;
    return matchesSearch && matchesServiceType;
  });

  const getVendorLedgerData = (vendorId: string) => {
    const vendorExpenses = expenses.filter(e => e.vendor_id === vendorId);
    
    const filteredExpenses = vendorExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return expenseDate >= start && expenseDate <= end;
    });

    const totalExpenses = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const paymentModeBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.payment_mode] = (acc[expense.payment_mode] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      totalAmount,
      categoryBreakdown,
      paymentModeBreakdown,
      expenses: filteredExpenses
    };
  };

  const handleViewDetails = (vendor: any) => {
    const ledgerData = getVendorLedgerData(vendor.vendor_id);
    setSelectedVendorData({ ...vendor, ...ledgerData });
    setIsDetailModalOpen(true);
  };

  const exportLedger = (vendorId?: string) => {
    const vendorsToExport = vendorId ? [vendors.find(v => v.vendor_id === vendorId)] : filteredVendors;
    
    const csvData = vendorsToExport.map(vendor => {
      if (!vendor) return null;
      const ledgerData = getVendorLedgerData(vendor.vendor_id);
      return {
        'Vendor Name': vendor.vendor_name,
        'Service Type': vendor.service_type,
        'Contact Person': vendor.contact_person || '',
        'Email': vendor.email || '',
        'Phone': vendor.phone || '',
        'Total Expenses': ledgerData.totalExpenses,
        'Total Amount': ledgerData.totalAmount,
        'Bank Details': vendor.bank_details || ''
      };
    }).filter(Boolean);

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      link.setAttribute('download', `vendor_ledger_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getServiceTypeVariant = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'flight':
        return 'info';
      case 'hotel':
        return 'success';
      case 'visa':
        return 'warning';
      case 'transport':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Ledger</h1>
          <p className="text-gray-600">Track vendor payments and expense records</p>
        </div>
        <Button onClick={() => exportLedger()} icon={Download}>
          Export All Ledgers
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300"
              />
            </div>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2"
            >
              <option value="">All Service Types</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor Ledger Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Vendor Payment Summary</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Vendor</TableCell>
                <TableCell header>Service Type</TableCell>
                <TableCell header>Contact</TableCell>
                <TableCell header>Expenses</TableCell>
                <TableCell header>Total Amount</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => {
                const ledgerData = getVendorLedgerData(vendor.vendor_id);
                return (
                  <TableRow key={vendor.vendor_id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.vendor_name}</p>
                          {vendor.contact_person && (
                            <p className="text-sm text-gray-500">{vendor.contact_person}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getServiceTypeVariant(vendor.service_type) as any} size="sm">
                        {vendor.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {vendor.email && (
                          <p className="text-sm text-gray-900">{vendor.email}</p>
                        )}
                        {vendor.phone && (
                          <p className="text-sm text-gray-600">{vendor.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {ledgerData.totalExpenses} transactions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        ₹{ledgerData.totalAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewDetails(vendor)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => exportLedger(vendor.vendor_id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Vendor Ledger - ${selectedVendorData?.vendor_name}`}
        size="xl"
      >
        {selectedVendorData && (
          <div className="space-y-6">
            {/* Vendor Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Total Paid</span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  ₹{selectedVendorData.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {selectedVendorData.totalExpenses}
                </p>
              </div>
              <div className="bg-green-50 p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Service Type</span>
                </div>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {selectedVendorData.service_type}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(selectedVendorData.categoryBreakdown).map(([category, amount]) => (
                  <div key={category} className="bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-600">{category}</p>
                    <p className="text-lg font-bold text-gray-900">₹{(amount as number).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Mode Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Mode Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(selectedVendorData.paymentModeBreakdown).map(([mode, amount]) => (
                  <div key={mode} className="bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-600">{mode}</p>
                    <p className="text-lg font-bold text-gray-900">₹{(amount as number).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedVendorData.expenses.map((expense: any) => (
                  <div key={expense.expense_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(expense.date)}</p>
                      <p className="text-sm text-gray-600">Category: {expense.category}</p>
                      <p className="text-sm text-gray-600">Payment Mode: {expense.payment_mode}</p>
                      {expense.invoice_number && (
                        <p className="text-sm text-gray-600">Invoice: {expense.invoice_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">₹{expense.amount.toLocaleString()}</p>
                      <Badge variant="danger" size="sm">Expense</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorLedger;