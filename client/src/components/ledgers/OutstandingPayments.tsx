import React, { useState } from 'react';
import { Search, Download, AlertCircle, Calendar, DollarSign, Clock, Phone, Mail } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const OutstandingPayments: React.FC = () => {
  const { bookings, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('amount');
  const [filterBy, setFilterBy] = useState('all');

  // Get bookings with outstanding amounts
  const outstandingBookings = bookings.filter(booking => booking.balance_amount > 0);

  const filteredBookings = outstandingBookings.filter(booking => {
    const customer = customers.find(c => c.customer_id === booking.customer_id);
    const matchesSearch = booking.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    
    const daysUntilTravel = Math.ceil((new Date(booking.travel_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    switch (filterBy) {
      case 'urgent':
        return matchesSearch && daysUntilTravel <= 7;
      case 'due-soon':
        return matchesSearch && daysUntilTravel > 7 && daysUntilTravel <= 30;
      case 'future':
        return matchesSearch && daysUntilTravel > 30;
      default:
        return matchesSearch;
    }
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.balance_amount - a.balance_amount;
      case 'date':
        return new Date(a.travel_start_date).getTime() - new Date(b.travel_start_date).getTime();
      case 'customer':
        return (a.customer_name || '').localeCompare(b.customer_name || '');
      default:
        return 0;
    }
  });

  const getTotalOutstanding = () => {
    return filteredBookings.reduce((sum, booking) => sum + booking.balance_amount, 0);
  };

  const getUrgencyLevel = (booking: any) => {
    const daysUntilTravel = Math.ceil((new Date(booking.travel_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilTravel <= 7) return { level: 'urgent', color: 'danger', label: 'Urgent' };
    if (daysUntilTravel <= 30) return { level: 'due-soon', color: 'warning', label: 'Due Soon' };
    return { level: 'future', color: 'info', label: 'Future' };
  };

  const exportOutstanding = () => {
    const csvData = sortedBookings.map(booking => {
      const customer = customers.find(c => c.customer_id === booking.customer_id);
      const urgency = getUrgencyLevel(booking);
      const daysUntilTravel = Math.ceil((new Date(booking.travel_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        'Customer Name': booking.customer_name || '',
        'Package': booking.package_name,
        'Travel Start Date': booking.travel_start_date,
        'Days Until Travel': daysUntilTravel,
        'Total Amount': booking.total_amount,
        'Advance Received': booking.advance_received,
        'Outstanding Amount': booking.balance_amount,
        'Urgency': urgency.label,
        'Customer Email': customer?.email || '',
        'Customer Phone': customer?.phone || '',
        'Booking Status': booking.status
      };
    });

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
      link.setAttribute('download', `outstanding_payments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getDaysUntilTravel = (dateString: string) => {
    const days = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getOutstandingStats = () => {
    const urgent = outstandingBookings.filter(b => getDaysUntilTravel(b.travel_start_date) <= 7);
    const dueSoon = outstandingBookings.filter(b => {
      const days = getDaysUntilTravel(b.travel_start_date);
      return days > 7 && days <= 30;
    });
    const future = outstandingBookings.filter(b => getDaysUntilTravel(b.travel_start_date) > 30);

    return {
      urgent: { count: urgent.length, amount: urgent.reduce((sum, b) => sum + b.balance_amount, 0) },
      dueSoon: { count: dueSoon.length, amount: dueSoon.reduce((sum, b) => sum + b.balance_amount, 0) },
      future: { count: future.length, amount: future.reduce((sum, b) => sum + b.balance_amount, 0) }
    };
  };

  const stats = getOutstandingStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outstanding Payments</h1>
          <p className="text-gray-600">Track pending payments and follow up with customers</p>
        </div>
        <Button onClick={exportOutstanding} icon={Download}>
          Export Outstanding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.urgent.count}</p>
            <p className="text-sm text-gray-600">Urgent (≤7 days)</p>
            <p className="text-xs text-red-600 font-semibold">₹{stats.urgent.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.dueSoon.count}</p>
            <p className="text-sm text-gray-600">Due Soon (8-30 days)</p>
            <p className="text-xs text-yellow-600 font-semibold">₹{stats.dueSoon.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.future.count}</p>
            <p className="text-sm text-gray-600">Future (&gt;30 days)</p>
            <p className="text-xs text-blue-600 font-semibold">₹{stats.future.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₹{getTotalOutstanding().toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="text-xs text-purple-600 font-semibold">{outstandingBookings.length} bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bookings or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="amount">Sort by Amount</option>
              <option value="date">Sort by Travel Date</option>
              <option value="customer">Sort by Customer</option>
            </select>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Outstanding</option>
              <option value="urgent">Urgent (≤7 days)</option>
              <option value="due-soon">Due Soon (8-30 days)</option>
              <option value="future">Future (&gt;30 days)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Payments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Outstanding Payment Details</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Customer & Package</TableCell>
                <TableCell header>Travel Date</TableCell>
                <TableCell header>Amount Details</TableCell>
                <TableCell header>Outstanding</TableCell>
                <TableCell header>Urgency</TableCell>
                <TableCell header>Contact</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBookings.map((booking) => {
                const customer = customers.find(c => c.customer_id === booking.customer_id);
                const urgency = getUrgencyLevel(booking);
                const daysUntilTravel = getDaysUntilTravel(booking.travel_start_date);
                
                return (
                  <TableRow key={booking.booking_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.customer_name}</p>
                        <p className="text-sm text-gray-600">{booking.package_name}</p>
                        <p className="text-xs text-gray-500">{booking.pax_count} passengers</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(booking.travel_start_date)}</p>
                        <p className="text-xs text-gray-500">
                          {daysUntilTravel > 0 ? `${daysUntilTravel} days left` : 'Travel started'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">Total: ₹{booking.total_amount.toLocaleString()}</p>
                        <p className="text-sm text-green-600">Paid: ₹{booking.advance_received.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600 text-lg">
                        ₹{booking.balance_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgency.color as any} size="sm">
                        {urgency.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {customer?.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {customer?.email && (
                          <a
                            href={`mailto:${customer.email}?subject=Payment Reminder - ${booking.package_name}&body=Dear ${booking.customer_name},%0A%0AThis is a friendly reminder regarding the outstanding payment for your booking: ${booking.package_name}.%0A%0AOutstanding Amount: ₹${booking.balance_amount.toLocaleString()}%0ATravel Date: ${booking.travel_start_date}%0A%0APlease contact us to complete the payment.%0A%0AThank you!`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send email reminder"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                      </div>
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

export default OutstandingPayments;