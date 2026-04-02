import React, { useState } from 'react';
import { ArrowLeft, Download, TrendingUp, IndianRupee, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const DetailedRevenueView: React.FC = () => {
  const { payments, bookings } = useApp();
  const navigate = useNavigate();
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

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return paymentDate >= start && paymentDate <= end;
  });

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
  
  const paymentModeBreakdown = filteredPayments.reduce((acc, payment) => {
    acc[payment.payment_mode] = (acc[payment.payment_mode] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyRevenue = filteredPayments.reduce((acc, payment) => {
    const month = new Date(payment.payment_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getPaymentModeVariant = (mode: string) => {
    const normalized = mode.toLowerCase();
    switch (normalized) {
      case 'cash':
        return 'success';
      case 'upi':
        return 'info';
      case 'card':
      case 'credit_card':
        return 'warning';
      case 'bank_transfer':
        return 'default';
      case 'netbanking':
        return 'info';
      case 'cheque':
        return 'default';
      case 'wallet':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleExportReport = () => {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [
      'Payment Ref',
      'Date',
      'Receipt No',
      'Booking Ref',
      'Customer',
      'Package',
      'Payment Mode',
      'Amount',
    ];

    const rows = filteredPayments.map((payment) => {
      const booking = bookings.find((item) => item.booking_id === payment.booking_id);
      return [
        payment.payment_id,
        payment.payment_date,
        payment.receipt_number || payment.payment_id,
        payment.booking_id,
        booking?.customer_name || '',
        booking?.package_name || '',
        payment.payment_mode,
        payment.amount,
      ];
    });

    const csv = [
      header.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue-analysis-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/legacy/dashboard')}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analysis</h1>
            <p className="text-gray-600">Detailed revenue breakdown and payment insights</p>
          </div>
        </div>
        <Button icon={Download} onClick={handleExportReport}>
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">₹{(totalRevenue / 100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{filteredPayments.length}</p>
            <p className="text-sm text-gray-600">Total Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₹{averagePayment.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Average Payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{Object.keys(paymentModeBreakdown).length}</p>
            <p className="text-sm text-gray-600">Payment Methods</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Mode Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Payment Mode Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(paymentModeBreakdown).map(([mode, amount]) => (
              <div key={mode} className="bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getPaymentModeVariant(mode) as any} size="sm">
                    {mode.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {((amount / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(monthlyRevenue).map(([month, amount]) => (
              <div key={month} className="bg-blue-50 p-4 text-center">
                <p className="text-sm font-medium text-blue-600 mb-1">{month}</p>
                <p className="text-xl font-bold text-blue-700">₹{(amount / 100000).toFixed(1)}L</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Payments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Date</TableCell>
                <TableCell header>Receipt No.</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Package</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const booking = bookings.find(b => b.booking_id === payment.booking_id);
                return (
                  <TableRow key={payment.payment_id}>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{payment.receipt_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{booking?.customer_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{booking?.package_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentModeVariant(payment.payment_mode) as any} size="sm">
                        {payment.payment_mode.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedRevenueView;
