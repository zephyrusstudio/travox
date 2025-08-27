import React, { useState } from 'react';
import { Plus, Search, CreditCard, Receipt } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import { Payment } from '../../types';

const PaymentManagement: React.FC = () => {
  const { payments, bookings, addPayment, customers } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    booking_id: '',
    payment_date: '',
    amount: 0,
    payment_mode: 'cash' as 'cash' | 'upi' | 'credit_card' | 'bank_transfer',
    receipt_number: '',
    notes: ''
  });

  const filteredPayments = payments.filter(payment => {
    const booking = bookings.find(b => b.booking_id === payment.booking_id);
    return (
      payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = () => {
    setFormData({
      booking_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_mode: 'cash',
      receipt_number: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment(formData);
    handleCloseModal();
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCPT${timestamp}${randomNum}`;
  };

  const handleBookingSelect = (bookingId: string) => {
    setFormData({
      ...formData,
      booking_id: bookingId,
      receipt_number: generateReceiptNumber()
    });
  };

  const getPaymentModeVariant = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'success';
      case 'upi':
        return 'info';
      case 'credit_card':
        return 'warning';
      case 'bank_transfer':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'Cash';
      case 'upi':
        return 'UPI';
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return mode;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getPaymentStats = () => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const thisMonthPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    return { totalPayments, totalAmount, thisMonthAmount };
  };

  const stats = getPaymentStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track and manage customer payments</p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.totalPayments}</p>
            <p className="text-sm text-gray-600">Total Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₹{stats.thisMonthAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Receipt No.</TableCell>
                <TableCell header>Booking Details</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
                <TableCell header>Notes</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const booking = bookings.find(b => b.booking_id === payment.booking_id);
                return (
                  <TableRow key={payment.payment_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">{payment.receipt_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking?.package_name}</p>
                        <p className="text-sm text-gray-500">{booking?.customer_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentModeVariant(payment.payment_mode) as any} size="sm">
                        {getPaymentModeLabel(payment.payment_mode)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {payment.notes || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Record New Payment"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking *
              </label>
              <select
                required
                value={formData.booking_id}
                onChange={(e) => handleBookingSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Booking</option>
                {bookings
                  .filter(booking => booking.balance_amount > 0)
                  .map(booking => (
                    <option key={booking.booking_id} value={booking.booking_id}>
                      {booking.package_name} - {booking.customer_name} (Balance: ₹{booking.balance_amount.toLocaleString()})
                    </option>
                  ))}
              </select>
              {formData.booking_id && (
                <p className="text-sm text-gray-500 mt-1">
                  Outstanding balance: ₹{bookings.find(b => b.booking_id === formData.booking_id)?.balance_amount.toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode *
              </label>
              <select
                required
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Number *
              </label>
              <input
                type="text"
                required
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentManagement;