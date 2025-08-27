import React, { useState } from 'react';
import { Plus, Search, Receipt, Upload } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import { Expense } from '../../types';

const ExpenseManagement: React.FC = () => {
  const { expenses, vendors, bookings, addExpense } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    vendor_id: '',
    booking_id: '',
    category: '',
    amount: 0,
    description: '',
    payment_mode: 'Bank Transfer',
    invoice_number: ''
  });

  const categories = ['Flight', 'Hotel', 'Visa', 'Transport', 'Insurance', 'Marketing', 'Office', 'Other'];
  const paymentModes = ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque'];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vendor_id: '',
      booking_id: '',
      category: '',
      amount: 0,
      description: '',
      payment_mode: 'Bank Transfer',
      invoice_number: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.vendor_id === formData.vendor_id);
    const expenseData = {
      ...formData,
      vendor_name: vendor?.vendor_name || ''
    };
    addExpense(expenseData);
    handleCloseModal();
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'Flight':
        return 'info';
      case 'Hotel':
        return 'success';
      case 'Visa':
        return 'warning';
      case 'Transport':
        return 'default';
      case 'Marketing':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getExpenseStats = () => {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { totalExpenses, totalAmount, thisMonthAmount };
  };

  const stats = getExpenseStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Track and manage business expenses</p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.totalExpenses}</p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">₹{stats.totalAmount.toLocaleString()}</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Expense History</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Date</TableCell>
                <TableCell header>Vendor</TableCell>
                <TableCell header>Category</TableCell>
                <TableCell header>Description</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
                <TableCell header>Invoice</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.expense_id}>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {expense.vendor_name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(expense.category) as any} size="sm">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {expense.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {expense.payment_mode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 font-mono">
                      {expense.invoice_number || '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Expense"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Booking
              </label>
              <select
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Booking (Optional)</option>
                {bookings.map(booking => (
                  <option key={booking.booking_id} value={booking.booking_id}>
                    {booking.package_name} - {booking.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the expense..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpenseManagement;