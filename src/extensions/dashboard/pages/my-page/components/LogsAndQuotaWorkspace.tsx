import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  Table,
  Text,
} from '@wix/design-system';
import {
  DateAndTime,
  Email,
  Chat,
  Package,
  Tag,
  Sparkles,
  Check,
  StatusAlert,
  DeleteSmall,
  SettingsSmall,
  SearchSmall,
} from '@wix/wix-ui-icons-common';

export interface AlertHistoryItem {
  _id: string;
  alertType?: string;
  channel?: string;
  to?: string;
  status?: string;
  sentAt?: string;
}

export interface LogsAndQuotaWorkspaceProps {
  quota: any;
  alerts: AlertHistoryItem[];
  selectedAlerts: string[];
  setSelectedAlerts: (ids: string[] | ((prev: string[]) => string[])) => void;
  onDeleteSelectedAlerts: () => Promise<void>;
  onClearAllAlerts: () => Promise<void>;
  onGoSettings: () => void;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function formatAlertType(type?: string): { title: string; icon: React.ReactNode } {
  const t = (type || '').toLowerCase();
  if (t.includes('back_in_stock') || t.includes('backinstock')) {
    return { title: 'Back in Stock', icon: <Package size="16" /> };
  }
  if (t.includes('price_drop') || t.includes('pricedrop')) {
    return { title: 'Price Watch Alert', icon: <Tag size="16" /> };
  }
  if (t.includes('low_stock') || t.includes('lowstock')) {
    return { title: 'Low Stock Alert', icon: <StatusAlert size="16" /> };
  }
  if (t.includes('out_of_stock') || t.includes('outofstock')) {
    return { title: 'Depleted Stock Alert', icon: <StatusAlert size="16" /> };
  }
  if (t.includes('new_order') || t.includes('order')) {
    return { title: 'New Order Alert', icon: <Sparkles size="16" /> };
  }
  if (t.includes('digest')) {
    return { title: 'Weekly Digest', icon: <DateAndTime size="16" /> };
  }
  const clean = (type || 'Notification')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: clean, icon: <Email size="16" /> };
}

export function LogsAndQuotaWorkspace({
  quota,
  alerts,
  selectedAlerts,
  setSelectedAlerts,
  onDeleteSelectedAlerts,
  onClearAllAlerts,
  onGoSettings,
}: LogsAndQuotaWorkspaceProps) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'failed'>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  // Quota computations
  const quotaTotal = Number(quota?.quota || 5000);
  const quotaRemaining = Number(quota?.remaining ?? quotaTotal);
  const quotaUsed = Number(quota?.used ?? Math.max(0, quotaTotal - quotaRemaining));
  const quotaPercent = Math.min(100, Math.round((quotaUsed / (quotaTotal || 1)) * 100));

  // Counts
  const emailCount = alerts.filter(
    (a) => !a.channel || String(a.channel).toLowerCase() === 'email',
  ).length;
  const whatsappCount = alerts.filter(
    (a) => String(a.channel).toLowerCase() === 'whatsapp',
  ).length;
  const failedCount = alerts.filter((a) => {
    const s = String(a.status || '').toLowerCase();
    return s === 'failed' || s === 'error';
  }).length;

  // Filter alerts by search & channel
  const filteredAlerts = alerts.filter((item) => {
    const s = (item.status || '').toLowerCase();
    const c = (item.channel || 'email').toLowerCase();

    if (channelFilter === 'email' && c !== 'email') return false;
    if (channelFilter === 'whatsapp' && c !== 'whatsapp') return false;
    if (channelFilter === 'failed' && s !== 'failed' && s !== 'error') return false;

    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (item.to || '').toLowerCase().includes(term) ||
      (item.alertType || '').toLowerCase().includes(term) ||
      (item.channel || '').toLowerCase().includes(term)
    );
  });

  const isAllSelected =
    filteredAlerts.length > 0 &&
    filteredAlerts.every((item) => selectedAlerts.includes(item._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map((i) => i._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await onDeleteSelectedAlerts();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all alert history? This audit log cannot be recovered.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onClearAllAlerts();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Hero Quota & Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
          border: '1px solid #DBEAFE',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box verticalAlign="middle" gap="SP3">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.28)',
              flexShrink: 0,
            }}
          >
            <DateAndTime size="20" />
          </div>
          <Box direction="vertical" gap="2px">
            <Text weight="bold" size="medium">
              Notification Quota &amp; Audit Logs
            </Text>
            <Text size="small" secondary>
              Your store has dispatched {quotaUsed.toLocaleString()} of {quotaTotal.toLocaleString()} alerts
              this billing cycle ({quotaRemaining.toLocaleString()} remaining).
            </Text>
          </Box>
        </Box>
        <button
          type="button"
          onClick={onGoSettings}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            color: '#1D4ED8',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontFamily: FONT_SANS,
          }}
        >
          <SettingsSmall size="15" />
          <span>Manage in Settings</span>
        </button>
      </div>

      {/* 2. Top Elevated Metric Cards */}
      <Box gap="SP3" style={{ flexWrap: 'wrap' }}>
        {/* Metric 1: Monthly Quota */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px 18px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
              flexShrink: 0,
            }}
          >
            <Sparkles size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {quotaTotal.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Monthly Quota
            </span>
          </div>
        </div>

        {/* Metric 2: Alerts Dispatched */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px 18px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
              flexShrink: 0,
            }}
          >
            <Check size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {quotaUsed.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Alerts Dispatched ({quotaPercent}%)
            </span>
          </div>
        </div>

        {/* Metric 3: Remaining Allocation */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px 18px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(139, 92, 246, 0.25)',
              flexShrink: 0,
            }}
          >
            <DateAndTime size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {quotaRemaining.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Remaining Alerts
            </span>
          </div>
        </div>
      </Box>

      {/* 3. Sleek Quota Progress Card */}
      <Card>
        <Card.Header
          title="Quota Utilization"
          subtitle="Real-time dispatch allowance status for the current monthly cycle"
          suffix={
            <Badge
              size="small"
              skin={
                quotaPercent >= 90
                  ? 'danger'
                  : quotaPercent >= 75
                    ? 'warning'
                    : 'success'
              }
            >
              {quotaPercent}% Used
            </Badge>
          }
        />
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP2">
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#EDEFF2',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${quotaPercent}%`,
                  height: '100%',
                  backgroundColor:
                    quotaPercent >= 90
                      ? '#EF4444'
                      : quotaPercent >= 75
                        ? '#F59E0B'
                        : '#116DFF',
                  transition: 'width 0.3s ease-in-out',
                  borderRadius: '4px',
                }}
              />
            </div>
            <Box align="space-between" verticalAlign="middle">
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: FONT_SANS }}>
                {quotaUsed.toLocaleString()} used
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: FONT_SANS }}>
                {quotaTotal.toLocaleString()} monthly limit
              </span>
            </Box>
          </Box>
        </Card.Content>
      </Card>

      {/* 4. Alert History Directory Card */}
      <Card>
        <Card.Header
          title={`Alert History (${filteredAlerts.length})`}
          subtitle="Audit log of all sent alerts and customer notifications"
          suffix={
            <Box gap="SP2">
              <Button
                size="small"
                priority="secondary"
                disabled={!selectedAlerts.length || isDeleting}
                onClick={handleDeleteSelected}
              >
                Delete selected ({selectedAlerts.length})
              </Button>
              <Button
                size="small"
                skin="destructive"
                priority="secondary"
                disabled={isDeleting || alerts.length === 0}
                onClick={handleClearAll}
              >
                Clear history
              </Button>
            </Box>
          }
        />
        <Card.Divider />

        <Card.Content>
          <Box direction="vertical" gap="SP4">
            {/* Sleek Modern Toolbar */}
            <Box
              width="100%"
              verticalAlign="middle"
              align="space-between"
              gap="SP3"
              style={{ flexWrap: 'wrap' }}
            >
              {/* Segmented Pill Toggle in Brand Blue */}
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#F1F5F9',
                  padding: '4px',
                  borderRadius: '10px',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setChannelFilter('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: channelFilter === 'all' ? '#116DFF' : 'transparent',
                    color: channelFilter === 'all' ? '#FFFFFF' : '#475569',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      channelFilter === 'all' ? '0 2px 8px rgba(17, 109, 255, 0.35)' : 'none',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <DateAndTime size="15" />
                  <span>All ({alerts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelFilter('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: channelFilter === 'email' ? '#116DFF' : 'transparent',
                    color: channelFilter === 'email' ? '#FFFFFF' : '#475569',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      channelFilter === 'email' ? '0 2px 8px rgba(17, 109, 255, 0.35)' : 'none',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <Email size="15" />
                  <span>Email ({emailCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelFilter('whatsapp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: channelFilter === 'whatsapp' ? '#116DFF' : 'transparent',
                    color: channelFilter === 'whatsapp' ? '#FFFFFF' : '#475569',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      channelFilter === 'whatsapp' ? '0 2px 8px rgba(17, 109, 255, 0.35)' : 'none',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <Chat size="15" />
                  <span>WhatsApp ({whatsappCount})</span>
                </button>

                {failedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setChannelFilter('failed')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: channelFilter === 'failed' ? '#EF4444' : 'transparent',
                      color: channelFilter === 'failed' ? '#FFFFFF' : '#EF4444',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow:
                        channelFilter === 'failed' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                      fontFamily: FONT_SANS,
                    }}
                  >
                    <StatusAlert size="15" />
                    <span>Failed ({failedCount})</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <Box style={{ width: '250px' }}>
                <Input
                  size="small"
                  prefix={<SearchSmall />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipient or type..."
                  clearButton
                  onClear={() => setSearch('')}
                />
              </Box>
            </Box>

            {/* Table or Empty State with Overflow Protection */}
            {filteredAlerts.length === 0 ? (
              <EmptyState
                title={search ? 'No matching audit records' : 'No notifications sent yet'}
                subtitle={
                  search
                    ? 'Try searching with another recipient or alert type.'
                    : 'When stock replenishment or price drop alerts are triggered, delivery audit records will appear here.'
                }
                skin="section"
              />
            ) : (
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: '780px' }}>
                  <Table
                    data={filteredAlerts}
                    columns={[
                      {
                        title: (
                          <Checkbox
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                          />
                        ),
                        width: '44px',
                        render: (row: AlertHistoryItem) => (
                          <Checkbox
                            checked={selectedAlerts.includes(row._id)}
                            onChange={() => toggleSelectRow(row._id)}
                          />
                        ),
                      },
                      {
                        title: 'Alert Type',
                        width: '24%',
                        render: (row: AlertHistoryItem) => {
                          const meta = formatAlertType(row.alertType);
                          return (
                            <Box verticalAlign="middle" gap="SP2">
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#116DFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {meta.icon}
                              </div>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  color: '#0F172A',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                {meta.title}
                              </span>
                            </Box>
                          );
                        },
                      },
                      {
                        title: 'Channel',
                        width: '14%',
                        render: (row: AlertHistoryItem) => {
                          const isWa = String(row.channel).toLowerCase() === 'whatsapp';
                          return (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: isWa ? '#DCFCE7' : '#EFF6FF',
                                color: isWa ? '#15803D' : '#1D4ED8',
                                border: isWa ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
                                fontFamily: FONT_SANS,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isWa ? <Chat size="13" /> : <Email size="13" />}
                              <span>{isWa ? 'WhatsApp' : 'Email'}</span>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Recipient',
                        width: '28%',
                        render: (row: AlertHistoryItem) => (
                          <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                            <span
                              title={row.to || '—'}
                              style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#1E293B',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                verticalAlign: 'middle',
                                fontFamily: FONT_SANS,
                              }}
                            >
                              {row.to || '—'}
                            </span>
                          </div>
                        ),
                      },
                      {
                        title: 'Delivery Status',
                        width: '16%',
                        render: (row: AlertHistoryItem) => {
                          const s = String(row.status || '').toLowerCase();
                          const isSuccess = s === 'sent' || s === 'delivered' || s === 'success';
                          const isFailed = s === 'failed' || s === 'error';

                          const bg = isSuccess ? '#ECFDF5' : isFailed ? '#FEE2E2' : '#EFF6FF';
                          const color = isSuccess ? '#065F46' : isFailed ? '#991B1B' : '#1D4ED8';
                          const border = isSuccess ? '#A7F3D0' : isFailed ? '#FECDD3' : '#BFDBFE';
                          const dotColor = isSuccess ? '#10B981' : isFailed ? '#EF4444' : '#3B82F6';
                          const label = isSuccess ? 'Delivered' : isFailed ? 'Failed' : row.status || 'Sent';

                          return (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                backgroundColor: bg,
                                color: color,
                                border: `1px solid ${border}`,
                                fontFamily: FONT_SANS,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 0 2px ${dotColor}33`,
                                }}
                              />
                              <span>{label}</span>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Dispatched At',
                        width: '18%',
                        render: (row: AlertHistoryItem) => (
                          <span style={{ fontSize: '12px', color: '#64748B', fontFamily: FONT_SANS }}>
                            {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}
                          </span>
                        ),
                      },
                    ]}
                  >
                    <Table.Content />
                  </Table>
                </div>
              </div>
            )}
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
