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
  TextButton,
} from '@wix/design-system';
import {
  Download,
  Package,
  SearchSmall,
  SendSmall,
  DeleteSmall,
  SettingsSmall,
  DateAndTime,
  Check,
  Email,
  Tag,
  Sparkles,
} from '@wix/wix-ui-icons-common';

export interface SubscriberItem {
  _id: string;
  email: string;
  productId: string;
  productName?: string;
  state?: string;
  createdAt?: string;
}

export interface SubscribersListTableProps {
  listType: string;
  setListType: (t: string) => void;
  listSearch: string;
  setListSearch: (s: string) => void;
  listItems: SubscriberItem[];
  selectedSubs: string[];
  setSelectedSubs: (ids: string[] | ((prev: string[]) => string[])) => void;
  onExportCsv: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onManualTrigger: (productId: string) => Promise<void>;
  onGoRules: () => void;
  onGoCustomization: () => void;
}

// Generate deterministic vibrant gradients based on email
function getAvatarGradient(email: string) {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)', // Indigo -> Blue
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', // Pink -> Purple
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Emerald -> Green
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber -> Orange
    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', // Violet -> Indigo
    'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)', // Cyan -> Sky
  ];
  let hash = 0;
  for (let i = 0; i < (email || '').length; i++) {
    hash = (hash + email.charCodeAt(i)) % gradients.length;
  }
  return gradients[hash] || gradients[0];
}

function getInitials(email: string) {
  if (!email) return 'U';
  const namePart = email.split('@')[0] || '';
  const clean = namePart.replace(/[^a-zA-Z]/g, '');
  if (clean.length >= 2) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (clean[0] || email[0] || 'U').toUpperCase();
}

export function SubscribersListTable({
  listType,
  setListType,
  listSearch,
  setListSearch,
  listItems,
  selectedSubs,
  setSelectedSubs,
  onExportCsv,
  onDeleteSelected,
  onManualTrigger,
  onGoRules,
  onGoCustomization,
}: SubscribersListTableProps) {
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'notified'>('all');

  // Filter by search query
  const searchFiltered = listItems.filter((item) => {
    if (!listSearch) return true;
    const term = listSearch.toLowerCase();
    return (
      (item.email || '').toLowerCase().includes(term) ||
      (item.productName || '').toLowerCase().includes(term) ||
      (item.productId || '').toLowerCase().includes(term)
    );
  });

  // Filter by status tab
  const filteredItems = searchFiltered.filter((item) => {
    if (statusFilter === 'all') return true;
    const isNotified = (item.state || '').toLowerCase() === 'notified';
    if (statusFilter === 'notified') return isNotified;
    if (statusFilter === 'waiting') return !isNotified;
    return true;
  });

  const waitingCount = searchFiltered.filter(
    (i) => !i.state || i.state.toLowerCase() === 'waiting',
  ).length;
  const notifiedCount = searchFiltered.filter(
    (i) => i.state && i.state.toLowerCase() === 'notified',
  ).length;

  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedSubs.includes(item._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSubs([]);
    } else {
      setSelectedSubs(filteredItems.map((i) => i._id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedSubs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSingleTrigger = async (productId: string, id: string) => {
    setTriggeringId(id);
    try {
      await onManualTrigger(productId);
    } finally {
      setTriggeringId(null);
    }
  };

  // Trigger all waiting subscribers
  const handleTriggerAllWaiting = async () => {
    const waitingItems = filteredItems.filter(
      (i) => !i.state || i.state.toLowerCase() === 'waiting',
    );
    const uniqueProductIds = Array.from(new Set(waitingItems.map((i) => i.productId)));
    for (const pid of uniqueProductIds) {
      await onManualTrigger(pid);
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Demand & Insights Banner */}
      {waitingCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
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
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                flexShrink: 0,
              }}
            >
              <Sparkles size="20" />
            </div>
            <Box direction="vertical" gap="2px">
              <Text weight="bold" size="medium">
                High Restock Demand Detected
              </Text>
              <Text size="small" secondary>
                {waitingCount} prospective shopper{waitingCount > 1 ? 's are' : ' is'} waiting to
                purchase. Replenishing items will immediately trigger automatic notifications.
              </Text>
            </Box>
          </Box>
          <Button
            size="small"
            prefixIcon={<SendSmall />}
            onClick={handleTriggerAllWaiting}
          >
            Notify all waiting ({waitingCount})
          </Button>
        </div>
      )}

      {/* 2. Top Metric Cards (Elevated Aesthetics) */}
      <Box gap="SP3" style={{ flexWrap: 'wrap' }}>
        {/* Metric 1: Total Demand */}
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
            <Email size="20" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: '1.1' }}>
              {searchFiltered.length}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              Total Subscribers
            </div>
          </div>
        </div>

        {/* Metric 2: Pending Restock */}
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
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.25)',
              flexShrink: 0,
            }}
          >
            <DateAndTime size="20" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: '1.1' }}>
              {waitingCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              Awaiting Restock
            </div>
          </div>
        </div>

        {/* Metric 3: Alerts Dispatched */}
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
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: '1.1' }}>
              {notifiedCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              Alerts Dispatched
            </div>
          </div>
        </div>
      </Box>

      {/* 3. Main Data Card */}
      <Card>
        {/* Card Header with Category Navigation and Export */}
        <Card.Header
          title="Subscriber Directory"
          subtitle="Real-time opt-in waitlist from storefront widgets"
          suffix={
            <Button
              size="small"
              priority="secondary"
              prefixIcon={<Download />}
              onClick={onExportCsv}
            >
              Export CSV
            </Button>
          }
        />
        <Card.Divider />

        <Card.Content>
          <Box direction="vertical" gap="SP3">
            {/* Sleek Modern Toolbar */}
            <Box
              width="100%"
              verticalAlign="middle"
              align="space-between"
              gap="SP3"
              style={{ flexWrap: 'wrap' }}
            >
              {/* Custom High-End Pill Toggle */}
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
                  onClick={() => {
                    setListType('back_in_stock');
                    setSelectedSubs([]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: listType === 'back_in_stock' ? '#116DFF' : 'transparent',
                    color: listType === 'back_in_stock' ? '#FFFFFF' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      listType === 'back_in_stock'
                        ? '0 2px 8px rgba(17, 109, 255, 0.35)'
                        : 'none',
                  }}
                >
                  <Package size="16" />
                  <span>Back in stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setListType('price_drop');
                    setSelectedSubs([]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: listType === 'price_drop' ? '#116DFF' : 'transparent',
                    color: listType === 'price_drop' ? '#FFFFFF' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      listType === 'price_drop'
                        ? '0 2px 8px rgba(17, 109, 255, 0.35)'
                        : 'none',
                  }}
                >
                  <Tag size="16" />
                  <span>Price watch</span>
                </button>
              </div>

              {/* Status Filter Chips + Search Input */}
              <Box verticalAlign="middle" gap="SP2" style={{ flexWrap: 'wrap' }}>
                {/* Filter Chips */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#F8FAFC',
                    padding: '2px 4px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
                      color: statusFilter === 'all' ? '#0F172A' : '#64748B',
                      fontWeight: statusFilter === 'all' ? 600 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    All ({searchFiltered.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('waiting')}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === 'waiting' ? '#FFFFFF' : 'transparent',
                      color: statusFilter === 'waiting' ? '#B45309' : '#64748B',
                      fontWeight: statusFilter === 'waiting' ? 600 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow:
                        statusFilter === 'waiting' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    Waiting ({waitingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('notified')}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === 'notified' ? '#FFFFFF' : 'transparent',
                      color: statusFilter === 'notified' ? '#059669' : '#64748B',
                      fontWeight: statusFilter === 'notified' ? 600 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow:
                        statusFilter === 'notified' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    Notified ({notifiedCount})
                  </button>
                </div>

                {/* Search Bar */}
                <Box style={{ width: '250px' }}>
                  <Input
                    size="small"
                    prefix={<SearchSmall />}
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search subscribers..."
                    clearButton
                    onClear={() => setListSearch('')}
                  />
                </Box>
              </Box>
            </Box>

            {/* Contextual Floating Bulk Action Bar */}
            {selectedSubs.length > 0 && (
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
                  animation: 'fadeIn 0.2s ease-in-out',
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
                    {selectedSubs.length}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    subscriber{selectedSubs.length > 1 ? 's' : ''} selected
                  </span>
                </Box>
                <Box verticalAlign="middle" gap="SP2">
                  <Button
                    size="small"
                    skin="destructive"
                    prefixIcon={<DeleteSmall />}
                    onClick={onDeleteSelected}
                  >
                    Delete Selected
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubs([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear
                  </button>
                </Box>
              </div>
            )}

            {/* Table or Empty State */}
            {filteredItems.length === 0 ? (
              <EmptyState
                title={
                  listSearch
                    ? 'No matching subscribers found'
                    : 'No shoppers in this waitlist yet'
                }
                subtitle={
                  listSearch
                    ? 'Try searching with another email, product name, or SKU.'
                    : 'Customers who opt in on out-of-stock product pages or price watch widgets will appear here automatically.'
                }
                skin="section"
              >
                {!listSearch ? (
                  <Box gap="SP2" style={{ marginTop: '12px' }}>
                    <Button size="small" prefixIcon={<SettingsSmall />} onClick={onGoRules}>
                      Configure alert rules
                    </Button>
                    <Button size="small" priority="secondary" onClick={onGoCustomization}>
                      Preview storefront widget
                    </Button>
                  </Box>
                ) : null}
              </EmptyState>
            ) : (
              <Table
                data={filteredItems}
                columns={[
                  {
                    title: (
                      <Checkbox
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    ),
                    width: '44px',
                    render: (row: SubscriberItem) => (
                      <Checkbox
                        checked={selectedSubs.includes(row._id)}
                        onChange={() => toggleSelectRow(row._id)}
                      />
                    ),
                  },
                  {
                    title: 'Subscriber',
                    width: '36%',
                    render: (row: SubscriberItem) => (
                      <Box verticalAlign="middle" gap="SP2">
                        {/* Vibrant Deterministic Avatar */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: getAvatarGradient(row.email),
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          {getInitials(row.email)}
                        </div>
                        <Box direction="vertical" gap="2px">
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: '#0F172A',
                            }}
                          >
                            {row.email}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {row.createdAt
                              ? `Joined on ${new Date(row.createdAt).toLocaleDateString()}`
                              : 'Subscribed via Storefront'}
                          </span>
                        </Box>
                      </Box>
                    ),
                  },
                  {
                    title: 'Tracked Product',
                    width: '28%',
                    render: (row: SubscriberItem) => (
                      <Box verticalAlign="middle" gap="SP2">
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Package size="16" />
                        </div>
                        <Box direction="vertical" gap="2px">
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: '#1E293B',
                            }}
                          >
                            {row.productName || 'Unknown Product'}
                          </span>
                          {row.productId ? (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              ID: {row.productId}
                            </span>
                          ) : null}
                        </Box>
                      </Box>
                    ),
                  },
                  {
                    title: 'Status',
                    width: '18%',
                    render: (row: SubscriberItem) => {
                      const st = (row.state || 'waiting').toLowerCase();
                      const isNotified = st === 'notified';
                      const isPending = st === 'pending';

                      return (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: isNotified
                              ? '#ECFDF5'
                              : isPending
                                ? '#EFF6FF'
                                : '#FFFBEB',
                            color: isNotified
                              ? '#065F46'
                              : isPending
                                ? '#1D4ED8'
                                : '#B45309',
                            border: isNotified
                              ? '1px solid #A7F3D0'
                              : isPending
                                ? '1px solid #BFDBFE'
                                : '1px solid #FDE68A',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isNotified
                                ? '#10B981'
                                : isPending
                                  ? '#3B82F6'
                                  : '#F59E0B',
                              boxShadow: isNotified
                                ? '0 0 0 2px rgba(16, 185, 129, 0.25)'
                                : isPending
                                  ? '0 0 0 2px rgba(59, 130, 246, 0.25)'
                                  : '0 0 0 2px rgba(245, 158, 11, 0.25)',
                            }}
                          />
                          {isNotified
                            ? 'Alert Sent'
                            : isPending
                              ? 'Dispatched'
                              : 'Waiting for Stock'}
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Action',
                    width: '18%',
                    render: (row: SubscriberItem) => (
                      <Button
                        size="small"
                        priority="secondary"
                        prefixIcon={<SendSmall />}
                        disabled={triggeringId === row._id}
                        onClick={() => handleSingleTrigger(row.productId, row._id)}
                      >
                        {triggeringId === row._id ? 'Sending…' : 'Trigger alert'}
                      </Button>
                    ),
                  },
                ]}
              >
                <Table.Content />
              </Table>
            )}
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
