import { Folder, ChevronRight } from 'lucide-react';
import type { ServiceGroup } from '../types/log';
import { getDisplayServiceName } from '../utils/serviceNames';

interface ServiceCardProps {
  serviceGroup: ServiceGroup;
  onServiceClick: (service: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ serviceGroup, onServiceClick }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onServiceClick(serviceGroup.service)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Folder className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">
            {getDisplayServiceName(serviceGroup.service)}
          </h3>
        </div>
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Activity Stats</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.totalCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Total Logs</div>
            </div>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.todayCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Today</div>
            </div>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.yesterdayCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Yesterday</div>
            </div>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.todayUsersCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Today Users</div>
            </div>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.yesterdayUsersCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Yesterday Users</div>
            </div>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-sm font-semibold text-gray-900">{serviceGroup.users30DaysCount.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">Last 30 Days Users</div>
            </div>
          </div>
        </div>

        {serviceGroup.latestLog && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Last Activity</h4>
            <div className="bg-gray-50 rounded-md p-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs md:text-sm font-medium text-gray-900 capitalize">{serviceGroup.latestLog.action}</div>
                  <div className="text-[10px] md:text-xs text-gray-500">by {serviceGroup.latestLog.username}</div>
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">
                  {formatDate(serviceGroup.latestLog.timestamp)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 