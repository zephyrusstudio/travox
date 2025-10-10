import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Edit, Trash2, Eye, Activity } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { AuditLog } from '../../types';
import { auditLogService } from '../../services';

interface EntityAuditLogsProps {
  entity: string;
  entityId: string;
  title?: string;
  maxLogs?: number;
}

const EntityAuditLogs: React.FC<EntityAuditLogsProps> = ({
  entity,
  entityId,
  title = 'Audit History',
  maxLogs = 10
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return Plus;
      case 'UPDATE': return Edit;
      case 'DELETE': return Trash2;
      case 'VIEW': return Eye;
      default: return Activity;
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-600';
      case 'UPDATE': return 'bg-blue-100 text-blue-600';
      case 'DELETE': return 'bg-red-100 text-red-600';
      case 'VIEW': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Get action variant for Badge
  const getActionVariant = (action: string): 'default' | 'success' | 'info' | 'danger' => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'VIEW': return 'default';
      default: return 'default';
    }
  };

  // Format timestamp
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

  // Fetch entity audit logs
  const fetchEntityAuditLogs = useCallback(async () => {
    if (!entity || !entityId) return;
    
    setLoading(true);
    try {
      const logs = await auditLogService.getAuditLogsByEntity(entity, entityId);
      setAuditLogs(logs.slice(0, maxLogs));
    } catch (error) {
      console.error('Failed to fetch entity audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [entity, entityId, maxLogs]);

  useEffect(() => {
    fetchEntityAuditLogs();
  }, [fetchEntityAuditLogs]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Activity className="w-6 h-6 animate-pulse text-blue-500 mr-2" />
            <span className="text-gray-600">Loading audit logs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h4>
            <p className="text-gray-500">No audit logs found for this {entity}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {auditLogs.map((log, index) => {
            const ActionIcon = getActionIcon(log.action);
            
            return (
              <div key={log.id} className="group">
                <div className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)} group-hover:scale-110 transition-transform duration-200`}>
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {log.actorName || 'Unknown User'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getActionVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {log.action === 'CREATE' && `Created ${entity}`}
                      {log.action === 'UPDATE' && `Updated ${entity}`}
                      {log.action === 'DELETE' && `Deleted ${entity}`}
                      {log.action === 'VIEW' && `Viewed ${entity}`}
                      {log.diff && (log.diff.before || log.diff.after) && ` (changes recorded)`}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {index < auditLogs.length - 1 && (
                  <div className="ml-9 h-4 w-px bg-gray-200"></div>
                )}
              </div>
            );
          })}
          
          {auditLogs.length === maxLogs && (
            <div className="text-center pt-4 border-t border-gray-100">
              <button 
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline transition-colors duration-200"
                onClick={() => window.location.hash = '#logs'}
              >
                View all audit logs →
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityAuditLogs;