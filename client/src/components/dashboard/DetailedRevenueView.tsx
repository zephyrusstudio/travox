import React, { useState } from 'react';
import { ArrowLeft, Download, TrendingUp, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const DetailedRevenueView: React.FC = () => {
  const { payments, bookings, customers } = useApp();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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
    return new Date(dateString).toLocaleDateString('en-IN');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => window.location.hash = '#dashboard'}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analysis</h1>
            <p className="text-gray-600">Detailed revenue breakdown and payment insights</p>
          </div>
        </div>
        <Button icon={Download}>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
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
              <div key={mode} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getPaymentModeVariant(mode) as any} size="sm">
                    {mode.replace('_', ' ').toUpperCase()}
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
              <div key={month} className="bg-blue-50 rounded-lg p-4 text-center">
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
                        {payment.payment_mode.replace('_', ' ').toUpperCase()}
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