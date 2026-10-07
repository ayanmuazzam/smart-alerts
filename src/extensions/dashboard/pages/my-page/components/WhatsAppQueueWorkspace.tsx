import React, { useState } from 'react';
import {
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
  Chat,
  Package,
  SearchSmall,
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
  onResolve: (ids: string[], action: 'sent' | 'dismiss') => Promise<void>;
  search: string;
  onSearchChange: (value: string) => void;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function WhatsAppQueueWorkspace({
  whatsapp,
  onResolve,
  search,
  onSearchChange,
}: WhatsAppQueueWorkspaceProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Server already filtered by q; render page as-is.
  const filteredItems = whatsapp;

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selected.includes(item._id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredItems.map((i) => i._id));
      setSelected((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelected((prev) => [
        ...new Set([...prev, ...filteredItems.map((i) => i._id)]),
      ]);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const runResolve = async (ids: string[], action: 'sent' | 'dismiss') => {
    if (!ids.length) return;
    setProcessingIds(ids);
    try {
      await onResolve(ids, action);
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    } finally {
      setProcessingIds([]);
    }
  };

  const busyAny = processingIds.length > 0;

  return (
    <Box direction="vertical" gap="SP4">
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
      </div>

      <Box gap="SP3" style={{ flexWrap: 'wrap' }}>
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
              1-Click wa.me
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
              Dispatch Channel
            </span>
          </div>
        </div>

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

      <Card>
        <Card.Header
          title={`WhatsApp Queue Directory (${filteredItems.length})`}
          subtitle="Customer waitlist records awaiting restock notification dispatch"
        />
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP4">
            <Box
              width="100%"
              verticalAlign="middle"
              align="space-between"
              gap="SP3"
              style={{ flexWrap: 'wrap' }}
            >
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
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <Chat size="15" />
                  <span>Pending Customer Chats ({whatsapp.length})</span>
                </div>
              </div>

              <Box style={{ width: '250px' }}>
                <Input
                  size="small"
                  prefix={<SearchSmall />}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search phone or product..."
                  clearButton
                  onClear={() => onSearchChange('')}
                />
              </Box>
            </Box>

            {selected.length > 0 ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #1E40AF 0%, #0F172A 100%)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <Box verticalAlign="middle" gap="SP2">
                  <span
                    style={{
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {selected.length}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    chat{selected.length > 1 ? 's' : ''} selected
                  </span>
                </Box>
                <Box verticalAlign="middle" gap="SP2">
                  <Button
                    size="small"
                    disabled={busyAny}
                    prefixIcon={<Check />}
                    onClick={() => runResolve(selected, 'sent')}
                  >
                    Mark Sent
                  </Button>
                  <Button
                    size="small"
                    skin="destructive"
                    disabled={busyAny}
                    prefixIcon={<DeleteSmall />}
                    onClick={() => runResolve(selected, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                </Box>
              </div>
            ) : null}

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
                <div style={{ minWidth: '820px' }}>
                  <Table
                    data={filteredItems}
                    columns={[
                      {
                        title: (
                          <Checkbox
                            checked={allFilteredSelected}
                            indeterminate={
                              selected.length > 0 && !allFilteredSelected
                            }
                            onChange={toggleAll}
                          />
                        ),
                        width: '48px',
                        render: (row: WhatsAppQueueItem) => (
                          <Checkbox
                            checked={selected.includes(row._id)}
                            onChange={() => toggleOne(row._id)}
                          />
                        ),
                      },
                      {
                        title: 'Customer Phone',
                        width: '22%',
                        render: (row: WhatsAppQueueItem) => (
                          <Box verticalAlign="middle" gap="SP2">
                            <MonoIconBadge tone="green" size={38} radius={10}>
                              <Chat size="18" />
                            </MonoIconBadge>
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
                        width: '24%',
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
                        width: '22%',
                        render: (row: WhatsAppQueueItem) => (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(row.waMeUrl, '_blank', 'noopener,noreferrer')
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              background: '#ECFDF5',
                              color: '#15803D',
                              border: '1px solid #A7F3D0',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
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
                        width: '24%',
                        render: (row: WhatsAppQueueItem) => {
                          const busy = processingIds.includes(row._id);
                          return (
                            <Box verticalAlign="middle" gap="SP2">
                              <button
                                type="button"
                                disabled={busy || busyAny}
                                onClick={() => runResolve([row._id], 'sent')}
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
                                  cursor: busy || busyAny ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                <Check size="13" />
                                <span>{busy ? 'Saving…' : 'Mark Sent'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={busy || busyAny}
                                onClick={() => runResolve([row._id], 'dismiss')}
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
                                  cursor: busy || busyAny ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                  fontFamily: FONT_SANS,
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
