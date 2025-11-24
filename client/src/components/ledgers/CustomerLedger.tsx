import React, { useState } from 'react';
import { Search, Download, Eye, Calendar, DollarSign, CreditCard, FileText } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const CustomerLedger: React.FC = () => {
  const { customers, bookings, payments, refunds } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerLedgerData = (customerId: string) => {
    const customerBookings = bookings.filter(b => b.customer_id === customerId);
    const customerPayments = payments.filter(p => 
      customerBookings.some(b => b.booking_id === p.booking_id)
    );
    const customerRefunds = refunds.filter(r => 
      customerBookings.some(b => b.booking_id === r.booking_id)
    );

    const totalBookings = customerBookings.length;
    const totalAmount = customerBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = customerRefunds.reduce((sum, r) => sum + r.refund_amount, 0);
    const outstandingAmount = customerBookings.reduce((sum, b) => sum + b.balance_amount, 0);

    return {
      totalBookings,
      totalAmount,
      totalPaid,
      totalRefunded,
      outstandingAmount,
      netAmount: totalAmount - totalRefunded,
      bookings: customerBookings,
      payments: customerPayments,
      refunds: customerRefunds
    };
  };

  const handleViewDetails = (customer: any) => {
    const ledgerData = getCustomerLedgerData(customer.customer_id);
    setSelectedCustomerData({ ...customer, ...ledgerData });
    setIsDetailModalOpen(true);
  };

  const exportLedger = (customerId?: string) => {
    const customersToExport = customerId ? [customers.find(c => c.customer_id === customerId)] : filteredCustomers;
    
    const csvData = customersToExport.map(customer => {
      if (!customer) return null;
      const ledgerData = getCustomerLedgerData(customer.customer_id);
      return {
        'Customer Name': customer.full_name,
        'Email': customer.email || '',
        'Phone': customer.phone || '',
        'GSTIN': customer.gstin || '',
        'Total Bookings': ledgerData.totalBookings,
        'Total Amount': ledgerData.totalAmount,
        'Total Paid': ledgerData.totalPaid,
        'Total Refunded': ledgerData.totalRefunded,
        'Outstanding Amount': ledgerData.outstandingAmount,
        'Net Amount': ledgerData.netAmount
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
      link.setAttribute('download', `customer_ledger_${dateStr}.csv`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Ledger</h1>
          <p className="text-gray-600">View customer account statements and transaction history</p>
        </div>
        <Button onClick={() => exportLedger()} icon={Download}>
          Export All Ledgers
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Ledger Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Customer Account Summary</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Customer</TableCell>
                <TableCell header>Contact</TableCell>
                <TableCell header>Bookings</TableCell>
                <TableCell header>Total Amount</TableCell>
                <TableCell header>Paid Amount</TableCell>
                <TableCell header>Outstanding</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const ledgerData = getCustomerLedgerData(customer.customer_id);
                return (
                  <TableRow key={customer.customer_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{customer.full_name}</p>
                        {customer.gstin && (
                          <p className="text-sm text-gray-500">GSTIN: {customer.gstin}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {customer.email && (
                          <p className="text-sm text-gray-900">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {ledgerData.totalBookings} bookings
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        ₹{ledgerData.totalAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ₹{ledgerData.totalPaid.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        ledgerData.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{ledgerData.outstandingAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewDetails(customer)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => exportLedger(customer.customer_id)}
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

      {/* Customer Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Customer Ledger - ${selectedCustomerData?.full_name}`}
        size="xl"
      >
        {selectedCustomerData && (
          <div className="space-y-6">
            {/* Customer Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  ₹{selectedCustomerData.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Paid Amount</span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  ₹{selectedCustomerData.totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Outstanding</span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  ₹{selectedCustomerData.outstandingAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Bookings</span>
                </div>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {selectedCustomerData.totalBookings}
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Bookings */}
                {selectedCustomerData.bookings.map((booking: any) => (
                  <div key={`booking-${booking.booking_id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.package_name}</p>
                      <p className="text-sm text-gray-600">Booking Date: {formatDate(booking.booking_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₹{booking.total_amount.toLocaleString()}</p>
                      <Badge variant="info" size="sm">Booking</Badge>
                    </div>
                  </div>
                ))}

                {/* Payments */}
                {selectedCustomerData.payments.map((payment: any) => (
                  <div key={`payment-${payment.payment_id}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Payment Received</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(payment.payment_date)}</p>
                      <p className="text-sm text-gray-600">Mode: {payment.payment_mode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+₹{payment.amount.toLocaleString()}</p>
                      <Badge variant="success" size="sm">Payment</Badge>
                    </div>
                  </div>
                ))}

                {/* Refunds */}
                {selectedCustomerData.refunds.map((refund: any) => (
                  <div key={`refund-${refund.refund_id}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Refund Processed</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(refund.refund_date)}</p>
                      <p className="text-sm text-gray-600">Reason: {refund.refund_reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-₹{refund.refund_amount.toLocaleString()}</p>
                      <Badge variant="danger" size="sm">Refund</Badge>
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

export default CustomerLedger;