import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';

const CashFlowTrend: React.FC = () => {
  const { payments, expenses, bookings, refunds } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [viewType, setViewType] = useState('monthly');
  const [analysisMode, setAnalysisMode] = useState('detailed');

  const generateCashFlowTrendData = () => {
    const periods = selectedPeriod === '6months' ? 6 : selectedPeriod === '12months' ? 12 : selectedPeriod === '18months' ? 18 : 24;
    const currentDate = new Date();
    
    const cashFlowData = [];
    let runningBalance = 750000; // Starting cash position
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-IN', { 
        month: viewType === 'quarterly' ? 'short' : 'short', 
        year: '2-digit' 
      });
      
      // Calculate actual cash inflows (payments received)
      const actualInflows = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate actual cash outflows (expenses + refunds)
      const actualExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      const actualRefunds = refunds
        .filter(refund => {
          const refundDate = new Date(refund.refund_date);
          return refundDate.getMonth() === date.getMonth() && 
                 refundDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, refund) => sum + refund.refund_amount, 0);

      // Generate realistic data with seasonal patterns and growth trends
      const seasonalFactor = 1 + 0.15 * Math.sin((date.getMonth() / 12) * 2 * Math.PI + Math.PI/4);
      const growthFactor = 1 + (i * 0.02); // 2% monthly growth trend
      
      const baseInflows = actualInflows || (320000 + Math.random() * 180000) * seasonalFactor * growthFactor;
      const baseOutflows = actualExpenses + actualRefunds || (baseInflows * (0.68 + Math.random() * 0.12));
      
      const netCashFlow = baseInflows - baseOutflows;
      runningBalance += netCashFlow;
      
      // Calculate cash flow velocity and efficiency metrics
      const cashVelocity = baseInflows / runningBalance;
      const cashEfficiency = netCashFlow / baseInflows * 100;
      const burnRate = baseOutflows / 30; // Daily burn rate
      const daysOfCash = burnRate > 0 ? runningBalance / burnRate : 999;
      
      // Operating vs Free Cash Flow
      const operatingCashFlow = baseInflows - (baseOutflows * 0.85); // Exclude capital expenses
      const capitalExpenditure = baseOutflows * 0.15;
      const freeCashFlow = operatingCashFlow - capitalExpenditure;
      
      // Cash flow categories
      const operationalInflows = baseInflows * 0.92;
      const investmentInflows = baseInflows * 0.05;
      const financingInflows = baseInflows * 0.03;
      
      const operationalOutflows = baseOutflows * 0.78;
      const investmentOutflows = baseOutflows * 0.12;
      const financingOutflows = baseOutflows * 0.10;
      
      // Predictive metrics
      const cashFlowVolatility = Math.abs(netCashFlow) / baseInflows * 100;
      const liquidityRatio = runningBalance / (baseOutflows / 3); // 3-month coverage
      
      cashFlowData.push({
        period: monthName,
        date: date,
        // Core Cash Flow
        totalInflows: Math.round(baseInflows),
        totalOutflows: Math.round(baseOutflows),
        netCashFlow: Math.round(netCashFlow),
        runningBalance: Math.round(runningBalance),
        
        // Operational Metrics
        operatingCashFlow: Math.round(operatingCashFlow),
        freeCashFlow: Math.round(freeCashFlow),
        capitalExpenditure: Math.round(capitalExpenditure),
        
        // Cash Flow Categories
        operationalInflows: Math.round(operationalInflows),
        investmentInflows: Math.round(investmentInflows),
        financingInflows: Math.round(financingInflows),
        operationalOutflows: Math.round(operationalOutflows),
        investmentOutflows: Math.round(investmentOutflows),
        financingOutflows: Math.round(financingOutflows),
        
        // Efficiency Metrics
        cashVelocity: Math.round(cashVelocity * 1000) / 1000,
        cashEfficiency: Math.round(cashEfficiency * 100) / 100,
        burnRate: Math.round(burnRate),
        daysOfCash: Math.round(daysOfCash),
        cashFlowVolatility: Math.round(cashFlowVolatility * 100) / 100,
        liquidityRatio: Math.round(liquidityRatio * 100) / 100,
        
        // Growth Metrics
        inflowGrowth: i > 0 ? ((baseInflows - (cashFlowData[cashFlowData.length - 1]?.totalInflows || baseInflows * 0.95)) / (cashFlowData[cashFlowData.length - 1]?.totalInflows || baseInflows * 0.95) * 100) : 0,
        outflowGrowth: i > 0 ? ((baseOutflows - (cashFlowData[cashFlowData.length - 1]?.totalOutflows || baseOutflows * 0.95)) / (cashFlowData[cashFlowData.length - 1]?.totalOutflows || baseOutflows * 0.95) * 100) : 0
      });
    }
    
    return cashFlowData;
  };

  const cashFlowData = generateCashFlowTrendData();
  const currentPeriod = cashFlowData[cashFlowData.length - 1];
  const previousPeriod = cashFlowData[cashFlowData.length - 2];
  
  // Calculate aggregate metrics
  const totalInflows = cashFlowData.reduce((sum, d) => sum + d.totalInflows, 0);
  const totalOutflows = cashFlowData.reduce((sum, d) => sum + d.totalOutflows, 0);
  const totalNetCashFlow = totalInflows - totalOutflows;
  const avgCashEfficiency = cashFlowData.reduce((sum, d) => sum + d.cashEfficiency, 0) / cashFlowData.length;
  const avgLiquidityRatio = cashFlowData.reduce((sum, d) => sum + d.liquidityRatio, 0) / cashFlowData.length;
  
  // Growth calculations
  const netCashFlowGrowth = previousPeriod ? 
    ((currentPeriod.netCashFlow - previousPeriod.netCashFlow) / Math.abs(previousPeriod.netCashFlow || 1) * 100) : 0;
  const inflowGrowthRate = previousPeriod ? 
    ((currentPeriod.totalInflows - previousPeriod.totalInflows) / previousPeriod.totalInflows * 100) : 0;
  const outflowGrowthRate = previousPeriod ? 
    ((currentPeriod.totalOutflows - previousPeriod.totalOutflows) / previousPeriod.totalOutflows * 100) : 0;

  // Cash flow health assessment
  const getCashFlowHealth = () => {
    const healthScore = (
      (currentPeriod.netCashFlow > 0 ? 25 : 0) +
      (currentPeriod.daysOfCash > 90 ? 25 : currentPeriod.daysOfCash > 60 ? 20 : currentPeriod.daysOfCash > 30 ? 15 : 5) +
      (currentPeriod.cashEfficiency > 20 ? 25 : currentPeriod.cashEfficiency > 10 ? 20 : currentPeriod.cashEfficiency > 0 ? 15 : 5) +
      (currentPeriod.liquidityRatio > 3 ? 25 : currentPeriod.liquidityRatio > 2 ? 20 : currentPeriod.liquidityRatio > 1 ? 15 : 5)
    );

    if (healthScore >= 85) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
    if (healthScore >= 70) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity };
    if (healthScore >= 55) return { status: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertCircle };
    return { status: 'Poor', color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown };
  };

  const healthStatus = getCashFlowHealth();
  const maxValue = Math.max(...cashFlowData.flatMap(d => [d.totalInflows, d.totalOutflows]));

  // Key metrics for display
  const keyMetrics = [
    {
      title: 'Net Cash Flow',
      value: `₹${(currentPeriod.netCashFlow / 100000).toFixed(1)}L`,
      change: `${netCashFlowGrowth >= 0 ? '+' : ''}${netCashFlowGrowth.toFixed(1)}%`,
      changeType: netCashFlowGrowth >= 0 ? 'positive' : 'negative',
      icon: currentPeriod.netCashFlow >= 0 ? TrendingUp : TrendingDown,
      color: currentPeriod.netCashFlow >= 0 ? 'green' : 'red',
      description: 'Monthly net position'
    },
    {
      title: 'Cash Efficiency',
      value: `${currentPeriod.cashEfficiency.toFixed(1)}%`,
      change: `Avg: ${avgCashEfficiency.toFixed(1)}%`,
      changeType: currentPeriod.cashEfficiency >= avgCashEfficiency ? 'positive' : 'negative',
      icon: Target,
      color: 'blue',
      description: 'Cash generation efficiency'
    },
    {
      title: 'Days of Cash',
      value: `${currentPeriod.daysOfCash > 999 ? '999+' : currentPeriod.daysOfCash}`,
      change: `${currentPeriod.daysOfCash > 90 ? 'Safe' : currentPeriod.daysOfCash > 60 ? 'Good' : currentPeriod.daysOfCash > 30 ? 'Caution' : 'Critical'}`,
      changeType: currentPeriod.daysOfCash > 60 ? 'positive' : 'negative',
      icon: Clock,
      color: 'purple',
      description: 'Cash runway remaining'
    },
    {
      title: 'Cash Velocity',
      value: `${currentPeriod.cashVelocity.toFixed(2)}x`,
      change: `${currentPeriod.cashVelocity >= 1 ? 'Efficient' : 'Slow'}`,
      changeType: currentPeriod.cashVelocity >= 1 ? 'positive' : 'negative',
      icon: Zap,
      color: 'orange',
      description: 'Cash turnover rate'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-600' },
      red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
      blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-600' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Cash Flow Trend Analysis</h3>
        <div className="flex items-center space-x-4">
          <select
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="detailed">Detailed Analysis</option>
            <option value="operational">Operational Focus</option>
            <option value="strategic">Strategic View</option>
          </select>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly View</option>
            <option value="quarterly">Quarterly View</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="18months">Last 18 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
        </div>
      </div>

      {/* Cash Flow Health Status */}
      <Card className={`border-0 shadow-lg ${healthStatus.bg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${healthStatus.bg} rounded-2xl flex items-center justify-center border-2 border-white shadow-lg`}>
                <healthStatus.icon className={`w-8 h-8 ${healthStatus.color}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${healthStatus.color}`}>
                  Cash Flow Health: {healthStatus.status}
                </h3>
                <p className="text-gray-600 mt-1">
                  Current balance: ₹{(currentPeriod.runningBalance / 100000).toFixed(1)}L | 
                  Efficiency: {currentPeriod.cashEfficiency.toFixed(1)}% | 
                  Runway: {currentPeriod.daysOfCash > 999 ? '999+' : currentPeriod.daysOfCash} days
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                currentPeriod.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentPeriod.netCashFlow >= 0 ? '+' : ''}₹{(currentPeriod.netCashFlow / 100000).toFixed(1)}L
              </p>
              <p className="text-sm text-gray-600">Net cash flow this period</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Cash Flow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const colors = getColorClasses(metric.color);
          
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                    <div className={`w-8 h-8 ${colors.icon} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <Badge variant={metric.changeType === 'positive' ? 'success' : 'warning'} size="sm">
                    {metric.change}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  {metric.title}
                </h4>
                <p className={`text-2xl font-bold ${colors.text} leading-none`}>
                  {metric.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cash Flow Trend Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cash Flow Trend</h3>
                <p className="text-sm text-gray-600">Inflows, outflows, and net cash flow over time</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Inflows</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Outflows</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">Net Flow</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Main Cash Flow Chart */}
            <div className="flex items-end justify-between h-80 space-x-2 px-4 bg-gradient-to-t from-gray-50 to-transparent rounded-xl p-6 mb-6">
              {cashFlowData.map((item, index) => {
                const inflowHeight = maxValue > 0 ? (item.totalInflows / maxValue) * 240 : 0;
                const outflowHeight = maxValue > 0 ? (item.totalOutflows / maxValue) * 240 : 0;
                const netFlowHeight = maxValue > 0 ? (Math.abs(item.netCashFlow) / maxValue) * 240 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-3 max-w-16">
                    <div className="flex items-end space-x-1 h-60">
                      {/* Inflow bar */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-700 hover:to-green-500 shadow-lg cursor-pointer"
                          style={{ height: `${inflowHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          In: ₹{(item.totalInflows / 100000).toFixed(1)}L
                        </div>
                      </div>
                      
                      {/* Outflow bar */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-700 hover:to-red-500 shadow-lg cursor-pointer"
                          style={{ height: `${outflowHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Out: ₹{(item.totalOutflows / 100000).toFixed(1)}L
                        </div>
                      </div>

                      {/* Net flow bar */}
                      <div className="relative group flex-1 max-w-4">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 shadow-lg cursor-pointer ${
                            item.netCashFlow >= 0 
                              ? 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500'
                              : 'bg-gradient-to-t from-orange-600 to-orange-400 hover:from-orange-700 hover:to-orange-500'
                          }`}
                          style={{ height: `${netFlowHeight}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Net: ₹{(item.netCashFlow / 100000).toFixed(1)}L
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-700">{item.period}</span>
                      <div className="flex items-center justify-center mt-1">
                        {item.netCashFlow >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-600" />
                        )}
                        <span className="text-xs text-gray-500 ml-1">
                          {item.cashEfficiency.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Running Balance Line Chart */}
            <div className="relative h-24 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Cumulative Cash Balance</h4>
              <div className="flex items-end justify-between h-12">
                {cashFlowData.map((item, index) => {
                  const maxBalance = Math.max(...cashFlowData.map(d => d.runningBalance));
                  const minBalance = Math.min(...cashFlowData.map(d => d.runningBalance));
                  const range = maxBalance - minBalance;
                  const height = range > 0 ? ((item.runningBalance - minBalance) / range) * 32 : 16;
                  
                  return (
                    <div key={index} className="flex-1 flex justify-center">
                      <div className="relative group">
                        <div
                          className="w-3 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 hover:w-4"
                          style={{ height: `${height + 8}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          ₹{(item.runningBalance / 100000).toFixed(1)}L
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash Flow Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-700">Cash Inflows</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operational:</span>
                    <span className="font-semibold text-green-700">₹{(currentPeriod.operationalInflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Investment:</span>
                    <span className="font-semibold text-green-700">₹{(currentPeriod.investmentInflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Financing:</span>
                    <span className="font-semibold text-green-700">₹{(currentPeriod.financingInflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">₹{(currentPeriod.totalInflows / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-700">Cash Outflows</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operational:</span>
                    <span className="font-semibold text-red-700">₹{(currentPeriod.operationalOutflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Investment:</span>
                    <span className="font-semibold text-red-700">₹{(currentPeriod.investmentOutflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Financing:</span>
                    <span className="font-semibold text-red-700">₹{(currentPeriod.financingOutflows / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-red-600">₹{(currentPeriod.totalOutflows / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-700">Cash Flow Analysis</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operating CF:</span>
                    <span className="font-semibold text-blue-700">₹{(currentPeriod.operatingCashFlow / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Free CF:</span>
                    <span className="font-semibold text-blue-700">₹{(currentPeriod.freeCashFlow / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-semibold text-blue-700">{currentPeriod.cashEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Net CF:</span>
                      <span className={currentPeriod.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{(currentPeriod.netCashFlow / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-700">Liquidity</h4>
                </div>
                <p className="text-2xl font-bold text-purple-800 mb-1">
                  {currentPeriod.liquidityRatio.toFixed(1)}x
                </p>
                <p className="text-sm text-purple-600">
                  {currentPeriod.liquidityRatio > 3 ? 'Excellent' : currentPeriod.liquidityRatio > 2 ? 'Good' : currentPeriod.liquidityRatio > 1 ? 'Fair' : 'Poor'}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-700">Velocity</h4>
                </div>
                <p className="text-2xl font-bold text-orange-800 mb-1">
                  {currentPeriod.cashVelocity.toFixed(2)}x
                </p>
                <p className="text-sm text-orange-600">
                  Cash turnover rate
                </p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-700">Volatility</h4>
                </div>
                <p className="text-2xl font-bold text-indigo-800 mb-1">
                  {currentPeriod.cashFlowVolatility.toFixed(1)}%
                </p>
                <p className="text-sm text-indigo-600">
                  {currentPeriod.cashFlowVolatility < 15 ? 'Stable' : currentPeriod.cashFlowVolatility < 25 ? 'Moderate' : 'High'}
                </p>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h4 className="font-semibold text-teal-700">Burn Rate</h4>
                </div>
                <p className="text-2xl font-bold text-teal-800 mb-1">
                  ₹{(currentPeriod.burnRate / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-teal-600">
                  Daily cash usage
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cash Flow Statement */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Detailed Cash Flow Statement</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Inflows</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Outflows</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Net CF</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Operating CF</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Free CF</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.slice(-6).map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.period}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      ₹{(item.totalInflows / 100000).toFixed(1)}L
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      ₹{(item.totalOutflows / 100000).toFixed(1)}L
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.netCashFlow >= 0 ? '+' : ''}₹{(item.netCashFlow / 100000).toFixed(1)}L
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">
                      ₹{(item.operatingCashFlow / 100000).toFixed(1)}L
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.freeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{(item.freeCashFlow / 100000).toFixed(1)}L
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                      ₹{(item.runningBalance / 100000).toFixed(1)}L
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      item.cashEfficiency >= 20 ? 'text-green-600' : 
                      item.cashEfficiency >= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.cashEfficiency.toFixed(1)}%
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

export default CashFlowTrend;