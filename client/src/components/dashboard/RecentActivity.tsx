import React from 'react';
import { Clock, User, Plus, Edit, Trash2 } from 'lucide-react';
import { LogEntry } from '../../types';
import Badge from '../ui/Badge';

interface RecentActivityProps {
  logs: LogEntry[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return Plus;
      case 'UPDATE':
        return Edit;
      case 'DELETE':
        return Trash2;
      default:
        return User;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-600';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-600';
      case 'DELETE':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
        <p className="text-gray-500 text-sm">Recent system activities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const ActionIcon = getActionIcon(log.action);
        
        return (
          <div key={log.log_id} className="group">
            <div className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)} group-hover:scale-110 transition-transform duration-200`}>
                <ActionIcon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {log.username}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={getActionVariant(log.action) as any} 
                      size="sm"
                    >
                      {log.action}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {log.target}
                </p>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            
            {index < logs.length - 1 && (
              <div className="ml-9 h-4 w-px bg-gray-200"></div>
            )}
          </div>
        );
      })}
      
      {logs.length >= 8 && (
        <div className="text-center pt-4 border-t border-gray-100">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline transition-colors duration-200">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;