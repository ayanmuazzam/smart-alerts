import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Input,
  NumberInput,
  Table,
  Text,
  TextButton,
} from '@wix/design-system';
import {
  Package,
  Refresh,
  SearchSmall,
  DateAndTime,
  Check,
  StatusAlert,
  Timer,
  Sparkles,
  DismissSmall,
} from '@wix/wix-ui-icons-common';
import { MonoIconBadge } from './MonoIconBadge';
import { storedToDatetimeLocal } from '../../../../../lib/smart-alerts/datetime-local';

export interface TrackedProductRow {
  _id?: string;
  productId: string;
  productName?: string;
  lastStockStatus?: string;
  lowStockThreshold?: number;
  restockAt?: string | null;
  trackedSource?: string;
}

export interface SearchProductRow {
  id: string;
  name: string;
  stockStatus: string;
}

export interface InventoryTrackerWorkspaceProps {
  search: string;
  setSearch: (s: string) => void;
  searching?: boolean;
  onSearchProducts: () => void;
  onLoadOos: () => Promise<void>;
  searchResults: SearchProductRow[];
  onTrackProduct: (row: SearchProductRow) => Promise<void>;
  tracked: TrackedProductRow[];
  draftOverrides: Record<string, { lowStockThreshold: string; restockAt: string }>;
  setDraftOverrides: React.Dispatch<
    React.SetStateAction<Record<string, { lowStockThreshold: string; restockAt: string }>>
  >;
  siteTimeZone?: string;
  onSaveProductOverride: (row: TrackedProductRow) => Promise<void>;
}

export function InventoryTrackerWorkspace({
  search,
  setSearch,
  searching = false,
  onSearchProducts,
  onLoadOos,
  searchResults,
  onTrackProduct,
  tracked,
  draftOverrides,
  setDraftOverrides,
  siteTimeZone = 'UTC',
  onSaveProductOverride,
}: InventoryTrackerWorkspaceProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [justSavedKey, setJustSavedKey] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isLoadingOos, setIsLoadingOos] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'manual' | 'oos' | 'scheduled'>('manual');
  const [dismissSearchResults, setDismissSearchResults] = useState(false);

  const handleLoadOos = async () => {
    setIsLoadingOos(true);
    try {
      await onLoadOos();
    } finally {
      setIsLoadingOos(false);
    }
  };

  const handleTrack = async (row: SearchProductRow) => {
    setTrackingId(row.id);
    try {
      await onTrackProduct(row);
      setActiveFilter('manual');
      setDismissSearchResults(true);
    } finally {
      setTrackingId(null);
    }
  };

  const handleSaveRow = async (row: TrackedProductRow) => {
    const key = row._id || row.productId;
    setSavingKey(key);
    try {
      await onSaveProductOverride(row);
      setJustSavedKey(key);
      setTimeout(() => {
        setJustSavedKey((cur) => (cur === key ? null : cur));
      }, 2500);
    } finally {
      setSavingKey(null);
    }
  };

  const isOos = (status?: string) => {
    const s = (status || '').toLowerCase();
    return s.includes('out') || s === '0' || s.includes('empty');
  };

  const isManualTracked = (row: TrackedProductRow) => row.trackedSource === 'manual';
  const manualTracked = tracked.filter(isManualTracked);
  const trackedCount = manualTracked.length;
  const outOfStockCount = tracked.filter((t) => isOos(t.lastStockStatus)).length;
  const scheduledCount = tracked.filter((t) => Boolean(t.restockAt)).length;

  const filteredTracked = tracked.filter((item) => {
    if (activeFilter === 'manual') return isManualTracked(item);
    if (activeFilter === 'oos') return isOos(item.lastStockStatus);
    if (activeFilter === 'scheduled') return Boolean(item.restockAt);
    return true;
  });

  const showSearchResults = searchResults.length > 0 && !dismissSearchResults;

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Depleted Inventory Attention Banner */}
      {outOfStockCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFF5F5 100%)',
            border: '1px solid #FECDD3',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box verticalAlign="middle" gap="SP3">
            <MonoIconBadge tone="rose" size={40} radius={10}>
              <StatusAlert size="20" />
            </MonoIconBadge>
            <Box direction="vertical" gap="2px">
              <Text weight="bold" size="medium">
                Depleted Inventory Requires Attention
              </Text>
              <Text size="small" secondary>
                {outOfStockCount} product{outOfStockCount > 1 ? 's are' : ' is'} currently out of stock.
                Setting expected restock dates activates urgency countdown timers on your storefront.
              </Text>
            </Box>
          </Box>
          <button
            type="button"
            onClick={handleLoadOos}
            disabled={isLoadingOos}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoadingOos ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.35)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Refresh size="15" />
            <span>{isLoadingOos ? 'Scanning catalog…' : 'Scan Out-of-Stock Catalog'}</span>
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards (Elevated Aesthetics) */}
      <Box gap="SP3" style={{ flexWrap: 'wrap' }}>
        {/* Metric 1: Tracked Items */}
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
          <MonoIconBadge tone="rose" size={44} radius={10}>
              <StatusAlert size="20" />
            </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {outOfStockCount}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Out of Stock
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
          <MonoIconBadge tone="blue" size={44} radius={10}>
              <Package size="20" />
            </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {outOfStockCount > 0 ? 'Attention' : 'Clear'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Inventory Health
            </span>
          </div>
        </div>

        {/* Metric 3: Restock Countdowns */}
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
          <MonoIconBadge tone="violet" size={44} radius={10}>
              <Timer size="20" />
            </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {scheduledCount}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Restock Timers Set
            </span>
          </div>
        </div>
      </Box>

      {/* 3. Main Data Card */}
      <Card>
        <Card.Header
          title="Inventory Tracker"
          subtitle="Search the catalog and track products to set low-stock thresholds and restock countdowns"
          suffix={
            <Button
              size="small"
              priority="secondary"
              prefixIcon={<Refresh />}
              onClick={handleLoadOos}
              disabled={isLoadingOos}
            >
              {isLoadingOos ? 'Scanning…' : 'Scan Out-of-Stock'}
            </Button>
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
                {(
                  [
                    {
                      key: 'manual' as const,
                      label: `Tracked Products (${trackedCount})`,
                      Icon: Package,
                    },
                    {
                      key: 'oos' as const,
                      label: `Out of Stock (${outOfStockCount})`,
                      Icon: StatusAlert,
                    },
                    {
                      key: 'scheduled' as const,
                      label: `Restock Timers (${scheduledCount})`,
                      Icon: Timer,
                    },
                  ] as const
                ).map(({ key, label, Icon }) => {
                  const active = activeFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFilter(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: active ? '#116DFF' : 'transparent',
                        color: active ? '#FFFFFF' : '#475569',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: active ? '0 2px 8px rgba(17, 109, 255, 0.35)' : 'none',
                      }}
                    >
                      <Icon size="15" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Catalog Search Bar */}
              <Box verticalAlign="middle" gap="SP2">
                <Box style={{ width: '240px' }}>
                  <Input
                    size="small"
                    prefix={<SearchSmall />}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (dismissSearchResults) setDismissSearchResults(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setDismissSearchResults(false);
                        onSearchProducts();
                      }
                    }}
                    placeholder="Search product or SKU..."
                    clearButton
                    onClear={() => setSearch('')}
                  />
                </Box>
                <Button
                  size="small"
                  disabled={searching}
                  onClick={() => {
                    setDismissSearchResults(false);
                    onSearchProducts();
                  }}
                >
                  {searching ? 'Searching…' : 'Search'}
                </Button>
              </Box>
            </Box>

            {searching ? (
              <Box align="center" padding="24px">
                <Text size="small" secondary>
                  Searching catalog…
                </Text>
              </Box>
            ) : null}

            {/* Catalog Search Results Section */}
            {!searching && showSearchResults && (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                }}
              >
                <Box align="space-between" verticalAlign="middle" style={{ marginBottom: '12px' }}>
                  <Box verticalAlign="middle" gap="SP2">
                    <Sparkles size="16" style={{ color: '#116DFF' }} />
                    <Text weight="bold" size="small">
                      Store Catalog Matches ({searchResults.length})
                    </Text>
                  </Box>
                  <Box verticalAlign="middle" gap="SP2">
                    <Text size="tiny" secondary>
                      Click &ldquo;Track Product&rdquo; to configure thresholds &amp; timers
                    </Text>
                    <button
                      type="button"
                      onClick={() => setDismissSearchResults(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                      }}
                      title="Dismiss results"
                    >
                      <DismissSmall />
                    </button>
                  </Box>
                </Box>
                <Table
                  data={searchResults}
                  columns={[
                    {
                      title: 'Product',
                      render: (row: SearchProductRow) => (
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
                            <Package size="16" />
                          </div>
                          <Box direction="vertical" gap="2px">
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A' }}>
                              {row.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              ID: {row.id}
                            </span>
                          </Box>
                        </Box>
                      ),
                    },
                    {
                      title: 'Catalog Stock Status',
                      render: (row: SearchProductRow) => {
                        const out = isOos(row.stockStatus);
                        return (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              backgroundColor: out ? '#FEE2E2' : '#ECFDF5',
                              color: out ? '#991B1B' : '#065F46',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: out ? '#EF4444' : '#10B981',
                              }}
                            />
                            {out ? 'Out of Stock' : row.stockStatus || 'In Stock'}
                          </div>
                        );
                      },
                    },
                    {
                      title: '',
                      width: '150px',
                      render: (row: SearchProductRow) => {
                        const isAlreadyTracked = tracked.some(
                          (t) => t.productId === row.id || t._id === row.id,
                        );
                        if (isAlreadyTracked) {
                          return (
                            <Badge size="small" skin="success">
                              Already Tracked
                            </Badge>
                          );
                        }
                        return (
                          <Button
                            size="tiny"
                            priority="secondary"
                            prefixIcon={<Check />}
                            disabled={trackingId === row.id}
                            onClick={() => handleTrack(row)}
                          >
                            {trackingId === row.id ? 'Adding…' : 'Track Product'}
                          </Button>
                        );
                      },
                    },
                  ]}
                >
                  <Table.Content />
                </Table>
              </div>
            )}

            {/* Tracked Products Table with overflow container */}
            {filteredTracked.length === 0 ? (
              <EmptyState
                title={
                  activeFilter === 'scheduled'
                    ? 'No restock countdowns scheduled'
                    : activeFilter === 'oos'
                      ? 'No out-of-stock products'
                      : 'No products tracked yet'
                }
                subtitle={
                  activeFilter === 'scheduled'
                    ? 'Set an expected restock date on a tracked product to show a countdown on the storefront.'
                    : activeFilter === 'oos'
                      ? 'Click “Scan Out-of-Stock” to import current OOS products, or search and track a specific product.'
                      : 'Search your store catalog and click Track Product to add items here for thresholds and restock timers.'
                }
                skin="section"
              >
                {activeFilter === 'scheduled' ? null : (
                  <Box gap="SP2" style={{ marginTop: '14px' }}>
                    {activeFilter === 'oos' ? (
                      <Button
                        size="small"
                        prefixIcon={<Refresh />}
                        onClick={handleLoadOos}
                        disabled={isLoadingOos}
                      >
                        {isLoadingOos ? 'Scanning…' : 'Scan Out-of-Stock'}
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      priority={activeFilter === 'manual' ? 'primary' : 'secondary'}
                      prefixIcon={<SearchSmall />}
                      onClick={onSearchProducts}
                    >
                      Search Store Catalog
                    </Button>
                  </Box>
                )}
              </EmptyState>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: '760px' }}>
                  <Table
                    data={filteredTracked}
                    columns={[
                      {
                        title: 'Product',
                        width: '26%',
                        render: (row: TrackedProductRow) => (
                          <Box verticalAlign="middle" gap="SP2">
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                color: '#116DFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(17, 109, 255, 0.12)',
                              }}
                            >
                              <Package size="18" />
                            </div>
                            <Box direction="vertical" gap="2px" style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '13.5px',
                                  color: '#0F172A',
                                }}
                              >
                                {row.productName || 'Unknown Product'}
                              </span>
                              <span
                                title={row.productId}
                                style={{
                                  fontSize: '11px',
                                  color: '#94A3B8',
                                  maxWidth: '175px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                }}
                              >
                                ID: {row.productId}
                              </span>
                            </Box>
                          </Box>
                        ),
                      },
                      {
                        title: 'Stock Status',
                        width: '14%',
                        render: (row: TrackedProductRow) => {
                          const out = isOos(row.lastStockStatus);
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
                                backgroundColor: out ? '#FEE2E2' : '#ECFDF5',
                                color: out ? '#991B1B' : '#065F46',
                                border: out ? '1px solid #FECDD3' : '1px solid #A7F3D0',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: out ? '#EF4444' : '#10B981',
                                  boxShadow: out
                                    ? '0 0 0 2px rgba(239, 68, 68, 0.25)'
                                    : '0 0 0 2px rgba(16, 185, 129, 0.25)',
                                }}
                              />
                              {out ? 'Out of Stock' : row.lastStockStatus || 'In Stock'}
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Alert Limit',
                        width: '16%',
                        render: (row: TrackedProductRow) => {
                          const key = row._id || row.productId;
                          const draft = draftOverrides[key] || {
                            lowStockThreshold: String(row.lowStockThreshold ?? 5),
                            restockAt: storedToDatetimeLocal(row.restockAt, siteTimeZone),
                          };
                          return (
                            <Box direction="vertical" gap="2px">
                              <Box style={{ width: '110px' }}>
                                <NumberInput
                                  size="small"
                                  min={1}
                                  max={500}
                                  value={Number(draft.lowStockThreshold) || 5}
                                  suffix={<Input.Affix>units</Input.Affix>}
                                  onChange={(value) =>
                                    setDraftOverrides((d) => ({
                                      ...d,
                                      [key]: {
                                        ...draft,
                                        lowStockThreshold: String(value ?? 5),
                                      },
                                    }))
                                  }
                                />
                              </Box>
                              <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                                Alerts at &le; {draft.lowStockThreshold} units
                              </span>
                            </Box>
                          );
                        },
                      },
                      {
                        title: 'Restock Countdown',
                        width: '30%',
                        render: (row: TrackedProductRow) => {
                          const key = row._id || row.productId;
                          const draft = draftOverrides[key] || {
                            lowStockThreshold: String(row.lowStockThreshold ?? 5),
                            restockAt: storedToDatetimeLocal(row.restockAt, siteTimeZone),
                          };
                          const hasDate = Boolean(draft.restockAt);
                          return (
                            <Box direction="vertical" gap="2px">
                              <Box style={{ width: '150px' }}>
                                <Input
                                  size="small"
                                  type="datetime-local"
                                  value={draft.restockAt}
                                  onChange={(e) =>
                                    setDraftOverrides((d) => ({
                                      ...d,
                                      [key]: { ...draft, restockAt: e.target.value },
                                    }))
                                  }
                                />
                              </Box>
                              <div
                                style={{
                                  fontSize: '10.5px',
                                  color: '#64748B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  marginTop: '2px',
                                }}
                              >
                                {hasDate ? (
                                  <>
                                    <span style={{ color: '#2563EB', fontWeight: 500 }}>
                                      {siteTimeZone}
                                    </span>
                                    <span>•</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftOverrides((d) => ({
                                          ...d,
                                          [key]: { ...draft, restockAt: '' },
                                        }))
                                      }
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: '#E11D48',
                                        cursor: 'pointer',
                                        fontSize: '10.5px',
                                        fontWeight: 600,
                                        textDecoration: 'underline',
                                      }}
                                    >
                                      Clear
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ color: '#94A3B8' }}>No timer scheduled</span>
                                )}
                              </div>
                            </Box>
                          );
                        },
                      },
                      {
                        title: 'Action',
                        width: '14%',
                        render: (row: TrackedProductRow) => {
                          const key = row._id || row.productId;
                          const isSaving = savingKey === key;
                          const isJustSaved = justSavedKey === key;

                          const draft = draftOverrides[key];
                          const initialThreshold = String(row.lowStockThreshold ?? 5);
                          const initialRestockAt = storedToDatetimeLocal(row.restockAt, siteTimeZone);
                          const isDirty =
                            draft &&
                            (draft.lowStockThreshold !== initialThreshold ||
                              draft.restockAt !== initialRestockAt);

                          if (isJustSaved) {
                            return (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#059669',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '5px 8px',
                                }}
                              >
                                <Check size="14" />
                                <span>Saved</span>
                              </div>
                            );
                          }

                          return (
                            <Button
                              size="small"
                              priority={isDirty ? 'primary' : 'secondary'}
                              disabled={isSaving}
                              onClick={() => handleSaveRow(row)}
                            >
                              {isSaving ? 'Saving…' : 'Save'}
                            </Button>
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
