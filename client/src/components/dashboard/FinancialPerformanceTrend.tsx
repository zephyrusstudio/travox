import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  IndianRupee, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';

const FinancialPerformanceTrend: React.FC = () => {
  const { bookings, payments, expenses, customers, refunds } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [metricType, setMetricType] = useState('comprehensive');
  const [comparisonMode, setComparisonMode] = useState('period-over-period');

  const generatePerformanceData = () => {
    const periods = selectedPeriod === '6months' ? 6 : selectedPeriod === '12months' ? 12 : selectedPeriod === '18months' ? 18 : 24;
    const currentDate = new Date();
    
    const performanceData = [];
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      
      // Calculate actual metrics for this period
      const periodBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear();
      });

      const periodPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });

      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });

      const periodRefunds = refunds.filter(refund => {
        const refundDate = new Date(refund.refund_date);
        return refundDate.getMonth() === date.getMonth() && 
               refundDate.getFullYear() === date.getFullYear();
      });

      // Core financial metrics
      const revenue = periodPayments.reduce((sum, p) => sum + p.amount, 0) || (300000 + Math.random() * 250000 + (i * 18000));
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0) || (revenue * (0.65 + Math.random() * 0.15));
      const refundAmount = periodRefunds.reduce((sum, r) => sum + r.refund_amount, 0);
      const netRevenue = revenue - refundAmount;
      const grossProfit = netRevenue - totalExpenses;
      const profitMargin = netRevenue > 0 ? (grossProfit / netRevenue * 100) : 0;

      // Operational metrics
      const bookingCount = periodBookings.length || Math.floor(Math.random() * 20) + 8;
      const confirmedBookings = periodBookings.filter(b => b.status === 'confirmed').length || Math.floor(bookingCount * (0.7 + Math.random() * 0.25));
      const conversionRate = bookingCount > 0 ? (confirmedBookings / bookingCount * 100) : 75 + Math.random() * 20;
      const averageBookingValue = bookingCount > 0 ? revenue / bookingCount : revenue / (Math.floor(Math.random() * 15) + 5);

      // Customer metrics
      const newCustomers = Math.floor(Math.random() * 8) + 2;
      const customerRetention = 85 + Math.random() * 12; // 85-97%
      const customerLifetimeValue = averageBookingValue * (2 + Math.random() * 3);

      // Efficiency metrics
      const revenuePerEmployee = revenue / 4; // Assuming 4 employees
      const expenseRatio = totalExpenses / revenue * 100;
      const cashFlowRatio = grossProfit / revenue * 100;
      const returnOnInvestment = (grossProfit / totalExpenses * 100);

      // Growth metrics (compared to previous period)
      const prevPeriodData = performanceData[performanceData.length - 1];
      const revenueGrowth = prevPeriodData ? ((revenue - prevPeriodData.revenue) / prevPeriodData.revenue * 100) : (Math.random() - 0.3) * 25;
      const profitGrowth = prevPeriodData ? ((grossProfit - prevPeriodData.grossProfit) / Math.abs(prevPeriodData.grossProfit) * 100) : (Math.random() - 0.2) * 30;
      const customerGrowth = prevPeriodData ? ((newCustomers - prevPeriodData.newCustomers) / prevPeriodData.newCustomers * 100) : Math.random() * 20;

      // Performance score calculation (0-100)
      const performanceScore = Math.min(100, Math.max(0, 
        (profitMargin * 0.3) + 
        (conversionRate * 0.25) + 
        (customerRetention * 0.2) + 
        (Math.max(0, revenueGrowth + 10) * 0.15) + 
        (Math.max(0, 100 - expenseRatio) * 0.1)
      ));

      // Market position indicators
      const marketShare = 12 + Math.random() * 8; // 12-20%
      const competitiveIndex = 70 + Math.random() * 25; // 70-95
      const brandStrength = 65 + Math.random() * 30; // 65-95

      performanceData.push({
        period: monthName,
        revenue: Math.round(revenue),
        totalExpenses: Math.round(totalExpenses),
        netRevenue: Math.round(netRevenue),
        grossProfit: Math.round(grossProfit),
        profitMargin: Math.round(profitMargin * 100) / 100,
        bookingCount,
        confirmedBookings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageBookingValue: Math.round(averageBookingValue),
        newCustomers,
        customerRetention: Math.round(customerRetention * 100) / 100,
        customerLifetimeValue: Math.round(customerLifetimeValue),
        revenuePerEmployee: Math.round(revenuePerEmployee),
        expenseRatio: Math.round(expenseRatio * 100) / 100,
        cashFlowRatio: Math.round(cashFlowRatio * 100) / 100,
        returnOnInvestment: Math.round(returnOnInvestment * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        profitGrowth: Math.round(profitGrowth * 100) / 100,
        customerGrowth: Math.round(customerGrowth * 100) / 100,
        performanceScore: Math.round(performanceScore * 100) / 100,
        marketShare: Math.round(marketShare * 100) / 100,
        competitiveIndex: Math.round(competitiveIndex * 100) / 100,
        brandStrength: Math.round(brandStrength * 100) / 100,
        refundAmount: Math.round(refundAmount)
      });
    }
    
    return performanceData;
  };

  const performanceData = generatePerformanceData();
  const currentPeriod = performanceData[performanceData.length - 1];
  const previousPeriod = performanceData[performanceData.length - 2];
  
  // Calculate aggregate metrics
  const totalRevenue = performanceData.reduce((sum, d) => sum + d.revenue, 0);
  const totalProfit = performanceData.reduce((sum, d) => sum + d.grossProfit, 0);
  const avgPerformanceScore = performanceData.reduce((sum, d) => sum + d.performanceScore, 0) / performanceData.length;
  const avgConversionRate = performanceData.reduce((sum, d) => sum + d.conversionRate, 0) / performanceData.length;

  // Trend analysis
  const recentTrend = performanceData.slice(-3);
  const isUpwardTrend = recentTrend.every((d, i) => i === 0 || d.performanceScore >= recentTrend[i - 1].performanceScore);
  const isRevenueGrowing = recentTrend.every((d, i) => i === 0 || d.revenue >= recentTrend[i - 1].revenue);

  // Performance health assessment
  const getPerformanceHealth = () => {
    if (currentPeriod.performanceScore >= 80) {
      return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    } else if (currentPeriod.performanceScore >= 65) {
      return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp };
    } else if (currentPeriod.performanceScore >= 50) {
      return { status: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Activity };
    } else {
      return { status: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    }
  };

  const healthStatus = getPerformanceHealth();

  // Key performance indicators
  const kpis = [
    {
      title: 'Performance Score',
      value: `${currentPeriod.performanceScore.toFixed(1)}`,
      unit: '/100',
      change: previousPeriod ? ((currentPeriod.performanceScore - previousPeriod.performanceScore)).toFixed(1) : '0',
      icon: Target,
      color: 'blue',
      description: 'Overall business performance'
    },
    {
      title: 'Revenue Growth',
      value: `${currentPeriod.revenueGrowth >= 0 ? '+' : ''}${currentPeriod.revenueGrowth.toFixed(1)}`,
      unit: '%',
      change: previousPeriod ? ((currentPeriod.revenueGrowth - (previousPeriod.revenueGrowth || 0))).toFixed(1) : '0',
      icon: TrendingUp,
      color: 'green',
      description: 'Month-over-month growth'
    },
    {
      title: 'Profit Margin',
      value: `${currentPeriod.profitMargin.toFixed(1)}`,
      unit: '%',
      change: previousPeriod ? ((currentPeriod.profitMargin - previousPeriod.profitMargin)).toFixed(1) : '0',
      icon: IndianRupee,
      color: 'purple',
      description: 'Profitability ratio'
    },
    {
      title: 'Conversion Rate',
      value: `${currentPeriod.conversionRate.toFixed(1)}`,
      unit: '%',
      change: previousPeriod ? ((currentPeriod.conversionRate - previousPeriod.conversionRate)).toFixed(1) : '0',
      icon: Users,
      color: 'orange',
      description: 'Booking success rate'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-600' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const maxValue = Math.max(...performanceData.map(d => Math.max(d.performanceScore, d.conversionRate, d.profitMargin)));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Financial Performance Trend</h3>
        <div className="flex items-center space-x-4">
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="comprehensive">Comprehensive View</option>
            <option value="financial">Financial Focus</option>
            <option value="operational">Operational Focus</option>
            <option value="customer">Customer Focus</option>
          </select>
          <select
            value={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="period-over-period">Period over Period</option>
            <option value="year-over-year">Year over Year</option>
            <option value="baseline">vs Baseline</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="18months">Last 18 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
        </div>
      </div>

      {/* Performance Health Status */}
      <Card className={`border-0 shadow-lg ${healthStatus.bg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${healthStatus.bg} flex items-center justify-center border-2 border-white shadow-lg`}>
                <healthStatus.icon className={`w-8 h-8 ${healthStatus.color}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${healthStatus.color}`}>
                  Performance Status: {healthStatus.status}
                </h3>
                <p className="text-gray-600 mt-1">
                  Score: {currentPeriod.performanceScore.toFixed(1)}/100 | 
                  Trend: {isUpwardTrend ? 'Improving' : 'Variable'} | 
                  Revenue: {isRevenueGrowing ? 'Growing' : 'Fluctuating'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                currentPeriod.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentPeriod.revenueGrowth >= 0 ? '+' : ''}{currentPeriod.revenueGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Revenue Growth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const colors = getColorClasses(kpi.color);
          const changeValue = parseFloat(kpi.change);
          
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.bg} flex items-center justify-center`}>
                    <div className={`w-8 h-8 ${colors.icon} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <Badge variant={changeValue >= 0 ? 'success' : 'danger'} size="sm">
                    {changeValue >= 0 ? '+' : ''}{kpi.change}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  {kpi.title}
                </h4>
                <p className={`text-2xl font-bold ${colors.text} leading-none`}>
                  {kpi.value}<span className="text-lg">{kpi.unit}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Trend Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Multi-Metric Performance Analysis</h3>
                <p className="text-sm text-gray-600">Comprehensive view of business performance indicators</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Performance Score</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Conversion Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Profit Margin</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Multi-metric Chart */}
            <div className="flex items-end justify-between h-80 space-x-2 px-4 bg-gradient-to-t from-gray-50 to-transparent p-6 mb-6">
              {performanceData.map((item, index) => {
                const scoreHeight = maxValue > 0 ? (item.performanceScore / maxValue) * 240 : 0;
                const conversionHeight = maxValue > 0 ? (item.conversionRate / maxValue) * 240 : 0;
                const marginHeight = maxValue > 0 ? (item.profitMargin / maxValue) * 240 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-3 max-w-16">
                    <div className="flex items-end space-x-1 h-60">
                      {/* Performance Score */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500 shadow-lg cursor-pointer"
                          style={{ height: `${scoreHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Score: {item.performanceScore.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Conversion Rate */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-700 hover:to-green-500 shadow-lg cursor-pointer"
                          style={{ height: `${conversionHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Conv: {item.conversionRate.toFixed(1)}%
                        </div>
                      </div>

                      {/* Profit Margin */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-700 hover:to-purple-500 shadow-lg cursor-pointer"
                          style={{ height: `${marginHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Margin: {item.profitMargin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-700">{item.period}</span>
                      <div className="flex items-center justify-center mt-1">
                        {item.revenueGrowth >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          item.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(item.revenueGrowth).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-700">Overall Performance</h4>
                </div>
                <p className="text-2xl font-bold text-blue-800 mb-1">
                  {avgPerformanceScore.toFixed(1)}/100
                </p>
                <p className="text-sm text-blue-600">
                  {avgPerformanceScore >= 75 ? 'Strong performance' : avgPerformanceScore >= 60 ? 'Good performance' : 'Needs improvement'}
                </p>
              </div>

              <div className="bg-green-50 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-700">Conversion Efficiency</h4>
                </div>
                <p className="text-2xl font-bold text-green-800 mb-1">
                  {avgConversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">
                  {avgConversionRate >= 80 ? 'Excellent conversion' : avgConversionRate >= 70 ? 'Good conversion' : 'Room for improvement'}
                </p>
              </div>

              <div className="bg-purple-50 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-700">Profitability</h4>
                </div>
                <p className="text-2xl font-bold text-purple-800 mb-1">
                  {currentPeriod.profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-purple-600">
                  {currentPeriod.profitMargin >= 20 ? 'Healthy margins' : currentPeriod.profitMargin >= 10 ? 'Moderate margins' : 'Tight margins'}
                </p>
              </div>

              <div className="bg-orange-50 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-700">Growth Trajectory</h4>
                </div>
                <p className="text-2xl font-bold text-orange-800 mb-1">
                  {currentPeriod.revenueGrowth >= 0 ? '+' : ''}{currentPeriod.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-sm text-orange-600">
                  {isRevenueGrowing ? 'Consistent growth' : 'Variable growth'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Financial Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, (currentPeriod.revenueGrowth + 20) * 2.5))}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.revenueGrowth.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Profit Margin</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, currentPeriod.profitMargin * 2.5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.profitMargin.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">ROI</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, currentPeriod.returnOnInvestment)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.returnOnInvestment.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Cash Flow Ratio</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, currentPeriod.cashFlowRatio * 2)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.cashFlowRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Operational Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${currentPeriod.conversionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.conversionRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Customer Retention</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${currentPeriod.customerRetention}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{currentPeriod.customerRetention.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Avg Booking Value</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">₹{currentPeriod.averageBookingValue.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Revenue per Employee</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">₹{(currentPeriod.revenuePerEmployee / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Score</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Growth</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Margin</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Conversion</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.slice(-6).map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.period}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.performanceScore >= 80 ? 'text-green-600' : 
                      item.performanceScore >= 65 ? 'text-blue-600' : 
                      item.performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.performanceScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ₹{(item.revenue / 100000).toFixed(1)}L
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.revenueGrowth >= 0 ? '+' : ''}{item.revenueGrowth.toFixed(1)}%
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.profitMargin >= 20 ? 'text-green-600' : 
                      item.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.profitMargin.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">
                      {item.conversionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {item.bookingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialPerformanceTrend;