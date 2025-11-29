import React, { useState } from 'react';
import { ArrowLeft, Download, Calendar, Users, IndianRupee, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const DetailedBookingsView: React.FC = () => {
  const { bookings, customers } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const dateMatch = bookingDate >= start && bookingDate <= end;
    const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const totalBookings = filteredBookings.length;
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
  const totalValue = filteredBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const averageBookingValue = totalBookings > 0 ? totalValue / totalBookings : 0;
  const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings * 100) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
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
            <h1 className="text-2xl font-bold text-gray-900">Bookings Analysis</h1>
            <p className="text-gray-600">Comprehensive booking performance and trends</p>
          </div>
        </div>
        <Button icon={Download}>
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{totalBookings}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₹{(totalValue / 100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">₹{averageBookingValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Average Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Booking Status Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">{confirmedBookings}</p>
              <p className="text-sm font-medium text-green-700">Confirmed Bookings</p>
              <p className="text-xs text-green-600 mt-1">
                {totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="bg-yellow-50 p-6 text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-yellow-600 mb-2">{pendingBookings}</p>
              <p className="text-sm font-medium text-yellow-700">Pending Bookings</p>
              <p className="text-xs text-yellow-600 mt-1">
                {totalBookings > 0 ? ((pendingBookings / totalBookings) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="bg-red-50 p-6 text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-red-600 mb-2">{cancelledBookings}</p>
              <p className="text-sm font-medium text-red-700">Cancelled Bookings</p>
              <p className="text-xs text-red-600 mt-1">
                {totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Bookings Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Package</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Travel Dates</TableCell>
                <TableCell header>Pax</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Balance</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{booking.package_name}</p>
                      <p className="text-sm text-gray-500">
                        Booked: {formatDate(booking.booking_date)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">{booking.customer_name}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {formatDate(booking.travel_start_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        to {formatDate(booking.travel_end_date)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {booking.pax_count} {booking.pax_count === 1 ? 'person' : 'people'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{booking.total_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Paid: ₹{booking.advance_received.toLocaleString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status) as any} size="sm">
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.balance_amount > 0 ? (
                      <span className="font-semibold text-red-600">
                        ₹{booking.balance_amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-semibold text-green-600">Paid</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedBookingsView;