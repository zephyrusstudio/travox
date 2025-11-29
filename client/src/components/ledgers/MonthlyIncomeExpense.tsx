import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, IndianRupee, BarChart3, Calendar } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';

const MonthlyIncomeExpense: React.FC = () => {
  const { bookings, payments, expenses, refunds } = useApp();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const generateMonthlyData = () => {
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(selectedYear, month, 1).toLocaleDateString('en-IN', { month: 'long' });
      
      // Calculate income (payments received)
      const monthlyPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === month && paymentDate.getFullYear() === selectedYear;
      });
      const income = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate expenses
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === selectedYear;
      });
      const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Calculate refunds
      const monthlyRefunds = refunds.filter(refund => {
        const refundDate = new Date(refund.refund_date);
        return refundDate.getMonth() === month && refundDate.getFullYear() === selectedYear;
      });
      const totalRefunds = monthlyRefunds.reduce((sum, r) => sum + r.refund_amount, 0);

      // Calculate bookings made
      const monthlyBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.getMonth() === month && bookingDate.getFullYear() === selectedYear;
      });
      const bookingValue = monthlyBookings.reduce((sum, b) => sum + b.total_amount, 0);

      const netIncome = income - totalRefunds;
      const profit = netIncome - totalExpenses;
      const profitMargin = netIncome > 0 ? (profit / netIncome) * 100 : 0;

      months.push({
        month: monthName,
        monthIndex: month,
        income,
        expenses: totalExpenses,
        refunds: totalRefunds,
        netIncome,
        profit,
        profitMargin,
        bookingValue,
        bookingCount: monthlyBookings.length,
        paymentCount: monthlyPayments.length,
        expenseCount: monthlyExpenses.length
      });
    }
    
    return months;
  };

  const monthlyData = generateMonthlyData();
  const currentMonth = new Date().getMonth();
  
  const yearlyTotals = monthlyData.reduce((acc, month) => ({
    income: acc.income + month.income,
    expenses: acc.expenses + month.expenses,
    refunds: acc.refunds + month.refunds,
    profit: acc.profit + month.profit,
    bookingValue: acc.bookingValue + month.bookingValue,
    bookingCount: acc.bookingCount + month.bookingCount
  }), { income: 0, expenses: 0, refunds: 0, profit: 0, bookingValue: 0, bookingCount: 0 });

  const avgMonthlyProfit = yearlyTotals.profit / 12;
  const profitGrowth = monthlyData[currentMonth]?.profit > avgMonthlyProfit ? 
    ((monthlyData[currentMonth]?.profit - avgMonthlyProfit) / avgMonthlyProfit * 100) : 0;

  const exportSummary = () => {
    const csvData = monthlyData.map(month => ({
      'Month': month.month,
      'Income': month.income,
      'Expenses': month.expenses,
      'Refunds': month.refunds,
      'Net Income': month.netIncome,
      'Profit': month.profit,
      'Profit Margin %': month.profitMargin.toFixed(2),
      'Booking Value': month.bookingValue,
      'Booking Count': month.bookingCount,
      'Payment Count': month.paymentCount,
      'Expense Count': month.expenseCount
    }));

    // Add yearly summary
    csvData.push({
      'Month': 'YEARLY TOTAL',
      'Income': yearlyTotals.income,
      'Expenses': yearlyTotals.expenses,
      'Refunds': yearlyTotals.refunds,
      'Net Income': yearlyTotals.income - yearlyTotals.refunds,
      'Profit': yearlyTotals.profit,
      'Profit Margin %': yearlyTotals.income > 0 ? ((yearlyTotals.profit / (yearlyTotals.income - yearlyTotals.refunds)) * 100).toFixed(2) : '0.00',
      'Booking Value': yearlyTotals.bookingValue,
      'Booking Count': yearlyTotals.bookingCount,
      'Payment Count': '',
      'Expense Count': ''
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
      link.setAttribute('download', `monthly_income_expense_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const maxValue = Math.max(...monthlyData.flatMap(d => [d.income, d.expenses]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Income & Expense Summary</h1>
          <p className="text-gray-600">Comprehensive financial overview and profit analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 px-3 py-2"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button onClick={exportSummary} icon={Download}>
            Export Summary
          </Button>
        </div>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">₹{(yearlyTotals.income / 100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-600">Total Income</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">₹{(yearlyTotals.expenses / 100000).toFixed(1)}L</p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className={`w-8 h-8 mx-auto mb-2 ${yearlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-2xl font-bold ${yearlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(Math.abs(yearlyTotals.profit) / 100000).toFixed(1)}L
            </p>
            <p className="text-sm text-gray-600">Net Profit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{yearlyTotals.bookingCount}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{profitGrowth.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Profit Growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Trend Analysis</h3>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex items-end justify-between h-80 space-x-2 px-4 bg-gradient-to-t from-gray-50 to-transparent p-6">
              {monthlyData.map((month, index) => {
                const incomeHeight = maxValue > 0 ? (month.income / maxValue) * 240 : 0;
                const expenseHeight = maxValue > 0 ? (month.expenses / maxValue) * 240 : 0;
                const isCurrentMonth = index === currentMonth;
                
                return (
                  <div key={index} className={`flex-1 flex flex-col items-center space-y-3 ${isCurrentMonth ? 'opacity-100' : 'opacity-80'}`}>
                    <div className="flex items-end space-x-1 h-60">
                      {/* Income bar */}
                      <div className="relative group flex-1 max-w-6">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 shadow-lg ${
                            isCurrentMonth 
                              ? 'bg-gradient-to-t from-green-600 to-green-400' 
                              : 'bg-gradient-to-t from-green-500 to-green-400'
                          }`}
                          style={{ height: `${incomeHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Income: ₹{(month.income / 1000).toFixed(0)}K
                        </div>
                      </div>
                      
                      {/* Expense bar */}
                      <div className="relative group flex-1 max-w-6">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 shadow-lg ${
                            isCurrentMonth 
                              ? 'bg-gradient-to-t from-red-600 to-red-400' 
                              : 'bg-gradient-to-t from-red-500 to-red-400'
                          }`}
                          style={{ height: `${expenseHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Expenses: ₹{(month.expenses / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-600'}`}>
                        {month.month.slice(0, 3)}
                      </span>
                      <div className={`text-xs mt-1 ${
                        month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {month.profit >= 0 ? '+' : ''}₹{(month.profit / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Month</TableCell>
                <TableCell header>Income</TableCell>
                <TableCell header>Expenses</TableCell>
                <TableCell header>Refunds</TableCell>
                <TableCell header>Net Income</TableCell>
                <TableCell header>Profit</TableCell>
                <TableCell header>Margin %</TableCell>
                <TableCell header>Bookings</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month, index) => (
                <TableRow key={index} className={index === currentMonth ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <span className={`font-medium ${index === currentMonth ? 'text-blue-700' : 'text-gray-900'}`}>
                      {month.month}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      ₹{month.income.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">
                      ₹{month.expenses.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-orange-600">
                      ₹{month.refunds.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-blue-600">
                      ₹{month.netIncome.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.profit >= 0 ? '+' : ''}₹{month.profit.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${month.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.profitMargin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">
                      {month.bookingCount} ({month.paymentCount} payments)
                    </span>
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

export default MonthlyIncomeExpense;