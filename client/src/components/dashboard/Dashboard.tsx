import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import StatsCards from './StatsCards';
import ReminderCalendar from './ReminderCalendar';
import CashFlowChart from './CashFlowChart';
import RecentActivity from './RecentActivity';
import FinancialAnalytics from './FinancialAnalytics';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  IndianRupee, 
  LayoutDashboard, 
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Globe,
  BarChart3,
  Briefcase,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { getDashboardStats, logs, bookings, customers, payments, expenses } = useApp();
  const navigate = useNavigate();
  const stats = getDashboardStats();

  // Calculate additional metrics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings * 100) : 0;
  
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  const thisMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0);

  const profitMargin = thisMonthPayments > 0 ? ((thisMonthPayments - thisMonthExpenses) / thisMonthPayments * 100) : 0;

  const quickMetrics = [
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      change: '+2.4%',
      changeType: 'positive',
      icon: Target,
      description: 'Booking confirmation rate',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      link: '#bookings'
    },
    {
      title: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      change: '+5.2%',
      changeType: 'positive',
      icon: TrendingUp,
      description: 'This month\'s margin',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-600',
      link: '#monthly-summary'
    },
    {
      title: 'Avg. Deal Size',
      value: `₹${totalBookings > 0 ? Math.round(stats.totalRevenue / totalBookings).toLocaleString() : '0'}`,
      change: '+8.7%',
      changeType: 'positive',
      icon: IndianRupee,
      description: 'Per booking average',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-600',
      link: '#reports'
    },
    {
      title: 'Customer Growth',
      value: `+${customers.length}`,
      change: '+12.3%',
      changeType: 'positive',
      icon: Users,
      description: 'New customers this month',
      bgColor: 'bg-violet-50',
      iconBg: 'bg-violet-500',
      textColor: 'text-violet-600',
      link: '#customers'
    }
  ];

  const handleCardClick = (link: string) => {
    const routeMap: Record<string, string> = {
      '#dashboard': '/legacy/dashboard',
      '#bookings': '/bookings',
      '#payments': '/payments',
      '#customers': '/customers',
      '#reports': '/reports',
      '#monthly-summary': '/reports/monthly-income-expense',
      '#outstanding-payments': '/reports/outstanding-payments',
      '#expenses': '/expenses',
    };

    navigate(routeMap[link] ?? '/reports');
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2">Welcome back! 👋</h1>
                    <p className="text-blue-100 text-lg lg:text-xl font-medium">
                      Here's your business performance overview
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                  <button
                    onClick={() => handleCardClick('#bookings')}
                    className="text-center lg:text-left bg-white bg-opacity-10 p-4 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                  >
                    <p className="text-3xl lg:text-4xl font-bold mb-1">{totalBookings}</p>
                    <p className="text-blue-200 text-sm font-semibold">Total Bookings</p>
                  </button>
                  <button
                    onClick={() => handleCardClick('#payments')}
                    className="text-center lg:text-left bg-white bg-opacity-10 p-4 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                  >
                    <p className="text-3xl lg:text-4xl font-bold mb-1">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
                    <p className="text-blue-200 text-sm font-semibold">Revenue</p>
                  </button>
                  <button
                    onClick={() => handleCardClick('#customers')}
                    className="text-center lg:text-left bg-white bg-opacity-10 p-4 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                  >
                    <p className="text-3xl lg:text-4xl font-bold mb-1">{customers.length}</p>
                    <p className="text-blue-200 text-sm font-semibold">Customers</p>
                  </button>
                  <button
                    onClick={() => handleCardClick('#reports')}
                    className="text-center lg:text-left bg-white bg-opacity-10 p-4 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                  >
                    <p className="text-3xl lg:text-4xl font-bold mb-1">{conversionRate.toFixed(0)}%</p>
                    <p className="text-blue-200 text-sm font-semibold">Success Rate</p>
                  </button>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-48 h-48 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm float">
                  <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="slide-up">
        <StatsCards stats={stats} />
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 slide-up">
        {quickMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.changeType === 'positive';
          const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
          
          return (
            <button
              key={index}
              onClick={() => handleCardClick(metric.link)}
              className="w-full"
            >
              <Card hover className="border-0 shadow-lg group h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 ${metric.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-8 h-8 ${metric.iconBg} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                      isPositive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <ChangeIcon className="w-4 h-4" />
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 leading-none">
                      {metric.value}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {metric.description}
                    </p>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${metric.iconBg} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(90, Math.max(60, 70 + index * 5))}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-semibold ${metric.textColor}`}>
                      {Math.min(90, Math.max(60, 70 + index * 5))}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Financial Analytics Section */}
      <div className="slide-up">
        <FinancialAnalytics />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 48-Hour Reminder Calendar */}
        <div className="xl:col-span-2 slide-up">
          <Card className="h-full overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
                    <p className="text-sm text-gray-600">Next 48 hours overview</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-600">Live Updates</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ReminderCalendar />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="slide-up">
          <Card className="h-full overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Activity Feed</h3>
                    <p className="text-sm text-gray-600">Recent system updates</p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <RecentActivity logs={logs.slice(0, 8)} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="slide-up">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cash Flow Analysis</h3>
                  <p className="text-sm text-gray-600">Revenue vs Expenses trend analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Expenses</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CashFlowChart />
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 slide-up">
        <button
          onClick={() => handleCardClick('#customers')}
          className="w-full"
        >
          <Card hover className="border-0 shadow-lg group h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
                  This Month
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Market Reach</h3>
                <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                <p className="text-sm text-gray-600">Active customers across regions</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '75%' }}></div>
                </div>
                <span className="text-xs font-semibold text-blue-600">75%</span>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handleCardClick('#monthly-summary')}
          className="w-full"
        >
          <Card hover className="border-0 shadow-lg group h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                  +15.2%
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Growth Rate</h3>
                <p className="text-3xl font-bold text-green-600">24.5%</p>
                <p className="text-sm text-gray-600">Monthly business growth</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }}></div>
                </div>
                <span className="text-xs font-semibold text-green-600">85%</span>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handleCardClick('#reports')}
          className="w-full"
        >
          <Card hover className="border-0 shadow-lg group h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 bg-purple-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full">
                  Target
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Goal Progress</h3>
                <p className="text-3xl font-bold text-purple-600">87%</p>
                <p className="text-sm text-gray-600">Monthly revenue target</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '87%' }}></div>
                </div>
                <span className="text-xs font-semibold text-purple-600">87%</span>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
