import React from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Table,
  Text,
} from '@wix/design-system';
import {
  User,
  UserChecked,
  Check,
  Package,
  Tag,
  Sparkles,
  DateAndTime,
  StatusAlert,
  SendSmall,
  SettingsSmall,
  ArrowRightSmall,
  Chat,
  Email,
} from '@wix/wix-ui-icons-common';
import { EmptyOnboarding } from '../components/EmptyOnboarding';
import { MonoIconBadge, type MonoIconTone } from '../components/MonoIconBadge';
import type { AutomationSub, CustomizationSub } from '../adminApi';

type Props = {
  kpis: Record<string, number> | null;
  activity: { id: string; kind: string; label: string; at?: string }[];
  config: any;
  onOpenAutomation: (sub: AutomationSub) => void;
  onOpenCustomization: (sub?: CustomizationSub) => void;
  onTestAlert: () => void;
};

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function getActivityMeta(kind: string): {
  icon: React.ReactNode;
  tone: MonoIconTone;
  badgeSkin: 'success' | 'standard' | 'warning' | 'neutral';
  label: string;
} {
  const k = (kind || '').toLowerCase();
  if (k.includes('alert') || k.includes('sent') || k.includes('dispatched')) {
    return {
      icon: <Check size="14" />,
      tone: 'emerald',
      badgeSkin: 'success',
      label: 'Alert Sent',
    };
  }
  if (k.includes('sub') || k.includes('user') || k.includes('signup')) {
    return {
      icon: <UserChecked size="14" />,
      tone: 'blue',
      badgeSkin: 'standard',
      label: 'Subscriber',
    };
  }
  if (k.includes('price')) {
    return {
      icon: <Tag size="14" />,
      tone: 'violet',
      badgeSkin: 'standard',
      label: 'Price Watch',
    };
  }
  return {
    icon: <Package size="14" />,
    tone: 'amber',
    badgeSkin: 'warning',
    label: kind || 'Activity',
  };
}

export function DashboardScreen({
  kpis,
  activity,
  config,
  onOpenAutomation,
  onOpenCustomization,
  onTestAlert,
}: Props) {
  if (!kpis) return null;

  const sync = config?.syncSettings || {};
  const wa = config?.whatsappSetup || {};

  const activeSubscribers =
    kpis.activeSubscribers ?? (kpis.onHoldStock || 0) + (kpis.watchingPrice || 0);
  const onHoldStock = kpis.onHoldStock || 0;
  const watchingPrice = kpis.watchingPrice || 0;
  const pendingAlerts = kpis.pendingAlerts ?? kpis.whatsappPending ?? 0;
  const alertsSent = kpis.alertsSent ?? 0;
  const quota = kpis.quota || 5000;
  const remaining = kpis.remaining ?? quota;
  const used = kpis.used ?? Math.max(0, quota - remaining);
  const quotaPercent = Math.min(100, Math.round((used / (quota || 1)) * 100));

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Sleek Store Alert Intelligence Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
          border: '1px solid #DBEAFE',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          fontFamily: FONT_SANS,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MonoIconBadge tone="blue" size={42}>
            <Sparkles size="20" />
          </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Store Alert Overview
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid #BBF7D0',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 0 2px #10B98133',
                  }}
                />
                Engine Active
              </span>
            </div>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              Live subscriber demand, replenishment tracking, and automated dispatch pipeline
            </span>
          </div>
        </div>

        {/* Streamlined Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onTestAlert}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
              fontFamily: FONT_SANS,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.borderColor = '#93C5FD';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#BFDBFE';
            }}
          >
            <SendSmall size="15" />
            <span>Send Test Alert</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAutomation('rules')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#116DFF',
              border: '1px solid #116DFF',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(17, 109, 255, 0.3)',
              transition: 'all 0.15s ease',
              fontFamily: FONT_SANS,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0F5FE0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#116DFF';
            }}
          >
            <SettingsSmall size="15" />
            <span>Automation Rules</span>
          </button>
        </div>
      </div>

      {/* 2. Elevated Metric KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1: Active Subscribers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenAutomation('lists')}
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontFamily: FONT_SANS,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#BFDBFE';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoIconBadge tone="blue" size={44}>
              <User size="20" />
            </MonoIconBadge>
            <span
              style={{
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              View directory <ArrowRightSmall size="14" />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {activeSubscribers.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Active Subscribers
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #BFDBFE',
              }}
            >
              {onHoldStock} Back in stock
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#F5F3FF',
                color: '#7C3AED',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #DDD6FE',
              }}
            >
              {watchingPrice} Price watch
            </span>
          </div>
        </div>

        {/* Metric 2: Alerts Sent */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenAutomation('history')}
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontFamily: FONT_SANS,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#A7F3D0';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoIconBadge tone="emerald" size={44}>
              <Check size="20" />
            </MonoIconBadge>
            <span
              style={{
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Audit logs <ArrowRightSmall size="14" />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {alertsSent.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Alerts Dispatched
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Successfully delivered this billing cycle
          </span>
        </div>

        {/* Metric 3: Pending Queue */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenAutomation('whatsapp')}
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontFamily: FONT_SANS,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FDE68A';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoIconBadge tone="amber" size={44}>
              <DateAndTime size="20" />
            </MonoIconBadge>
            <span
              style={{
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              View queue <ArrowRightSmall size="14" />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {pendingAlerts.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Pending In Queue
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            {pendingAlerts > 0 ? 'Awaiting dispatch or batch window' : 'All notification queues clear'}
          </span>
        </div>

        {/* Metric 4: Allocation Quota */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenAutomation('history')}
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontFamily: FONT_SANS,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#DDD6FE';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoIconBadge tone="violet" size={44}>
              <Sparkles size="20" />
            </MonoIconBadge>
            <span
              style={{
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Quota status <ArrowRightSmall size="14" />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Remaining Allocation
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#EDEFF2',
                borderRadius: '3px',
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
                  borderRadius: '3px',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              {used.toLocaleString()} of {quota.toLocaleString()} used ({quotaPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Actionable Restock Opportunity Banner (when shoppers are on hold) */}
      {onHoldStock > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
            flexWrap: 'wrap',
            gap: '14px',
            fontFamily: FONT_SANS,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <MonoIconBadge tone="amber" size={42}>
              <Package size="20" />
            </MonoIconBadge>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#92400E' }}>
                {onHoldStock} Customer{onHoldStock > 1 ? 's' : ''} Waiting for Restocked Inventory
              </span>
              <span style={{ fontSize: '12.5px', color: '#B45309' }}>
                Shoppers have registered for out-of-stock items. Restock items in your store or set restock dates in the Inventory Tracker.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenAutomation('inventory')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              color: '#B45309',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              fontFamily: FONT_SANS,
            }}
          >
            <span>Open Inventory Tracker</span>
            <ArrowRightSmall size="15" />
          </button>
        </div>
      )}

      {/* 4. Live Activity Table (Full Width) */}
      <Card>
        <Card.Header
          title={`Live Activity (${activity.length})`}
          subtitle="Real-time subscriber events and dispatched notifications"
          suffix={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid #BFDBFE',
                fontFamily: FONT_SANS,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                }}
              />
              Live Feed
            </span>
          }
        />
        <Card.Divider />
        <Card.Content>
          {activity.length === 0 ? (
            <EmptyOnboarding
              title="No activity recorded yet"
              subtitle="When shoppers sign up for restock notifications or automated alerts are sent, real-time events will appear here."
              primaryLabel="Open automation rules"
              onPrimary={() => onOpenAutomation('rules')}
              secondaryLabel="View subscribers"
              onSecondary={() => onOpenAutomation('lists')}
            />
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: '700px' }}>
                <Table
                  data={activity}
                  columns={[
                    {
                      title: 'Event Type',
                      width: '28%',
                      render: (row: any) => {
                        const meta = getActivityMeta(row.kind);
                        return (
                          <Box verticalAlign="middle" gap="SP2">
                            <MonoIconBadge tone={meta.tone} size={28} radius={6}>
                              {meta.icon}
                            </MonoIconBadge>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#0F172A',
                                fontFamily: FONT_SANS,
                              }}
                            >
                              {meta.label}
                            </span>
                          </Box>
                        );
                      },
                    },
                    {
                      title: 'Details',
                      width: '47%',
                      render: (row: any) => (
                        <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                          <span
                            title={row.label}
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#334155',
                              fontFamily: FONT_SANS,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                            }}
                          >
                            {row.label}
                          </span>
                        </div>
                      ),
                    },
                    {
                      title: 'When',
                      width: '25%',
                      render: (row: any) => (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#64748B',
                            fontFamily: FONT_SANS,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.at ? new Date(row.at).toLocaleString() : '—'}
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
        </Card.Content>
      </Card>

      {/* 5. System & Integrations Health Card (Full Width) */}
      <Card>
        <Card.Header
          title="System & Integrations Health"
          subtitle="Real-time operational status of background event listeners and notification pipelines"
          suffix={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid #BBF7D0',
                fontFamily: FONT_SANS,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
              All Systems Operational
            </span>
          }
        />
        <Card.Divider />
        <Card.Content>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              fontFamily: FONT_SANS,
            }}
          >
            {/* Status 1: Catalog Sync */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                  Catalog Event Listener
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  Active
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {sync.lastEventAt
                  ? `Last synced: ${new Date(sync.lastEventAt).toLocaleTimeString()} (${sync.lastEventType || 'Catalog'})`
                  : 'Actively monitoring inventory adjustments and product price drops'}
              </span>
            </div>

            {/* Status 2: WhatsApp Channel */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                  WhatsApp Channel
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor:
                      wa.mode === 'api' && wa.connectionStatus === 'connected'
                        ? '#DCFCE7'
                        : '#F1F5F9',
                    color:
                      wa.mode === 'api' && wa.connectionStatus === 'connected'
                        ? '#15803D'
                        : '#475569',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {wa.mode === 'api'
                    ? `API · ${wa.connectionStatus || 'Ready'}`
                    : 'Manual Queue'}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {wa.mode === 'api'
                  ? 'Direct automated messaging pipeline connected'
                  : 'Click-to-chat dispatch queue active and awaiting customer triggers'}
              </span>
            </div>

            {/* Status 3: Dispatch Allowance */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                  Monthly Dispatch Quota
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {quotaPercent}% Used
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                {used.toLocaleString()} alerts dispatched this cycle · {remaining.toLocaleString()} remaining allocation
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </Box>
  );
}
