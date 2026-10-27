import React from 'react';
import {
  LogsAndQuotaWorkspace,
  type AlertChannelFilter,
} from '../components/LogsAndQuotaWorkspace';

type Props = {
  quota: any;
  alerts: any[];
  alertsTotalCount?: number;
  onLoadMoreAlerts?: () => void;
  alertsLoadingMore?: boolean;
  selectedAlerts: string[];
  setSelectedAlerts: (ids: string[] | ((prev: string[]) => string[])) => void;
  onDeleteSelectedAlerts: () => Promise<void>;
  onClearAllAlerts: () => Promise<void>;
  onGoSettings: () => void;
  alertSearch: string;
  onAlertSearchChange: (value: string) => void;
  alertChannelFilter: AlertChannelFilter;
  onAlertChannelFilterChange: (value: AlertChannelFilter) => void;
};

export function LogsAndQuotaScreen({
  quota,
  alerts,
  alertsTotalCount,
  onLoadMoreAlerts,
  alertsLoadingMore,
  selectedAlerts,
  setSelectedAlerts,
  onDeleteSelectedAlerts,
  onClearAllAlerts,
  onGoSettings,
  alertSearch,
  onAlertSearchChange,
  alertChannelFilter,
  onAlertChannelFilterChange,
}: Props) {
  return (
    <LogsAndQuotaWorkspace
      quota={quota}
      alerts={alerts}
      alertsTotalCount={alertsTotalCount}
      onLoadMore={onLoadMoreAlerts}
      loadingMore={alertsLoadingMore}
      selectedAlerts={selectedAlerts}
      setSelectedAlerts={setSelectedAlerts}
      onDeleteSelectedAlerts={onDeleteSelectedAlerts}
      onClearAllAlerts={onClearAllAlerts}
      onGoSettings={onGoSettings}
      search={alertSearch}
      onSearchChange={onAlertSearchChange}
      channelFilter={alertChannelFilter}
      onChannelFilterChange={onAlertChannelFilterChange}
    />
  );
}
