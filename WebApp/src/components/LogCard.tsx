import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, User, Activity, Clock } from 'lucide-react';
import type { Log } from '../types/log';

interface LogCardProps {
  log: Log;
}

export const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-red-100 text-red-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'view': 'bg-gray-100 text-gray-800',
    };
    return colors[action.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const hasExpandableContent = () => {
    return (log.details && Object.keys(log.details).length > 0) ||
           (log.metadata && Object.keys(log.metadata).length > 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Compact row view */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => hasExpandableContent() && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Expand arrow */}
          <div className="flex-shrink-0">
            {hasExpandableContent() ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Service and Microservice */}
          <div className="flex items-center space-x-2 min-w-0">
            <Activity className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 truncate">{log.service}</span>
            {log.microservice && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 truncate">{log.microservice}</span>
              </>
            )}
          </div>

          {/* Username */}
          <div className="flex items-center space-x-1 min-w-0">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 truncate">{log.username}</span>
          </div>

          {/* Timestamp */}
          <div className="flex items-center space-x-1 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 text-sm truncate">{formatTimestamp(log.timestamp)}</span>
          </div>
        </div>

        {/* Action badge */}
        <div className="flex-shrink-0 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
            {log.action}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasExpandableContent() && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Details</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {Object.entries(log.details).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                    </div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Metadata</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {Object.entries(log.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                    </div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Processed: {formatTimestamp(log.processed_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 