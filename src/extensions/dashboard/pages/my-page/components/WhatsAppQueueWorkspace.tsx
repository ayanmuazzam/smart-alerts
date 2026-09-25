import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Input,
  Table,
  Text,
} from '@wix/design-system';
import {
  Chat,
  Package,
  SearchSmall,
  SettingsSmall,
  Check,
  DeleteSmall,
  Sparkles,
} from '@wix/wix-ui-icons-common';
import { MonoIconBadge } from './MonoIconBadge';

export interface WhatsAppQueueItem {
  _id: string;
  phone: string;
  productId: string;
  productName?: string;
  waMeUrl: string;
  createdAt?: string;
}

export interface WhatsAppQueueWorkspaceProps {
  whatsapp: WhatsAppQueueItem[];
  config: any;
  onMarkSent: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onGoSettings: () => void;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function WhatsAppQueueWorkspace({
  whatsapp,
  config,
  onMarkSent,
  onDismiss,
  onGoSettings,
}: WhatsAppQueueWorkspaceProps) {
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const waSetup = config?.whatsappSetup || {};
  const isApiMode = waSetup.mode === 'api';

  const filteredItems = whatsapp.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (item.phone || '').toLowerCase().includes(term) ||
      (item.productName || '').toLowerCase().includes(term) ||
      (item.productId || '').toLowerCase().includes(term)
    );
  });

  const handleAction = async (action: 'sent' | 'dismiss', id: string) => {
    setProcessingId(id);
    try {
      if (action === 'sent') await onMarkSent(id);
      else await onDismiss(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. WhatsApp Explanatory Attention Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box verticalAlign="middle" gap="SP3">
          <MonoIconBadge tone="blue" size={40}>
            <Chat size="20" />
          </MonoIconBadge>
          <Box direction="vertical" gap="2px">
            <Text weight="bold" size="medium">
              1-Click WhatsApp Restock Dispatch
            </Text>
            <Text size="small" secondary>
              When out-of-stock items are replenished, subscribed shoppers appear here. Click
              &ldquo;Open WhatsApp Chat&rdquo; to launch WhatsApp with a pre-filled restock alert,
              then mark it sent.
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
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
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
          <span>Configure WhatsApp</span>
        </button>
      </div>

      {/* 2. Top Elevated Metric Cards */}
      <Box gap="SP3" style={{ flexWrap: 'wrap' }}>
        {/* Metric 1: Pending Queue */}
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
          <MonoIconBadge tone="blue" size={44}>
            <Chat size="20" />
          </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {whatsapp.length}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Pending in Queue
            </span>
          </div>
        </div>

        {/* Metric 2: Delivery Mode */}
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
          <MonoIconBadge tone="blue" size={44}>
            <Sparkles size="20" />
          </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {isApiMode ? 'API Mode' : '1-Click wa.me'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Dispatch Channel
            </span>
          </div>
        </div>

        {/* Metric 3: Active Catalog Watches */}
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
          <MonoIconBadge tone="violet" size={44}>
            <Package size="20" />
          </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: FONT_SANS }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {whatsapp.length > 0 ? 'Ready' : 'Clear'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Queue Health
            </span>
          </div>
        </div>
      </Box>

      {/* 3. Main Unified Queue Card */}
      <Card>
        <Card.Header
          title={`WhatsApp Queue Directory (${filteredItems.length})`}
          subtitle="Customer waitlist records awaiting restock notification dispatch"
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#116DFF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    boxShadow: '0 2px 8px rgba(17, 109, 255, 0.35)',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <Chat size="15" />
                  <span>Pending Customer Chats ({whatsapp.length})</span>
                </div>
              </div>

              {/* Search Bar */}
              <Box style={{ width: '250px' }}>
                <Input
                  size="small"
                  prefix={<SearchSmall />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search phone or product..."
                  clearButton
                  onClear={() => setSearch('')}
                />
              </Box>
            </Box>

            {/* Table or Empty State with Overflow Protection */}
            {filteredItems.length === 0 ? (
              <EmptyState
                title={search ? 'No matching customer chats found' : 'WhatsApp queue is clear'}
                subtitle={
                  search
                    ? 'Try searching with another phone number or product name.'
                    : 'Shoppers who opt in on out-of-stock product pages with their WhatsApp number will appear here as soon as inventory arrives.'
                }
                skin="section"
              />
            ) : (
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: '760px' }}>
                  <Table
                    data={filteredItems}
                    columns={[
                      {
                        title: 'Customer Phone',
                        width: '24%',
                        render: (row: WhatsAppQueueItem) => (
                          <Box verticalAlign="middle" gap="SP2">
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                              }}
                            >
                              <Chat size="18" />
                            </div>
                            <Box direction="vertical" gap="2px" style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '13.5px',
                                  color: '#0F172A',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                {row.phone}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#64748B',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                {row.createdAt
                                  ? `Requested ${new Date(row.createdAt).toLocaleDateString()}`
                                  : 'Storefront waitlist opt-in'}
                              </span>
                            </Box>
                          </Box>
                        ),
                      },
                      {
                        title: 'Requested Product',
                        width: '26%',
                        render: (row: WhatsAppQueueItem) => (
                          <Box verticalAlign="middle" gap="SP2">
                            <MonoIconBadge tone="blue" size={34} radius={8}>
                              <Package size="16" />
                            </MonoIconBadge>
                            <Box direction="vertical" gap="2px" style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  color: '#1E293B',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                {row.productName || 'Unknown Product'}
                              </span>
                              {row.productId ? (
                                <span
                                  title={row.productId}
                                  style={{
                                    fontSize: '11px',
                                    color: '#94A3B8',
                                    maxWidth: '170px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  ID: {row.productId}
                                </span>
                              ) : null}
                            </Box>
                          </Box>
                        ),
                      },
                      {
                        title: '1-Click Dispatch',
                        width: '24%',
                        render: (row: WhatsAppQueueItem) => (
                          <button
                            type="button"
                            onClick={() => window.open(row.waMeUrl, '_blank', 'noopener,noreferrer')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                              fontFamily: FONT_SANS,
                            }}
                          >
                            <Chat size="15" />
                            <span>Open WhatsApp Chat</span>
                          </button>
                        ),
                      },
                      {
                        title: 'Resolve',
                        width: '26%',
                        render: (row: WhatsAppQueueItem) => {
                          const busy = processingId === row._id;
                          return (
                            <Box verticalAlign="middle" gap="SP2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleAction('sent', row._id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  backgroundColor: '#F0FDF4',
                                  border: '1px solid #86EFAC',
                                  borderRadius: '8px',
                                  color: '#15803D',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: busy ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  fontFamily: FONT_SANS,
                                  boxShadow: '0 1px 2px rgba(21, 128, 61, 0.08)',
                                }}
                              >
                                <Check size="13" />
                                <span>{busy ? 'Saving…' : 'Mark Sent'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleAction('dismiss', row._id)}
                                title="Dismiss from queue"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '6px 10px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid transparent',
                                  borderRadius: '8px',
                                  color: '#94A3B8',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: busy ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  fontFamily: FONT_SANS,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#EF4444';
                                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#94A3B8';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <DeleteSmall size="14" />
                                <span>Dismiss</span>
                              </button>
                            </Box>
                          );
                        },
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
