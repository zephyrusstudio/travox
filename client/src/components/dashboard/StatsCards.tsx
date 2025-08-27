import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import { DashboardStats } from '../../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const statsData = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
      subValue: `₹${stats.totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      bgColor: 'bg-blue-50',
      iconColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      description: 'from last month',
      link: '#payments'
    },
    {
      title: 'Outstanding Amount',
      value: `₹${(stats.pendingAmount / 100000).toFixed(1)}L`,
      subValue: `₹${stats.pendingAmount.toLocaleString()}`,
      change: '-8.2%',
      changeType: 'negative' as const,
      icon: AlertCircle,
      bgColor: 'bg-orange-50',
      iconColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      description: 'pending payments',
      link: '#outstanding-payments'
    },
    {
      title: 'Monthly Expenses',
      value: `₹${(stats.monthlyExpense / 100000).toFixed(1)}L`,
      subValue: `₹${stats.monthlyExpense.toLocaleString()}`,
      change: '+5.7%',
      changeType: 'positive' as const,
      icon: CreditCard,
      bgColor: 'bg-purple-50',
      iconColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      description: 'this month',
      link: '#expenses'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings.toString(),
      subValue: 'confirmed trips',
      change: '+15',
      changeType: 'positive' as const,
      icon: Calendar,
      bgColor: 'bg-green-50',
      iconColor: 'bg-green-500',
      textColor: 'text-green-600',
      description: 'in pipeline',
      link: '#bookings'
    }
  ];

  const handleCardClick = (link: string) => {
    window.location.hash = link;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const ChangeIcon = stat.changeType === 'positive' ? ArrowUpRight : ArrowDownRight;
        
        return (
          <button
            key={index}
            onClick={() => handleCardClick(stat.link)}
            className="w-full"
          >
            <Card hover className="overflow-hidden group border-0 shadow-lg h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`w-8 h-8 ${stat.iconColor} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                    stat.changeType === 'positive' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.subValue}
                  </p>
                  <p className="text-xs text-gray-400">
                    {stat.description}
                  </p>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-4 flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.iconColor} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min(85, Math.max(20, (index + 1) * 20))}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-semibold ${stat.textColor}`}>
                    {Math.min(85, Math.max(20, (index + 1) * 20))}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
};

export default StatsCards;