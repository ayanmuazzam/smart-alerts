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
  type SettingsSub,
} from './adminApi';
import { getDefaultEmailTemplate } from '../../../../lib/smart-alerts/constants';
import { DashboardScreen } from './screens/DashboardScreen';
import { AutomationScreen } from './screens/AutomationScreen';
import { EmailCustomizationScreen, type TemplateForm } from './screens/EmailCustomizationScreen';
import { StorefrontCustomizationScreen } from './screens/StorefrontCustomizationScreen';
import { SettingsScreen } from './screens/SettingsScreen';

/** Former floating "My alerts" corner button — disable on sites that still have it embedded. */
const CORNER_EMBEDDED_SCRIPT_ID = 'f1428cdb-83d7-4ac1-b13d-91ee44f6d480';

const PRIMARY_TABS: { id: PrimaryTab; title: string }[] = [
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'automation', title: 'Automation' },
  { id: 'email', title: 'Email & Branding' },
  { id: 'storefront', title: 'Storefront Widget' },
  { id: 'settings', title: 'Settings' },
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
  const [customizationSub, setCustomizationSub] = useState<CustomizationSub>('email');
  const [settingsSub, setSettingsSub] = useState<SettingsSub>('general');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [listType, setListType] = useState('back_in_stock');
  const [listSearch, setListSearch] = useState('');
  const [listItems, setListItems] = useState<any[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(() => formFromDefaults('back_in_stock'));
  const templateTriggerRef = useRef(templateForm.triggerType);
  templateTriggerRef.current = templateForm.triggerType;
  const [tracked, setTracked] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [draftOverrides, setDraftOverrides] = useState<
    Record<string, { lowStockThreshold: string; restockAt: string }>
  >({});
  const [rulesModule, setRulesModule] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadLists = useCallback(async (qOverride?: string) => {
    const q = qOverride !== undefined ? qOverride : listSearchRef.current;
    const extra = `&type=${listType}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
    const data = await adminGet('lists', extra);
    setListItems(data.items || []);
  }, [listType]);

  const loadWhatsapp = useCallback(async () => {
    const data = await adminGet('whatsapp');
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

  const loadProducts = useCallback(async (q?: string) => {
    const term = q !== undefined ? q : search;
    const data = await adminGet(
      'products',
      term ? `&q=${encodeURIComponent(term)}` : '',
    );
    setTracked(data.tracked || []);
    setSearchResults(data.search || []);
    const drafts: Record<string, { lowStockThreshold: string; restockAt: string }> = {};
    for (const row of data.tracked || []) {
      drafts[row._id || row.productId] = {
        lowStockThreshold: String(row.lowStockThreshold ?? 5),
        restockAt: row.restockAt ? new Date(row.restockAt).toISOString().slice(0, 16) : '',
      };
    }
    setDraftOverrides(drafts);
  }, [search]);

  const loadAlerts = useCallback(async () => {
    const data = await adminGet('alerts');
    setAlerts(data.items || []);
    setQuota(data.quota);
  }, []);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (primary === 'dashboard') {
        await loadDashboard();
      } else if (primary === 'automation') {
        if (automationSub === 'rules') await loadConfig();
        else if (automationSub === 'lists') await loadLists();
        else if (automationSub === 'inventory') await loadProducts('');
        else if (automationSub === 'whatsapp') {
          await Promise.all([loadWhatsapp(), loadConfig()]);
        } else if (automationSub === 'history') await loadAlerts();
      } else if (primary === 'email') {
        await loadTemplates();
      } else if (primary === 'storefront') {
        await loadConfig();
      } else if (primary === 'settings') {
        await loadConfig();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [
    primary,
    automationSub,
    customizationSub,
    listType,
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

  // Debounced list filter without toggling the page loader
  useEffect(() => {
    if (primary !== 'automation' || automationSub !== 'lists') return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      loadLists(listSearch).catch(() => undefined);
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [listSearch, primary, automationSub, loadLists]);

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
    await runSafe(async () => {
      const data = await adminPost({
        action: 'saveConfig',
        patch: {
          triggerRules: config.triggerRules,
          notificationLimits: config.notificationLimits,
          appearance: config.appearance,
          priceDropCooldownHours: config.priceDropCooldownHours,
          digestFrequency: config.digestFrequency,
          globalLowStockThreshold: config.globalLowStockThreshold,
        },
      });
      if (data.config) setConfig(data.config);
      setRulesModule(null);
    }, 'Module rules saved');
  };

  let content: React.ReactNode = null;
  if (loading) {
    content = (
      <Box align="center" padding="60px">
        <Loader size="medium" />
      </Box>
    );
  } else if (error) {
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
        config={config}
        setConfig={setConfig}
        listType={listType}
        setListType={setListType}
        listSearch={listSearch}
        setListSearch={setListSearch}
        listItems={listItems}
        selectedSubs={selectedSubs}
        setSelectedSubs={setSelectedSubs}
        whatsapp={whatsapp}
        tracked={tracked}
        search={search}
        setSearch={setSearch}
        searchResults={searchResults}
        draftOverrides={draftOverrides}
        setDraftOverrides={setDraftOverrides}
        alerts={alerts}
        quota={quota}
        selectedAlerts={selectedAlerts}
        setSelectedAlerts={setSelectedAlerts}
        rulesModule={rulesModule}
        setRulesModule={setRulesModule}
        onSaveModules={saveModules}
        onSaveRules={saveRulesFromPanel}
        onReload={loadCurrent}
        onRun={runSafe}
        onGoSettings={() => {
          setSettingsSub('general');
          setPrimary('settings');
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
            await loadProducts(search);
          })
        }
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
  } else if (primary === 'settings') {
    content = (
      <SettingsScreen
        sub={settingsSub}
        onSubChange={setSettingsSub}
        config={config}
        setConfig={setConfig}
        onRun={runSafe}
        adminPost={adminPost}
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
        <Page.Tail>
          <Tabs
            items={PRIMARY_TABS}
            type="compactSide"
            activeId={primary}
            onClick={(tab) => setPrimary(tab.id as PrimaryTab)}
          />
        </Page.Tail>
        <Page.Content>{content}</Page.Content>
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
