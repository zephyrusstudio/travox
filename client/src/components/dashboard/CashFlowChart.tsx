import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CashFlowChart: React.FC = () => {
  const { bookings, expenses } = useApp();

  // Generate monthly data for the last 6 months
  const generateMonthlyData = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      
      // Calculate revenue for this month
      const monthlyRevenue = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate.getMonth() === date.getMonth() && 
                 bookingDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, booking) => sum + booking.advance_received, 0);

      // Calculate expenses for this month
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      months.push({
        month: monthName,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses
      });
    }
    
    return months;
  };

  const data = generateMonthlyData();
  const maxValue = Math.max(...data.flatMap(d => [d.revenue, d.expenses]));
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-700">₹{(totalRevenue / 100000).toFixed(1)}L</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">₹{(totalExpenses / 100000).toFixed(1)}L</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'} mb-1`}>Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{(Math.abs(netProfit) / 100000).toFixed(1)}L
              </p>
            </div>
            {netProfit >= 0 ? 
              <TrendingUp className="w-8 h-8 text-green-600" /> : 
              <TrendingDown className="w-8 h-8 text-red-600" />
            }
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-700">{profitMargin.toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
              <span className="text-purple-700 font-bold text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between h-80 space-x-4 px-4 bg-gradient-to-t from-gray-50 to-transparent p-6">
          {data.map((item, index) => {
            const revenueHeight = maxValue > 0 ? (item.revenue / maxValue) * 240 : 0;
            const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * 240 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center space-y-3">
                <div className="flex items-end space-x-2 h-60">
                  {/* Revenue bar */}
                  <div className="relative group flex-1 max-w-8">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 shadow-lg"
                      style={{ height: `${revenueHeight}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Revenue: ₹{(item.revenue / 1000).toFixed(0)}K
                    </div>
                  </div>
                  
                  {/* Expense bar */}
                  <div className="relative group flex-1 max-w-8">
                    <div
                      className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-600 hover:to-red-500 shadow-lg"
                      style={{ height: `${expenseHeight}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Expenses: ₹{(item.expenses / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-700">{item.month}</span>
                  <div className={`text-xs font-medium mt-1 ${
                    item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.profit >= 0 ? '+' : ''}₹{(item.profit / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-8 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
          <span className="text-sm font-medium text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded"></div>
          <span className="text-sm font-medium text-gray-600">Expenses</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded ${netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-600">Net Profit</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;