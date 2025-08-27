import React, { useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import { Refund } from '../../types';

const RefundManagement: React.FC = () => {
  const { refunds, bookings, addRefund } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    booking_id: '',
    refund_date: '',
    refund_amount: 0,
    refund_reason: '',
    refund_mode: 'Bank Transfer'
  });

  const refundModes = ['Bank Transfer', 'Cash', 'UPI', 'Cheque'];

  const filteredRefunds = refunds.filter(refund => {
    const booking = bookings.find(b => b.booking_id === refund.booking_id);
    return (
      refund.refund_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = () => {
    setFormData({
      booking_id: '',
      refund_date: new Date().toISOString().split('T')[0],
      refund_amount: 0,
      refund_reason: '',
      refund_mode: 'Bank Transfer'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRefund(formData);
    handleCloseModal();
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.booking_id === bookingId);
    setFormData({
      ...formData,
      booking_id: bookingId,
      refund_amount: booking ? Math.min(booking.advance_received, booking.total_amount) : 0
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getRefundStats = () => {
    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, r) => sum + r.refund_amount, 0);
    const thisMonthRefunds = refunds.filter(r => {
      const refundDate = new Date(r.refund_date);
      const now = new Date();
      return refundDate.getMonth() === now.getMonth() && refundDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthRefunds.reduce((sum, r) => sum + r.refund_amount, 0);

    return { totalRefunds, totalAmount, thisMonthAmount };
  };

  const stats = getRefundStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600">Process and track customer refunds</p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Process Refund
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.totalRefunds}</p>
            <p className="text-sm text-gray-600">Total Refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">₹{stats.totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-8 h-8 text-purple-600 mx-auto mb-2" />
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
            placeholder="Search refunds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Refund History</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Booking Details</TableCell>
                <TableCell header>Refund Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Reason</TableCell>
                <TableCell header>Mode</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map((refund) => {
                const booking = bookings.find(b => b.booking_id === refund.booking_id);
                return (
                  <TableRow key={refund.refund_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking?.package_name}</p>
                        <p className="text-sm text-gray-500">{booking?.customer_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDate(refund.refund_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        ₹{refund.refund_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {refund.refund_reason}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {refund.refund_mode}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Process Refund Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Process Refund"
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
                  .filter(booking => booking.advance_received > 0)
                  .map(booking => (
                    <option key={booking.booking_id} value={booking.booking_id}>
                      {booking.package_name} - {booking.customer_name} (Paid: ₹{booking.advance_received.toLocaleString()})
                    </option>
                  ))}
              </select>
              {formData.booking_id && (
                <p className="text-sm text-gray-500 mt-1">
                  Max refundable: ₹{bookings.find(b => b.booking_id === formData.booking_id)?.advance_received.toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Date *
              </label>
              <input
                type="date"
                required
                value={formData.refund_date}
                onChange={(e) => setFormData({ ...formData, refund_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.refund_amount}
                onChange={(e) => setFormData({ ...formData, refund_amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Mode *
              </label>
              <select
                required
                value={formData.refund_mode}
                onChange={(e) => setFormData({ ...formData, refund_mode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {refundModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason *
            </label>
            <textarea
              rows={3}
              required
              value={formData.refund_reason}
              onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
              placeholder="Explain why the refund is being processed..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              Process Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RefundManagement;