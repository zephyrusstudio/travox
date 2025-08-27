import React, { useState } from 'react';
import { Download, FileText, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';

const ReportsManagement: React.FC = () => {
  const { bookings, payments, expenses, refunds, customers, vendors } = useApp();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const filterByDateRange = (items: any[], dateField: string) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return itemDate >= start && itemDate <= end;
    });
  };

  const generateReport = (type: string) => {
    let data: any = [];
    let filename = '';

    switch (type) {
      case 'bookings':
        data = filterByDateRange(bookings, 'booking_date');
        filename = 'bookings_report.csv';
        break;
      case 'payments':
        data = filterByDateRange(payments, 'payment_date');
        filename = 'payments_report.csv';
        break;
      case 'expenses':
        data = filterByDateRange(expenses, 'date');
        filename = 'expenses_report.csv';
        break;
      case 'refunds':
        data = filterByDateRange(refunds, 'refund_date');
        filename = 'refunds_report.csv';
        break;
      case 'customers':
        data = customers;
        filename = 'customers_report.csv';
        break;
      case 'vendors':
        data = vendors;
        filename = 'vendors_report.csv';
        break;
      default:
        return;
    }

    // Convert to CSV
    if (data.length === 0) {
      alert('No data available for the selected date range');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getReportStats = () => {
    const filteredBookings = filterByDateRange(bookings, 'booking_date');
    const filteredPayments = filterByDateRange(payments, 'payment_date');
    const filteredExpenses = filterByDateRange(expenses, 'date');
    const filteredRefunds = filterByDateRange(refunds, 'refund_date');

    return {
      totalBookings: filteredBookings.length,
      totalRevenue: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
      totalExpenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalRefunds: filteredRefunds.reduce((sum, r) => sum + r.refund_amount, 0),
      netProfit: filteredPayments.reduce((sum, p) => sum + p.amount, 0) - 
                 filteredExpenses.reduce((sum, e) => sum + e.amount, 0) - 
                 filteredRefunds.reduce((sum, r) => sum + r.refund_amount, 0)
    };
  };

  const stats = getReportStats();

  const reportTypes = [
    {
      id: 'bookings',
      title: 'Bookings Report',
      description: 'Detailed report of all bookings',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'payments',
      title: 'Payments Report',
      description: 'All payment transactions',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'expenses',
      title: 'Expenses Report',
      description: 'Business expenses breakdown',
      icon: TrendingUp,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 'refunds',
      title: 'Refunds Report',
      description: 'Customer refunds summary',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'customers',
      title: 'Customers Report',
      description: 'Customer database export',
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'vendors',
      title: 'Vendors Report',
      description: 'Vendor information export',
      icon: Users,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and export business reports</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Date Range Filter</h3>
        </CardHeader>
        <CardContent>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
            <p className="text-sm text-gray-600">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">₹{stats.totalExpenses.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₹{stats.totalRefunds.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.netProfit.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Net Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => generateReport(report.id)}
                  >
                    Export
                  </Button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Reports */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              icon={Download}
              onClick={() => {
                // Generate comprehensive financial report
                const data = {
                  period: `${dateRange.startDate} to ${dateRange.endDate}`,
                  summary: stats,
                  bookings: filterByDateRange(bookings, 'booking_date').length,
                  payments: filterByDateRange(payments, 'payment_date').length,
                  expenses: filterByDateRange(expenses, 'date').length,
                  refunds: filterByDateRange(refunds, 'refund_date').length
                };
                
                const csvContent = [
                  'Financial Report Summary',
                  `Period: ${data.period}`,
                  '',
                  'Metric,Value',
                  `Total Bookings,${data.bookings}`,
                  `Total Revenue,₹${stats.totalRevenue}`,
                  `Total Expenses,₹${stats.totalExpenses}`,
                  `Total Refunds,₹${stats.totalRefunds}`,
                  `Net Profit,₹${stats.netProfit}`
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                if (link.download !== undefined) {
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'financial_summary.csv');
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              Download Financial Summary
            </Button>
            <Button
              variant="outline"
              icon={FileText}
              onClick={() => {
                // Generate profit/loss statement
                const revenue = filterByDateRange(payments, 'payment_date').reduce((sum, p) => sum + p.amount, 0);
                const expenses = filterByDateRange(expenses, 'date').reduce((sum, e) => sum + e.amount, 0);
                const refunds = filterByDateRange(refunds, 'refund_date').reduce((sum, r) => sum + r.refund_amount, 0);
                
                const csvContent = [
                  'Profit & Loss Statement',
                  `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
                  '',
                  'Category,Amount',
                  `Revenue,₹${revenue}`,
                  `Less: Expenses,₹${expenses}`,
                  `Less: Refunds,₹${refunds}`,
                  `Net Profit/Loss,₹${revenue - expenses - refunds}`
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                if (link.download !== undefined) {
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'profit_loss_statement.csv');
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              Download P&L Statement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManagement;