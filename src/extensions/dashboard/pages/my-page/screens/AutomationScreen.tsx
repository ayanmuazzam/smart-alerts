import React from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  EmptyState,
  SectionHelper,
  Table,
  Text,
  TextButton,
} from '@wix/design-system';
import {
  Package,
  Email,
  Chat,
  DateAndTime,
  Sparkles,
  SettingsSmall,
} from '@wix/wix-ui-icons-common';
import { ModuleRulesSidePanel } from '../components/ModuleRulesSidePanel';
import { AutomationRuleCard } from '../components/AutomationRuleCard';
import { SubscribersListTable } from '../components/SubscribersListTable';
import { InventoryTrackerWorkspace } from '../components/InventoryTrackerWorkspace';
import { WhatsAppQueueWorkspace } from '../components/WhatsAppQueueWorkspace';
import { LogsAndQuotaWorkspace } from '../components/LogsAndQuotaWorkspace';
import { MODULE_META, type AutomationSub, type ModuleMetaItem } from '../adminApi';

type Props = {
  sub: AutomationSub;
  onSubChange: (sub: AutomationSub) => void;
  config: any;
  setConfig: (updater: any) => void;
  listType: string;
  setListType: (t: string) => void;
  listSearch: string;
  setListSearch: (s: string) => void;
  listItems: any[];
  selectedSubs: string[];
  setSelectedSubs: (ids: string[] | ((prev: string[]) => string[])) => void;
  whatsapp: any[];
  tracked: any[];
  search: string;
  setSearch: (s: string) => void;
  searchResults: any[];
  draftOverrides: Record<string, { lowStockThreshold: string; restockAt: string }>;
  setDraftOverrides: React.Dispatch<
    React.SetStateAction<Record<string, { lowStockThreshold: string; restockAt: string }>>
  >;
  alerts: any[];
  quota: any;
  selectedAlerts: string[];
  setSelectedAlerts: (ids: string[] | ((prev: string[]) => string[])) => void;
  rulesModule: string | null;
  setRulesModule: (key: string | null) => void;
  onSaveModules: (key: string, value: boolean) => void;
  onSaveRules: () => void;
  onReload: () => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  onGoSettings: () => void;
  onGoCustomization: (target?: 'email' | 'storefront', triggerType?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
  onSearchProducts: () => void;
};

function getTriggerSummary(key: string, config: any): string {
  const triggers = config?.triggerRules || {};
  const appearance = config?.appearance || {};
  const limits = config?.notificationLimits || {};

  switch (key) {
    case 'backInStock': {
      const minQty = triggers.backInStockMinQty ?? 1;
      const mode = limits.batchMode === 'hourly' ? 'Hourly batch' : 'Instant';
      return `Triggers when restock ≥ ${minQty} unit(s) • ${mode} delivery`;
    }
    case 'priceDrop': {
      const pct = triggers.priceDropMinPercent ?? 0;
      const cooldown = config?.priceDropCooldownHours ?? 24;
      return `Triggers on ≥ ${pct}% price drop • ${cooldown}h cooldown`;
    }
    case 'manualWhatsapp':
      return 'Generates click-to-chat WhatsApp links in queue';
    case 'sellerOutOfStock':
      return 'Instant notification when inventory reaches 0';
    case 'sellerLowStock': {
      const threshold = triggers.globalLowStockThreshold ?? config?.globalLowStockThreshold ?? 5;
      return `Alerts store manager when stock falls to ≤ ${threshold} units`;
    }
    case 'sellerNewOrder':
      return 'Immediate notification for each completed checkout';
    case 'digest': {
      const freq = config?.digestFrequency || 'weekly';
      return `Frequency: ${freq === 'off' ? 'Paused' : freq.charAt(0).toUpperCase() + freq.slice(1)}`;
    }
    case 'stockCounter': {
      const threshold = appearance.stockThreshold ?? 10;
      return `Displays "Only X left" badge when inventory ≤ ${threshold} units`;
    }
    case 'restockCountdown':
      return 'Displays countdown timer using expected restock dates';
    default:
      return '';
  }
}

export function AutomationScreen(props: Props) {
  const {
    sub,
    onSubChange,
    config,
    listType,
    setListType,
    listSearch,
    setListSearch,
    listItems,
    selectedSubs,
    setSelectedSubs,
    whatsapp,
    tracked,
    search,
    setSearch,
    searchResults,
    draftOverrides,
    setDraftOverrides,
    alerts,
    quota,
    selectedAlerts,
    setSelectedAlerts,
    rulesModule,
    setRulesModule,
    onSaveModules,
    onSaveRules,
    onReload,
    onRun,
    onGoSettings,
    onGoCustomization,
    adminPost,
    onSearchProducts,
  } = props;

  const groupInfo: Record<string, { title: string; subtitle: string }> = {
    CUSTOMERS: {
      title: 'Shopper Alerts',
      subtitle: 'Automated notifications sent directly to subscribed store shoppers.',
    },
    SELLER: {
      title: 'Store Manager Alerts',
      subtitle: 'Internal alerts to keep your team informed on inventory depletion and new orders.',
    },
    URGENCY: {
      title: 'Storefront Urgency Badges',
      subtitle: 'On-page widgets that display low-stock badges and restock countdown timers.',
    },
  };

  const sellerOn = ['sellerOutOfStock', 'sellerLowStock', 'sellerNewOrder', 'digest'].some(
    (k) => config?.modules?.[k],
  );
  const activeMeta = MODULE_META.find((m) => m.key === rulesModule);


  // Clean sidebar navigation items without heavy counts
  const sidebarItems: {
    id: AutomationSub;
    title: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'rules',
      title: 'Alert Rules',
      icon: <SettingsSmall size="18" />,
    },
    {
      id: 'lists',
      title: 'Subscribers',
      icon: <Email size="18" />,
    },
    {
      id: 'inventory',
      title: 'Inventory Tracker',
      icon: <Package size="18" />,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Queue',
      icon: <Chat size="18" />,
    },
    {
      id: 'history',
      title: 'Logs & Quota',
      icon: <DateAndTime size="18" />,
    },
  ];

  return (
    <Box gap="SP4" style={{ alignItems: 'flex-start', width: '100%' }}>
      {/* 1. Left Sidebar Navigation */}
      <Box
        direction="vertical"
        style={{
          width: '215px',
          flexShrink: 0,
          position: 'sticky',
          top: '16px',
        }}
        gap="SP3"
      >
        {/* Navigation Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '14px 10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top: Menu Items */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 10px 10px 10px',
              }}
            >
              Automation
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sidebarItems.map((item) => {
                const isActive = sub === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSubChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      color: isActive ? '#116DFF' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? 'inset 3px 0 0 #116DFF' : 'none',
                    }}
                  >
                    <div
                      style={{
                        color: isActive ? '#116DFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom: Quick Settings Anchor */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #EDEFF2',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '3px',
              }}
            >
              Settings &amp; Triggers
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748B',
                marginBottom: '8px',
                lineHeight: '1.4',
              }}
            >
              Manage sender addresses, notification limits, and store sync.
            </div>
            <TextButton size="small" onClick={onGoSettings}>
              Open Settings →
            </TextButton>
          </div>
        </div>
      </Box>

      {/* 2. Main Workspace View */}
      <Box direction="vertical" style={{ flex: 1, minWidth: 0 }} gap="SP4">
        {/* Rules Workspace */}
        {sub === 'rules' && config ? (
          <Box direction="vertical" gap="SP4">
            {sellerOn && !config.sellerEmail ? (
              <SectionHelper appearance="warning" title="Seller email required">
                One or more Store Manager alert modules are enabled, but no recipient email is
                configured.{' '}
                <TextButton onClick={onGoSettings}>Configure seller email in Settings</TextButton>
              </SectionHelper>
            ) : null}

            {(['CUSTOMERS', 'SELLER', 'URGENCY'] as const).map((group) => {
              const rules = MODULE_META.filter((m) => m.group === group);
              const activeInGroup = rules.filter((m) => Boolean(config.modules?.[m.key])).length;
              const meta = groupInfo[group];

              return (
                <Card key={group}>
                  <Card.Header
                    title={meta.title}
                    subtitle={meta.subtitle}
                    suffix={
                      <Badge
                        size="small"
                        skin={activeInGroup > 0 ? 'success' : 'neutral'}
                      >
                        {activeInGroup} of {rules.length} active
                      </Badge>
                    }
                  />
                  <Card.Divider />
                  <Card.Content>
                    <Box direction="vertical" gap="SP3">
                      {rules.map((m: ModuleMetaItem) => {
                        const isEnabled = Boolean(config.modules?.[m.key]);
                        const summary = getTriggerSummary(m.key, config);

                        let templateLabel: string | undefined;
                        if (m.customizationTarget === 'storefront') {
                          templateLabel = 'Customize widget';
                        } else if (m.customizationTarget === 'whatsapp') {
                          templateLabel = 'View queue';
                        } else if (m.customizationTarget === 'email') {
                          templateLabel = 'Edit email template';
                        }

                        return (
                          <AutomationRuleCard
                            key={m.key}
                            id={m.key}
                            title={m.title}
                            description={m.description}
                            group={m.group}
                            channel={m.channel}
                            delivery={m.delivery}
                            iconName={m.iconName}
                            enabled={isEnabled}
                            triggerSummary={summary}
                            templateLabel={templateLabel}
                            onToggle={() => onSaveModules(m.key, !isEnabled)}
                            onConfigure={() => setRulesModule(m.key)}
                            onCustomizeTemplate={() => {
                              if (m.customizationTarget === 'whatsapp') {
                                onSubChange('whatsapp');
                              } else if (m.customizationTarget === 'storefront') {
                                onGoCustomization('storefront');
                              } else if (m.customizationTarget === 'email') {
                                onGoCustomization('email', m.templateKey);
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Card.Content>
                </Card>
              );
            })}

            {/* Module Rules Side Drawer */}
            {rulesModule ? (
              <ModuleRulesSidePanel
                moduleKey={rulesModule}
                title={activeMeta?.title || 'Configure Alert Rules'}
                config={config}
                onClose={() => setRulesModule(null)}
                onChange={(patch) => props.setConfig((c: any) => ({ ...c, ...patch }))}
                onSave={onSaveRules}
                onGoCustomization={(target) =>
                  onGoCustomization(target, activeMeta?.templateKey)
                }
              />
            ) : null}
          </Box>
        ) : null}

        {/* Subscribers / Lists Workspace */}
        {sub === 'lists' ? (
          <SubscribersListTable
            listType={listType}
            setListType={setListType}
            listSearch={listSearch}
            setListSearch={setListSearch}
            listItems={listItems}
            selectedSubs={selectedSubs}
            setSelectedSubs={setSelectedSubs}
            onExportCsv={async () => {
              await onRun(async () => {
                const data = await adminPost({
                  action: 'exportSubscribersCsv',
                  type: listType,
                });
                const blob = new Blob([data.csv || ''], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `subscribers-${listType}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }, 'CSV exported');
            }}
            onDeleteSelected={async () => {
              await onRun(async () => {
                await adminPost({ action: 'deleteSubscriptions', ids: selectedSubs });
                setSelectedSubs([]);
                onReload();
              }, 'Deleted selected');
            }}
            onManualTrigger={async (productId) => {
              await onRun(async () => {
                await adminPost({
                  action: 'manualTriggerAlert',
                  productId,
                  subscriptionType: listType,
                });
                onReload();
              }, 'Alert triggered');
            }}
            onGoRules={() => onSubChange('rules')}
            onGoCustomization={() => onGoCustomization('storefront')}
          />
        ) : null}

        {/* Inventory Tracking Workspace */}
        {sub === 'inventory' ? (
          <InventoryTrackerWorkspace
            search={search}
            setSearch={setSearch}
            onSearchProducts={onSearchProducts}
            onLoadOos={async () => {
              await onRun(async () => {
                await adminPost({ action: 'loadOos' });
                onReload();
              }, 'Out-of-stock products loaded');
            }}
            searchResults={searchResults}
            onTrackProduct={async (row) => {
              await onRun(async () => {
                await adminPost({
                  action: 'saveOverride',
                  productId: row.id,
                  productName: row.name,
                  lastStockStatus: row.stockStatus,
                });
                onReload();
              }, 'Tracking product');
            }}
            tracked={tracked}
            draftOverrides={draftOverrides}
            setDraftOverrides={setDraftOverrides}
            onSaveProductOverride={async (row) => {
              const key = row._id || row.productId;
              const draft = draftOverrides[key];
              await onRun(async () => {
                await adminPost({
                  action: 'saveOverride',
                  productId: row.productId,
                  productName: row.productName,
                  lastStockStatus: row.lastStockStatus,
                  lowStockThreshold: Number(
                    draft?.lowStockThreshold ?? row.lowStockThreshold ?? 5,
                  ),
                  useGlobalThreshold: false,
                  restockAt:
                    draft?.restockAt && draft.restockAt.trim() !== ''
                      ? new Date(draft.restockAt).toISOString()
                      : null,
                });
                onReload();
              }, 'Product saved');
          }}
        />
      ) : null}

        {/* WhatsApp Queue Workspace */}
        {sub === 'whatsapp' ? (
          <WhatsAppQueueWorkspace
            whatsapp={whatsapp}
            config={config}
            onMarkSent={async (id) => {
              await onRun(async () => {
                await adminPost({ action: 'markWhatsappSent', id });
                onReload();
              }, 'Marked sent');
            }}
            onDismiss={async (id) => {
              await onRun(async () => {
                await adminPost({ action: 'removeWhatsapp', id });
                onReload();
              }, 'Removed');
            }}
            onGoSettings={onGoSettings}
          />
        ) : null}

        {/* Logs & Quota Workspace */}
        {sub === 'history' ? (
          <LogsAndQuotaWorkspace
            quota={quota}
            alerts={alerts}
            selectedAlerts={selectedAlerts}
            setSelectedAlerts={setSelectedAlerts}
            onDeleteSelectedAlerts={async () => {
              await onRun(async () => {
                await adminPost({ action: 'deleteAlerts', ids: selectedAlerts });
                setSelectedAlerts([]);
                onReload();
              }, 'Deleted selected alerts');
            }}
            onClearAllAlerts={async () => {
              await onRun(async () => {
                await adminPost({ action: 'deleteAlerts', all: true });
                onReload();
              }, 'All alerts deleted');
            }}
            onGoSettings={onGoSettings}
          />
        ) : null}
      </Box>
    </Box>
  );
}
