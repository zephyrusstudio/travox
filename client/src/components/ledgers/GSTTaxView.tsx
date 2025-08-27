import React, { useState } from 'react';
import { Download, Calculator, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const GSTTaxView: React.FC = () => {
  const { bookings, customers, payments } = useApp();
  const [selectedQuarter, setSelectedQuarter] = useState('Q4-2024');
  const [gstRate] = useState(18); // 18% GST rate

  const quarters = [
    'Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024',
    'Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025'
  ];

  const getQuarterDates = (quarter: string) => {
    const [q, year] = quarter.split('-');
    const yearNum = parseInt(year);
    
    switch (q) {
      case 'Q1':
        return { start: new Date(yearNum, 0, 1), end: new Date(yearNum, 2, 31) };
      case 'Q2':
        return { start: new Date(yearNum, 3, 1), end: new Date(yearNum, 5, 30) };
      case 'Q3':
        return { start: new Date(yearNum, 6, 1), end: new Date(yearNum, 8, 30) };
      case 'Q4':
        return { start: new Date(yearNum, 9, 1), end: new Date(yearNum, 11, 31) };
      default:
        return { start: new Date(), end: new Date() };
    }
  };

  const getGSTData = () => {
    const { start, end } = getQuarterDates(selectedQuarter);
    
    // Get bookings in the selected quarter
    const quarterBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= start && bookingDate <= end;
    });

    // Get payments in the selected quarter
    const quarterPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= start && paymentDate <= end;
    });

    const gstTransactions = quarterBookings.map(booking => {
      const customer = customers.find(c => c.customer_id === booking.customer_id);
      const hasGSTIN = customer?.gstin && customer.gstin.trim() !== '';
      
      // Calculate GST
      const baseAmount = booking.total_amount / (1 + gstRate / 100);
      const gstAmount = booking.total_amount - baseAmount;
      
      // Get payments for this booking
      const bookingPayments = quarterPayments.filter(p => p.booking_id === booking.booking_id);
      const paidAmount = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      const paidBaseAmount = paidAmount / (1 + gstRate / 100);
      const paidGSTAmount = paidAmount - paidBaseAmount;

      return {
        booking,
        customer,
        hasGSTIN,
        baseAmount,
        gstAmount,
        totalAmount: booking.total_amount,
        paidAmount,
        paidBaseAmount,
        paidGSTAmount,
        outstandingAmount: booking.balance_amount,
        gstType: hasGSTIN ? 'B2B' : 'B2C'
      };
    });

    const summary = {
      totalTransactions: gstTransactions.length,
      totalBaseAmount: gstTransactions.reduce((sum, t) => sum + t.baseAmount, 0),
      totalGSTAmount: gstTransactions.reduce((sum, t) => sum + t.gstAmount, 0),
      totalAmount: gstTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      paidBaseAmount: gstTransactions.reduce((sum, t) => sum + t.paidBaseAmount, 0),
      paidGSTAmount: gstTransactions.reduce((sum, t) => sum + t.paidGSTAmount, 0),
      b2bTransactions: gstTransactions.filter(t => t.hasGSTIN).length,
      b2cTransactions: gstTransactions.filter(t => !t.hasGSTIN).length,
      b2bAmount: gstTransactions.filter(t => t.hasGSTIN).reduce((sum, t) => sum + t.totalAmount, 0),
      b2cAmount: gstTransactions.filter(t => !t.hasGSTIN).reduce((sum, t) => sum + t.totalAmount, 0)
    };

    return { gstTransactions, summary };
  };

  const { gstTransactions, summary } = getGSTData();

  const exportGSTReport = () => {
    const csvData = gstTransactions.map(transaction => ({
      'Invoice Date': transaction.booking.booking_date,
      'Customer Name': transaction.customer?.full_name || '',
      'Customer GSTIN': transaction.customer?.gstin || '',
      'Transaction Type': transaction.gstType,
      'Package Name': transaction.booking.package_name,
      'Base Amount': transaction.baseAmount.toFixed(2),
      'GST Amount': transaction.gstAmount.toFixed(2),
      'Total Amount': transaction.totalAmount.toFixed(2),
      'Paid Base Amount': transaction.paidBaseAmount.toFixed(2),
      'Paid GST Amount': transaction.paidGSTAmount.toFixed(2),
      'Outstanding Amount': transaction.outstandingAmount.toFixed(2),
      'Booking Status': transaction.booking.status
    }));

    // Add summary row
    csvData.push({
      'Invoice Date': 'SUMMARY',
      'Customer Name': '',
      'Customer GSTIN': '',
      'Transaction Type': '',
      'Package Name': '',
      'Base Amount': summary.totalBaseAmount.toFixed(2),
      'GST Amount': summary.totalGSTAmount.toFixed(2),
      'Total Amount': summary.totalAmount.toFixed(2),
      'Paid Base Amount': summary.paidBaseAmount.toFixed(2),
      'Paid GST Amount': summary.paidGSTAmount.toFixed(2),
      'Outstanding Amount': '',
      'Booking Status': ''
    });

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gst_report_${selectedQuarter}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST & Tax View</h1>
          <p className="text-gray-600">Comprehensive GST reporting and tax compliance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {quarters.map(quarter => (
              <option key={quarter} value={quarter}>{quarter}</option>
            ))}
          </select>
          <Button onClick={exportGSTReport} icon={Download}>
            Export GST Report
          </Button>
        </div>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">₹{(summary.totalGSTAmount / 100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-600">Total GST Collected</p>
            <p className="text-xs text-blue-600 font-semibold">₹{summary.paidGSTAmount.toLocaleString()} received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{summary.totalTransactions}</p>
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-xs text-green-600 font-semibold">₹{(summary.totalAmount / 100000).toFixed(1)}L value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{summary.b2bTransactions}</p>
            <p className="text-sm text-gray-600">B2B Transactions</p>
            <p className="text-xs text-purple-600 font-semibold">₹{(summary.b2bAmount / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{summary.b2cTransactions}</p>
            <p className="text-sm text-gray-600">B2C Transactions</p>
            <p className="text-xs text-orange-600 font-semibold">₹{(summary.b2cAmount / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
      </div>

      {/* GST Rate Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">GST Rate Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Current GST Rate</h4>
              <p className="text-3xl font-bold text-blue-600">{gstRate}%</p>
              <p className="text-sm text-blue-700">Applied on all travel services</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">B2B vs B2C</h4>
              <p className="text-sm text-green-700 mb-1">
                <strong>B2B:</strong> {summary.b2bTransactions} transactions ({((summary.b2bTransactions / summary.totalTransactions) * 100).toFixed(1)}%)
              </p>
              <p className="text-sm text-green-700">
                <strong>B2C:</strong> {summary.b2cTransactions} transactions ({((summary.b2cTransactions / summary.totalTransactions) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Collection Status</h4>
              <p className="text-sm text-purple-700 mb-1">
                <strong>Collected:</strong> ₹{summary.paidGSTAmount.toLocaleString()}
              </p>
              <p className="text-sm text-purple-700">
                <strong>Pending:</strong> ₹{(summary.totalGSTAmount - summary.paidGSTAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST Transactions Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">GST Transaction Details - {selectedQuarter}</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Date & Customer</TableCell>
                <TableCell header>Package</TableCell>
                <TableCell header>Type</TableCell>
                <TableCell header>Base Amount</TableCell>
                <TableCell header>GST Amount</TableCell>
                <TableCell header>Total Amount</TableCell>
                <TableCell header>GST Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gstTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.customer?.full_name}</p>
                      <p className="text-sm text-gray-600">{formatDate(transaction.booking.booking_date)}</p>
                      {transaction.customer?.gstin && (
                        <p className="text-xs text-gray-500">GSTIN: {transaction.customer.gstin}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">{transaction.booking.package_name}</p>
                      <p className="text-xs text-gray-500">{transaction.booking.pax_count} passengers</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.hasGSTIN ? 'info' : 'warning'} 
                      size="sm"
                    >
                      {transaction.gstType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      ₹{transaction.baseAmount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-blue-600">
                      ₹{transaction.gstAmount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      ₹{transaction.totalAmount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-green-600 font-semibold">
                        Collected: ₹{transaction.paidGSTAmount.toLocaleString()}
                      </p>
                      {transaction.paidGSTAmount < transaction.gstAmount && (
                        <p className="text-sm text-red-600">
                          Pending: ₹{(transaction.gstAmount - transaction.paidGSTAmount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GST Summary Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Quarter Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-semibold">₹{summary.totalBaseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Amount:</span>
                  <span className="font-semibold text-blue-600">₹{summary.totalGSTAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold">₹{summary.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Collection Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Collected:</span>
                  <span className="font-semibold text-green-600">₹{summary.paidBaseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Collected:</span>
                  <span className="font-semibold text-green-600">₹{summary.paidGSTAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Collection Rate:</span>
                  <span className="font-bold text-green-600">
                    {summary.totalAmount > 0 ? ((summary.paidBaseAmount + summary.paidGSTAmount) / summary.totalAmount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GSTTaxView;