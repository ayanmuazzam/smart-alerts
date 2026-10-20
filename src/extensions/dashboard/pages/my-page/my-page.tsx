import React, { useCallback, useEffect, useRef, useState } from 'react';
import { embeddedScripts } from '@wix/app-management';
import {
  Box,
  Button,
  EmptyState,
  Loader,
  Page,
  StatusToast,
  Tabs,
  ToastContainer,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import {
  adminGet,
  adminPost,
  type AutomationSub,
  type CustomizationSub,
  type PrimaryTab,
} from './adminApi';
import { getDefaultEmailTemplate } from '../../../../lib/smart-alerts/constants';
import { storedToDatetimeLocal } from '../../../../lib/smart-alerts/datetime-local';
import { DashboardScreen } from './screens/DashboardScreen';
import { AutomationScreen } from './screens/AutomationScreen';
import { EmailCustomizationScreen, type TemplateForm } from './screens/EmailCustomizationScreen';
import { StorefrontCustomizationScreen } from './screens/StorefrontCustomizationScreen';
import { LogsAndQuotaScreen } from './screens/LogsAndQuotaScreen';
import { SupportWidget } from './components/SupportWidget';
import { GuideWidget } from './components/GuideWidget';
import type { AlertChannelFilter } from './components/LogsAndQuotaWorkspace';

/** Former floating "My alerts" corner button — disable on sites that still have it embedded. */
const CORNER_EMBEDDED_SCRIPT_ID = 'f1428cdb-83d7-4ac1-b13d-91ee44f6d480';

const PRIMARY_TABS: { id: PrimaryTab; title: string }[] = [
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'automation', title: 'Automation' },
  { id: 'email', title: 'Email & Branding' },
  { id: 'storefront', title: 'Storefront Widget' },
  { id: 'logs', title: 'Logs & Quota' },
];

type ToastItem = {
  id: string;
  msg: string;
  status: 'success' | 'error' | 'warning' | 'info';
};

function makeToastId() {
  return Math.random().toString(36).slice(2, 9);
}

function formFromDefaults(triggerType: string): TemplateForm {
  const d = getDefaultEmailTemplate(triggerType);
  return {
    triggerType,
    layout: d.layout as string,
    subject: d.subject,
    preheader: d.preheader,
    headerStyle: (d.headerStyle as 'dark' | 'brand' | 'white') || 'dark',
    headerText: d.headerText || '{store_name}',
    showBadge: d.showBadge ?? true,
    badgeText: d.badgeText || 'Back in Stock 🎉',
    headline: d.headline,
    body: d.body,
    showProductImage: d.showProductImage,
    reviewQuote: d.reviewQuote || '',
    buttonLabel: d.buttonLabel,
    showFeatures: d.showFeatures ?? false,
    featuresTitle: d.featuresTitle || "Why you'll love it:",
    featuresText: d.featuresText || '',
    closingText: d.closingText || '',
    signoffText: d.signoffText || 'The {store_name} Team',
    footerDisclaimer: d.footerDisclaimer || 'You received this email because you signed up for alerts.',
  };
}

/** Prefer saved template fields; fall back to polished defaults when empty. */
function formFromSavedOrDefaults(triggerType: string, existing?: any): TemplateForm {
  const d = getDefaultEmailTemplate(triggerType);
  const pick = (value: unknown, fallback: any) => {
    if (typeof fallback === 'boolean') {
      return value === undefined ? fallback : Boolean(value);
    }
    const s = value == null ? '' : String(value).trim();
    return s || fallback;
  };
  return {
    triggerType,
    layout: pick(existing?.layout, d.layout),
    subject: pick(existing?.subject, d.subject),
    preheader: pick(existing?.preheader, d.preheader),
    headerStyle: pick(existing?.headerStyle, d.headerStyle || 'dark') as 'dark' | 'brand' | 'white',
    headerText: pick(existing?.headerText, d.headerText || '{store_name}'),
    showBadge: pick(existing?.showBadge, d.showBadge ?? true),
    badgeText: pick(existing?.badgeText, d.badgeText || 'Back in Stock 🎉'),
    headline: pick(existing?.headline, d.headline),
    body: pick(existing?.body, d.body),
    showProductImage: pick(existing?.showProductImage, d.showProductImage ?? true),
    reviewQuote: pick(existing?.reviewQuote, d.reviewQuote || ''),
    buttonLabel: pick(existing?.buttonLabel, d.buttonLabel),
    showFeatures: pick(existing?.showFeatures, d.showFeatures ?? false),
    featuresTitle: pick(existing?.featuresTitle, d.featuresTitle || "Why you'll love it:"),
    featuresText: pick(existing?.featuresText, d.featuresText || ''),
    closingText: pick(existing?.closingText, d.closingText || ''),
    signoffText: pick(existing?.signoffText, d.signoffText || 'The {store_name} Team'),
    footerDisclaimer: pick(existing?.footerDisclaimer, d.footerDisclaimer || 'You received this email because you signed up for alerts.'),
  };
}

export default function SmartAlertsPage() {
  const [primary, setPrimary] = useState<PrimaryTab>('dashboard');
  const [automationSub, setAutomationSub] = useState<AutomationSub>('rules');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [listType, setListType] = useState('back_in_stock');
  const [listSearch, setListSearch] = useState('');
  const [listItems, setListItems] = useState<any[]>([]);
  const [listTotalCount, setListTotalCount] = useState(0);
  const [listSkip, setListSkip] = useState(0);
  const [listStateFilter, setListStateFilter] = useState('');
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const listsCacheRef = useRef<
    Record<
      string,
      {
        items: any[];
        totalCount: number;
        skip: number;
        stateFilter: string;
        search: string;
      }
    >
  >({});
  const listViewRef = useRef({
    listType: 'back_in_stock',
    listItems: [] as any[],
    listTotalCount: 0,
    listSkip: 0,
    listStateFilter: '',
    listSearch: '',
  });
  listViewRef.current = {
    listType,
    listItems,
    listTotalCount,
    listSkip,
    listStateFilter,
    listSearch,
  };
  const [whatsapp, setWhatsapp] = useState<any[]>([]);
  const [whatsappSearch, setWhatsappSearch] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(() => formFromDefaults('back_in_stock'));
  const templateTriggerRef = useRef(templateForm.triggerType);
  templateTriggerRef.current = templateForm.triggerType;
  const [tracked, setTracked] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inventorySearching, setInventorySearching] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsTotalCount, setAlertsTotalCount] = useState(0);
  const [alertsSkip, setAlertsSkip] = useState(0);
  const [alertSearch, setAlertSearch] = useState('');
  const [alertChannelFilter, setAlertChannelFilter] = useState<AlertChannelFilter>('all');
  const [quota, setQuota] = useState<any>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [draftOverrides, setDraftOverrides] = useState<
    Record<
      string,
      {
        lowStockThreshold: string;
        restockAt: string;
        restockAction: 'none' | 'in_stock' | 'in_stock_qty';
        restockQuantity: string;
      }
    >
  >({});
  const [siteTimeZone, setSiteTimeZone] = useState('UTC');
  const [rulesModule, setRulesModule] = useState<string | null>(null);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whatsappSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipListSearchEffectRef = useRef(false);
  const inventorySearchRef = useRef(search);
  inventorySearchRef.current = search;
  const alertSearchRef = useRef(alertSearch);
  alertSearchRef.current = alertSearch;
  const alertChannelFilterRef = useRef(alertChannelFilter);
  alertChannelFilterRef.current = alertChannelFilter;
  const whatsappSearchRef = useRef(whatsappSearch);
  whatsappSearchRef.current = whatsappSearch;

  const removeToast = (id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  };

  const notify = (
    msg: string,
    type: 'success' | 'error' | 'warning' | 'premium' | 'standard' = 'success',
  ) => {
    const status: ToastItem['status'] =
      type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success';
    const id = makeToastId();
    setToasts((list) => [...list, { id, msg, status }]);
  };

  const runSafe = async (fn: () => Promise<void>, successMsg?: string) => {
    try {
      await fn();
      if (successMsg) notify(successMsg, 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Something went wrong', 'error');
    }
  };

  const loadDashboard = useCallback(async () => {
    const data = await adminGet('dashboard');
    if (!data.kpis) throw new Error(data.error || 'Dashboard metrics unavailable');
    setKpis(data.kpis);
    setActivity(data.activity || []);
    if (data.config) setConfig(data.config);
  }, []);

  const loadConfig = useCallback(async () => {
    const data = await adminGet('config');
    if (!data.config) throw new Error(data.error || 'Config unavailable');
    setConfig(data.config);
  }, []);

  const listSearchRef = useRef(listSearch);
  listSearchRef.current = listSearch;

  const loadLists = useCallback(async (qOverride?: string, skipOverride?: number, stateOverride?: string, typeOverride?: string) => {
    const type = typeOverride || listType;
    const q = qOverride !== undefined ? qOverride : listSearchRef.current;
    const skip = skipOverride !== undefined ? skipOverride : listSkip;
    const state = stateOverride !== undefined ? stateOverride : listStateFilter;
    const extra =
      `&type=${type}&limit=50&skip=${skip}` +
      (q ? `&q=${encodeURIComponent(q)}` : '') +
      (state ? `&state=${encodeURIComponent(state)}` : '');
    const data = await adminGet('lists', extra);
    const items = data.items || [];
    const totalCount = data.totalCount ?? items.length;
    const nextSkip = data.skip ?? skip;
    setListItems(items);
    setListTotalCount(totalCount);
    setListSkip(nextSkip);
    listsCacheRef.current[type] = {
      items,
      totalCount,
      skip: nextSkip,
      stateFilter: state,
      search: q,
    };
  }, [listType, listSkip, listStateFilter]);

  const handleSetListType = (next: string) => {
    const current = listViewRef.current;
    if (next === current.listType) return;

    listsCacheRef.current[current.listType] = {
      items: current.listItems,
      totalCount: current.listTotalCount,
      skip: current.listSkip,
      stateFilter: current.listStateFilter,
      search: current.listSearch,
    };

    setSelectedSubs([]);
    setListType(next);

    const cached = listsCacheRef.current[next];
    if (cached) {
      skipListSearchEffectRef.current = true;
      setListItems(cached.items);
      setListTotalCount(cached.totalCount);
      setListSkip(cached.skip);
      setListStateFilter(cached.stateFilter);
      setListSearch(cached.search);
      return;
    }

    skipListSearchEffectRef.current = true;
    setListItems([]);
    setListTotalCount(0);
    setListSkip(0);
    setListStateFilter('');
    setListSearch('');
    loadLists('', 0, '', next).catch(() => undefined);
  };

  const patchCurrentListCache = (items: any[], totalCount: number) => {
    const type = listViewRef.current.listType;
    const prev = listsCacheRef.current[type];
    listsCacheRef.current[type] = {
      items,
      totalCount,
      skip: prev?.skip ?? 0,
      stateFilter: listViewRef.current.listStateFilter,
      search: listViewRef.current.listSearch,
    };
  };

  const loadWhatsapp = useCallback(async (qOverride?: string) => {
    const q = qOverride !== undefined ? qOverride : whatsappSearchRef.current;
    const extra =
      `&limit=50&skip=0` + (q ? `&q=${encodeURIComponent(q)}` : '');
    const data = await adminGet('whatsapp', extra);
    setWhatsapp(data.items || []);
    if (data.whatsappSetup) {
      setConfig((c: any) => ({ ...(c || {}), whatsappSetup: data.whatsappSetup }));
    }
  }, []);

  const applyTemplateForTrigger = useCallback((triggerType: string, items: any[]) => {
    const existing = (items || []).find((t: any) => t.triggerType === triggerType);
    setTemplateForm(formFromSavedOrDefaults(triggerType, existing));
  }, []);

  const loadTemplates = useCallback(async () => {
    const data = await adminGet('templates');
    const items = data.items || [];
    setTemplates(items);
    setConfig((c: any) => ({
      ...(c || {}),
      brand: data.brand,
      appearance: data.appearance || c?.appearance,
    }));
    applyTemplateForTrigger(templateTriggerRef.current, items);
  }, [applyTemplateForTrigger]);

  const onTemplateTriggerChange = (triggerType: string) => {
    // Switch form from cache — never re-enter the page loader.
    applyTemplateForTrigger(triggerType, templates);
  };

  // Stable callback — must NOT depend on `search`, or typing recreates loadCurrent and flashes the whole Automation pane.
  const loadProducts = useCallback(async (q?: string) => {
    const term = q !== undefined ? q : inventorySearchRef.current;
    const data = await adminGet(
      'products',
      `&stock=all&limit=50&skip=0${term ? `&q=${encodeURIComponent(term)}` : ''}`,
    );
    setTracked(data.tracked || []);
    setSearchResults(data.search || []);
    const tz = String(data.siteTimeZone || 'UTC');
    setSiteTimeZone(tz);
    const drafts: Record<
      string,
      {
        lowStockThreshold: string;
        restockAt: string;
        restockAction: 'none' | 'in_stock' | 'in_stock_qty';
        restockQuantity: string;
      }
    > = {};
    for (const row of data.tracked || []) {
      const actionRaw = String(row.restockAction || 'none').toLowerCase();
      const restockAction =
        actionRaw === 'in_stock' || actionRaw === 'in_stock_qty' ? actionRaw : 'none';
      const draftKey = row._id || `${row.productId}::${row.variantId || ''}`;
      drafts[draftKey] = {
        lowStockThreshold: String(row.lowStockThreshold ?? 5),
        restockAt: storedToDatetimeLocal(row.restockAt, tz),
        restockAction,
        restockQuantity: String(row.restockQuantity ?? 10),
      };
    }
    setDraftOverrides(drafts);
  }, []);

  const loadAlerts = useCallback(async (skipOverride?: number) => {
    const skip = skipOverride !== undefined ? skipOverride : alertsSkip;
    const q = alertSearchRef.current.trim();
    const channelFilter = alertChannelFilterRef.current;
    let extra = `&limit=50&skip=${skip}`;
    if (q) extra += `&q=${encodeURIComponent(q)}`;
    if (channelFilter === 'email' || channelFilter === 'whatsapp') {
      extra += `&channel=${encodeURIComponent(channelFilter)}`;
    } else if (channelFilter === 'failed') {
      extra += `&status=failed`;
    }
    const data = await adminGet('alerts', extra);
    setAlerts(data.items || []);
    setAlertsTotalCount(data.totalCount ?? (data.items || []).length);
    setAlertsSkip(data.skip ?? skip);
    setQuota(data.quota);
  }, [alertsSkip]);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (primary === 'dashboard') {
        await loadDashboard();
      } else if (primary === 'automation') {
        if (automationSub === 'rules' || automationSub === 'settings') await loadConfig();
        else if (automationSub === 'lists') await loadLists();
        else if (automationSub === 'inventory') await loadProducts('');
        else if (automationSub === 'whatsapp') {
          await Promise.all([loadWhatsapp(), loadConfig()]);
        }
      } else if (primary === 'email') {
        await loadTemplates();
      } else if (primary === 'storefront') {
        await loadConfig();
      } else if (primary === 'logs') {
        await loadAlerts();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [
    primary,
    automationSub,
    loadDashboard,
    loadConfig,
    loadLists,
    loadProducts,
    loadWhatsapp,
    loadAlerts,
    loadTemplates,
  ]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  // Turn off the old floating "My alerts" corner button on any site that still has it embedded.
  useEffect(() => {
    void (async () => {
      try {
        await embeddedScripts.embedScript(
          { disabled: true, parameters: {} },
          { componentId: CORNER_EMBEDDED_SCRIPT_ID },
        );
      } catch {
        /* not embedded / already gone */
      }
    })();
  }, []);

  // Debounced search without toggling the page loader (type toggle uses cache, not this effect).
  useEffect(() => {
    if (primary !== 'automation' || automationSub !== 'lists') return;
    if (skipListSearchEffectRef.current) {
      skipListSearchEffectRef.current = false;
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setListSkip(0);
      loadLists(listSearch, 0).catch(() => undefined);
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [listSearch, primary, automationSub, loadLists]);

  const loadAlertsRef = useRef(loadAlerts);
  loadAlertsRef.current = loadAlerts;
  const loadWhatsappRef = useRef(loadWhatsapp);
  loadWhatsappRef.current = loadWhatsapp;

  useEffect(() => {
    if (primary !== 'logs') return;
    if (alertSearchDebounce.current) clearTimeout(alertSearchDebounce.current);
    alertSearchDebounce.current = setTimeout(() => {
      setAlertsSkip(0);
      loadAlertsRef.current(0).catch(() => undefined);
    }, 300);
    return () => {
      if (alertSearchDebounce.current) clearTimeout(alertSearchDebounce.current);
    };
  }, [alertSearch, alertChannelFilter, primary]);

  useEffect(() => {
    if (primary !== 'automation' || automationSub !== 'whatsapp') return;
    if (whatsappSearchDebounce.current) clearTimeout(whatsappSearchDebounce.current);
    whatsappSearchDebounce.current = setTimeout(() => {
      loadWhatsappRef.current(whatsappSearch).catch(() => undefined);
    }, 300);
    return () => {
      if (whatsappSearchDebounce.current) clearTimeout(whatsappSearchDebounce.current);
    };
  }, [whatsappSearch, primary, automationSub]);

  const saveModules = async (key: string, value: boolean) => {
    const next = {
      ...config,
      modules: { ...config.modules, [key]: value },
    };
    setConfig(next);
    await runSafe(async () => {
      await adminPost({ action: 'saveConfig', patch: { modules: next.modules } });
    }, value ? `${key} enabled` : `${key} disabled`);
  };

  const saveRulesFromPanel = async () => {
    setIsSavingRules(true);
    try {
      await runSafe(async () => {
        const data = await adminPost({
          action: 'saveConfig',
          patch: {
            triggerRules: config.triggerRules,
            notificationLimits: config.notificationLimits,
            appearance: config.appearance,
            globalLowStockThreshold: config.globalLowStockThreshold,
          },
        });
        if (data.config) setConfig(data.config);
        setRulesModule(null);
      }, 'Module rules saved');
    } finally {
      setIsSavingRules(false);
    }
  };

  let content: React.ReactNode = null;
  // Keep Automation shell (sidebar) mounted while subtab data loads.
  if (loading && primary !== 'automation') {
    content = (
      <Box align="center" padding="60px">
        <Loader size="medium" />
      </Box>
    );
  } else if (error && primary !== 'automation') {
    content = (
      <EmptyState title="Something went wrong" subtitle={error} skin="page-no-border">
        <Button onClick={() => loadCurrent()}>Retry</Button>
      </EmptyState>
    );
  } else if (primary === 'dashboard') {
    content = (
      <DashboardScreen
        kpis={kpis}
        activity={activity}
        config={config}
        onOpenAutomation={(sub) => {
          setAutomationSub(sub);
          setPrimary('automation');
        }}
        onOpenLogs={() => setPrimary('logs')}
        onOpenCustomization={(sub = 'email') => {
          if (sub === 'storefront') {
            setPrimary('storefront');
          } else {
            setPrimary('email');
          }
        }}
        onTestAlert={() =>
          runSafe(async () => {
            await adminPost({
              action: 'testAlert',
              to: config?.sellerEmail || undefined,
            });
          }, 'Test alert sent')
        }
      />
    );
  } else if (primary === 'automation') {
    content = (
      <AutomationScreen
        sub={automationSub}
        onSubChange={setAutomationSub}
        contentLoading={loading}
        contentError={error}
        onRetryLoad={() => loadCurrent()}
        config={config}
        setConfig={setConfig}
        listType={listType}
        setListType={handleSetListType}
        listSearch={listSearch}
        setListSearch={setListSearch}
        listItems={listItems}
        listTotalCount={listTotalCount}
        listSkip={listSkip}
        listStateFilter={listStateFilter}
        setListStateFilter={(state: string) => {
          setListStateFilter(state);
          setListSkip(0);
          loadLists(undefined, 0, state).catch(() => undefined);
        }}
        onLoadMoreLists={() => {
          const next = listSkip + 50;
          if (next < listTotalCount) {
            loadLists(undefined, next).catch(() => undefined);
          }
        }}
        selectedSubs={selectedSubs}
        setSelectedSubs={setSelectedSubs}
        whatsapp={whatsapp}
        whatsappSearch={whatsappSearch}
        setWhatsappSearch={setWhatsappSearch}
        tracked={tracked}
        search={search}
        setSearch={setSearch}
        searchResults={searchResults}
        draftOverrides={draftOverrides}
        setDraftOverrides={setDraftOverrides}
        siteTimeZone={siteTimeZone}
        rulesModule={rulesModule}
        setRulesModule={setRulesModule}
        onSaveModules={saveModules}
        onSaveRules={saveRulesFromPanel}
        isSavingRules={isSavingRules}
        onReload={loadCurrent}
        onRun={runSafe}
        onGoSettings={() => {
          setPrimary('automation');
          setAutomationSub('settings');
        }}
        onGoCustomization={(target: CustomizationSub = 'storefront', triggerType?: string) => {
          if (triggerType) {
            onTemplateTriggerChange(triggerType);
          }
          if (target === 'storefront') {
            setPrimary('storefront');
          } else {
            setPrimary('email');
          }
        }}
        adminPost={adminPost}
        onSearchProducts={() =>
          runSafe(async () => {
            setInventorySearching(true);
            try {
              await loadProducts(inventorySearchRef.current);
            } finally {
              setInventorySearching(false);
            }
          })
        }
        onRefreshInventory={async () => {
          await loadProducts('');
        }}
        inventorySearching={inventorySearching}
        onResolveWhatsapp={async (ids, action) => {
          try {
            await adminPost({
              action: action === 'sent' ? 'markWhatsappSent' : 'removeWhatsapp',
              ids,
            });
            setWhatsapp((prev) => prev.filter((row) => !ids.includes(row._id)));
            notify(
              action === 'sent'
                ? ids.length > 1
                  ? `Marked ${ids.length} sent`
                  : 'Marked sent'
                : ids.length > 1
                  ? `Dismissed ${ids.length}`
                  : 'Dismissed',
              'success',
            );
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Something went wrong', 'error');
            throw e;
          }
        }}
        onDeleteSubscribers={async (ids) => {
          try {
            await adminPost({ action: 'deleteSubscriptions', ids });
            setListItems((prev) => {
              const next = prev.filter((row) => !ids.includes(row._id));
              const nextTotal = Math.max(0, listTotalCount - ids.length);
              setListTotalCount(nextTotal);
              patchCurrentListCache(next, nextTotal);
              return next;
            });
            setSelectedSubs([]);
            notify(
              ids.length > 1 ? `Deleted ${ids.length} subscribers` : 'Deleted selected',
              'success',
            );
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Something went wrong', 'error');
            throw e;
          }
        }}
        onTriggerSubscriber={async (productId) => {
          try {
            await adminPost({
              action: 'manualTriggerAlert',
              productId,
              subscriptionType: listType,
            });
            setListItems((prev) => {
              const updated = prev.map((row) =>
                row.productId === productId ? { ...row, state: 'notified' } : row,
              );
              let next = updated;
              let nextTotal = listTotalCount;
              if (listStateFilter === 'waiting') {
                next = updated.filter(
                  (row) => !row.state || String(row.state).toLowerCase() === 'waiting',
                );
                nextTotal = Math.max(0, listTotalCount - (prev.length - next.length));
                setListTotalCount(nextTotal);
              }
              patchCurrentListCache(next, nextTotal);
              return next;
            });
            notify('Alert triggered', 'success');
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Something went wrong', 'error');
            throw e;
          }
        }}
      />
    );
  } else if (primary === 'email') {
    content = (
      <EmailCustomizationScreen
        config={config}
        setConfig={setConfig}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        onTemplateTriggerChange={onTemplateTriggerChange}
        onRun={runSafe}
        adminPost={adminPost}
        onReload={loadCurrent}
      />
    );
  } else if (primary === 'storefront') {
    content = (
      <StorefrontCustomizationScreen
        config={config}
        setConfig={setConfig}
        onRun={runSafe}
        adminPost={adminPost}
      />
    );
  } else if (primary === 'logs') {
    content = (
      <LogsAndQuotaScreen
        quota={quota}
        alerts={alerts}
        alertsTotalCount={alertsTotalCount}
        onLoadMoreAlerts={() => {
          const next = alertsSkip + 50;
          if (next < alertsTotalCount) {
            loadAlerts(next).catch(() => undefined);
          }
        }}
        selectedAlerts={selectedAlerts}
        setSelectedAlerts={setSelectedAlerts}
        onDeleteSelectedAlerts={async () => {
          await runSafe(async () => {
            await adminPost({ action: 'deleteAlerts', ids: selectedAlerts });
            setSelectedAlerts([]);
            await loadAlerts(0);
          }, 'Deleted selected alerts');
        }}
        onClearAllAlerts={async () => {
          await runSafe(async () => {
            let hasMore = true;
            let totalDeleted = 0;
            while (hasMore) {
              const data = await adminPost({
                action: 'deleteAlerts',
                all: true,
                maxBatches: 20,
              });
              totalDeleted += Number(data.deleted || 0);
              hasMore = Boolean(data.hasMore);
            }
            await loadAlerts(0);
            if (totalDeleted === 0) {
              notify('No alerts to delete', 'warning');
            }
          }, 'All alerts deleted');
        }}
        alertSearch={alertSearch}
        onAlertSearchChange={setAlertSearch}
        alertChannelFilter={alertChannelFilter}
        onAlertChannelFilterChange={(value) => {
          setAlertChannelFilter(value);
          setAlertsSkip(0);
        }}
        onGoSettings={() => {
          setPrimary('automation');
          setAutomationSub('settings');
        }}
      />
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page height="100vh" maxWidth={99999} sidePadding={32}>
        <Page.Header
          title="Smart Alerts"
          subtitle="Back-in-stock, price-drop, and seller notifications for your store."
        />
        <Page.Content>
          <Box direction="vertical" gap="SP4">
            {/* Scrolls away with content — not in Page.Tail */}
            <SupportWidget />
            <GuideWidget />
            {/* Sticks below header after the support/guide cards scroll out */}
            <Page.Sticky>
              <Box backgroundColor="D70" paddingBottom="SP2">
                <Tabs
                  items={PRIMARY_TABS}
                  type="compactSide"
                  activeId={primary}
                  onClick={(tab) => setPrimary(tab.id as PrimaryTab)}
                />
              </Box>
            </Page.Sticky>
            {content}
          </Box>
        </Page.Content>
      </Page>
      <ToastContainer maxToasts={3}>
        {toasts.map((t) => (
          <StatusToast
            key={t.id}
            status={t.status}
            dismissible
            dismissLabel="Dismiss"
            onDismiss={() => removeToast(t.id)}
            duration={t.status === 'error' ? null : 7000}
          >
            {t.msg}
          </StatusToast>
        ))}
      </ToastContainer>
    </WixDesignSystemProvider>
  );
}
