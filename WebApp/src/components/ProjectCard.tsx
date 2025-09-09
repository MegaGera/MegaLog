import { Folder, ChevronRight } from 'lucide-react';
import type { ServiceGroup } from '../types/log';

interface ServiceCardProps {
  serviceGroup: ServiceGroup;
  onServiceClick: (service: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ serviceGroup, onServiceClick }) => {
  const getRecentActivity = () => {
    if (serviceGroup.logs.length === 0) return 'No activity';
    
    const latestLog = serviceGroup.logs.reduce((latest, log) => {
      return new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest;
    });
    
    return `Last activity: ${latestLog.action} by ${latestLog.username}`;
  };

  const getActivityStats = () => {
    const actions = serviceGroup.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actions)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3);

    return topActions;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onServiceClick(serviceGroup.service)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Folder className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{serviceGroup.service}</h3>
            <p className="text-sm text-gray-500">{serviceGroup.count} logs</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">{getRecentActivity()}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Actions</h4>
        <div className="space-y-1">
          {getActivityStats().map(([action, count]) => (
            <div key={action} className="flex justify-between items-center">
              <span className="text-sm text-gray-700 capitalize">{action}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 