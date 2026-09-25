import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { requireDashboardAuth } from '../../lib/smart-alerts/auth-guard';
import { getOrCreateConfig, updateConfig } from '../../lib/smart-alerts/config';
import { canSendAlert, countAlertsUsed } from '../../lib/smart-alerts/email';
import { getCatalogVersion, searchProducts, upsertProductOverride } from '../../lib/smart-alerts/products';
import {
  manualTriggerAlert,
  resyncCatalogCache,
  sendTestAlert,
} from '../../lib/smart-alerts/engine';
import { markWhatsappSent, testWhatsappConnection } from '../../lib/smart-alerts/whatsapp';
import { queryAllPages } from '../../lib/smart-alerts/query-helpers';
import {
  COLLECTIONS,
  DEFAULT_MODULES,
  DEFAULT_APPEARANCE,
  DEFAULT_BRAND,
  DEFAULT_SUPPORT,
  DEFAULT_QUOTA,
  DEFAULT_NOTIFICATION_LIMITS,
  DEFAULT_TRIGGER_RULES,
  DEFAULT_WHATSAPP_SETUP,
  DEFAULT_SYNC_SETTINGS,
  PRICE_DROP_COOLDOWN_HOURS,
} from '../../lib/smart-alerts/constants';

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function pageParams(url: URL, defaultLimit = 50) {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || defaultLimit) || defaultLimit, 1), 100);
  const skip = Math.max(Number(url.searchParams.get('skip') || 0) || 0, 0);
  return { limit, skip };
}

const LIST_FIELDS = [
  '_id',
  'email',
  'phone',
  'productId',
  'productName',
  'subscriptionType',
  'state',
  'watchedPrice',
  '_createdDate',
  'lastNotifiedAt',
] as const;

const ALERT_FIELDS = [
  '_id',
  'alertType',
  'channel',
  'to',
  'status',
  'productId',
  'errorMessage',
  'sentAt',
] as const;

const WA_FIELDS = [
  '_id',
  'phone',
  'productId',
  'productName',
  'email',
  'message',
  'waMeUrl',
  'status',
] as const;

const TRACKED_FIELDS = [
  '_id',
  'productId',
  'variantId',
  'productName',
  'sku',
  'lowStockThreshold',
  'useGlobalThreshold',
  'restockAt',
  'lastKnownPrice',
  'lastStockStatus',
  'tracked',
] as const;

export const GET: APIRoute = async ({ request }) => {
  const denied = requireDashboardAuth(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'dashboard';

  try {
    if (view === 'dashboard') {
      const config = await getOrCreateConfig();
      const quota = await canSendAlert(config);
      const query = auth.elevate(items.query);
      const [bis, price, wa, recentSubs, recentAlerts] = await Promise.all([
        query(COLLECTIONS.subscriptions).eq('subscriptionType', 'back_in_stock').eq('state', 'waiting').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.subscriptions).eq('subscriptionType', 'price_drop').eq('state', 'waiting').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.whatsappQueue).eq('status', 'pending').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.subscriptions).descending('_createdDate').limit(10).find(),
        query(COLLECTIONS.alerts).descending('sentAt').limit(10).find(),
      ]);
      const onHoldStock = bis.totalCount ?? bis.items.length;
      const watchingPrice = price.totalCount ?? price.items.length;
      const alertsSent = await countAlertsUsed(30);
      return Response.json({
        kpis: {
          onHoldStock,
          watchingPrice,
          activeSubscribers: onHoldStock + watchingPrice,
          pendingAlerts: wa.totalCount ?? wa.items.length,
          alertsSent,
          whatsappPending: wa.totalCount ?? wa.items.length,
          used: quota.used,
          remaining: quota.remaining,
          quota: quota.quota,
        },
        activity: [
          ...recentSubs.items.map((s: any) => ({
            id: s._id,
            kind: 'subscription',
            label: `${s.email} subscribed (${s.subscriptionType})`,
            at: s._createdDate || s.lastNotifiedAt,
          })),
          ...recentAlerts.items.map((a: any) => ({
            id: a._id,
            kind: 'alert',
            label: `${a.alertType} → ${a.to} (${a.status})`,
            at: a.sentAt,
          })),
        ]
          .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
          .slice(0, 20),
        config,
      });
    }

    if (view === 'config') {
      return Response.json({ config: await getOrCreateConfig() });
    }

    if (view === 'lists') {
      const type = url.searchParams.get('type') || 'back_in_stock';
      const q = (url.searchParams.get('q') || '').trim();
      const state = url.searchParams.get('state') || '';
      const { limit, skip } = pageParams(url, 50);
      const query = auth.elevate(items.query);
      let builder = query(COLLECTIONS.subscriptions)
        .eq('subscriptionType', type)
        .fields(...LIST_FIELDS);
      if (state === 'waiting' || state === 'notified') {
        builder = builder.eq('state', state);
      } else {
        builder = builder.ne('state', 'cancelled');
      }
      if (q) {
        builder = builder.contains('email', q);
      }
      const result = await builder.skip(skip).limit(limit).find({ returnTotalCount: true });
      const totalCount = result.totalCount ?? result.items.length;
      const nextSkip = skip + result.items.length < totalCount ? skip + result.items.length : null;
      return Response.json({
        items: result.items,
        totalCount,
        skip,
        limit,
        nextSkip,
      });
    }

    if (view === 'whatsapp') {
      const { limit, skip } = pageParams(url, 50);
      const q = (url.searchParams.get('q') || '').trim();
      const query = auth.elevate(items.query);
      let builder = query(COLLECTIONS.whatsappQueue)
        .eq('status', 'pending')
        .fields(...WA_FIELDS);
      if (q) builder = builder.contains('phone', q);
      const result = await builder.skip(skip).limit(limit).find({ returnTotalCount: true });
      const config = await getOrCreateConfig();
      const totalCount = result.totalCount ?? result.items.length;
      return Response.json({
        items: result.items,
        whatsappSetup: config.whatsappSetup,
        totalCount,
        skip,
        limit,
        nextSkip: skip + result.items.length < totalCount ? skip + result.items.length : null,
      });
    }

    if (view === 'templates') {
      const query = auth.elevate(items.query);
      const result = await query(COLLECTIONS.templates).limit(50).find();
      const config = await getOrCreateConfig();
      return Response.json({ items: result.items, brand: config.brand, appearance: config.appearance });
    }

    if (view === 'products') {
      const q = url.searchParams.get('q') || '';
      const { limit, skip } = pageParams(url, 50);
      const query = auth.elevate(items.query);
      const tracked = await query(COLLECTIONS.productOverrides)
        .eq('tracked', true)
        .fields(...TRACKED_FIELDS)
        .skip(skip)
        .limit(limit)
        .find({ returnTotalCount: true });
      const search = q ? await searchProducts(q) : [];
      const totalCount = tracked.totalCount ?? tracked.items.length;
      return Response.json({
        tracked: tracked.items,
        search,
        catalogVersion: await getCatalogVersion(),
        totalCount,
        skip,
        limit,
        nextSkip: skip + tracked.items.length < totalCount ? skip + tracked.items.length : null,
      });
    }

    if (view === 'alerts') {
      const config = await getOrCreateConfig();
      const quota = await canSendAlert(config);
      const { limit, skip } = pageParams(url, 50);
      const status = url.searchParams.get('status') || '';
      const channel = url.searchParams.get('channel') || '';
      const q = (url.searchParams.get('q') || '').trim();
      const query = auth.elevate(items.query);
      let builder = query(COLLECTIONS.alerts).fields(...ALERT_FIELDS).descending('sentAt');
      if (status) builder = builder.eq('status', status);
      if (channel) builder = builder.eq('channel', channel);
      if (q) builder = builder.contains('to', q);
      const result = await builder.skip(skip).limit(limit).find({ returnTotalCount: true });
      const totalCount = result.totalCount ?? result.items.length;
      return Response.json({
        items: result.items,
        quota,
        totalCount,
        skip,
        limit,
        nextSkip: skip + result.items.length < totalCount ? skip + result.items.length : null,
      });
    }

    return Response.json({ error: 'Unknown view' }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Admin API failed' },
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = requireDashboardAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'saveConfig') {
      const config = await updateConfig(body.patch || {});
      return Response.json({ config });
    }

    if (action === 'saveTemplate') {
      const query = auth.elevate(items.query);
      const existing = await query(COLLECTIONS.templates)
        .eq('triggerType', body.triggerType)
        .eq('channel', body.channel || 'email')
        .limit(1)
        .find();
      const payload = {
        title: body.triggerType,
        triggerType: body.triggerType,
        channel: body.channel || 'email',
        layout: body.layout || 'Centered',
        subject: body.subject || '',
        preheader: body.preheader || '',
        headerStyle: body.headerStyle || 'dark',
        headerText: body.headerText || '',
        showBadge: body.showBadge !== false,
        badgeText: body.badgeText || '',
        headline: body.headline || '',
        body: body.body || '',
        showProductImage: body.showProductImage !== false,
        reviewQuote: body.reviewQuote || '',
        buttonLabel: body.buttonLabel || 'Shop Now Before It Sells Out',
        showFeatures: Boolean(body.showFeatures),
        featuresTitle: body.featuresTitle || '',
        featuresText: body.featuresText || '',
        closingText: body.closingText || '',
        signoffText: body.signoffText || '',
        footerDisclaimer: body.footerDisclaimer || '',
      };
      if (existing.items[0]) {
        const update = auth.elevate(items.update);
        await update(COLLECTIONS.templates, { ...existing.items[0], ...payload });
      } else {
        const insert = auth.elevate(items.insert);
        await insert(COLLECTIONS.templates, payload);
      }
      return Response.json({ ok: true });
    }

    if (action === 'loadOos') {
      const count = await resyncCatalogCache(50);
      return Response.json({ ok: true, count });
    }

    if (action === 'saveOverride') {
      await upsertProductOverride(body);
      return Response.json({ ok: true });
    }

    if (action === 'deleteAlerts') {
      const remove = auth.elevate(items.remove);
      const ids: string[] = body.ids || [];
      if (body.all) {
        const query = auth.elevate(items.query);
        const all = await queryAllPages(
          (limit, skip) =>
            query(COLLECTIONS.alerts).fields('_id').skip(skip).limit(limit).find(),
          100,
        );
        for (const item of all) {
          await remove(COLLECTIONS.alerts, String(item._id));
        }
      } else {
        for (const id of ids) await remove(COLLECTIONS.alerts, id);
      }
      return Response.json({ ok: true });
    }

    if (action === 'deleteSubscriptions') {
      const remove = auth.elevate(items.remove);
      const ids: string[] = body.ids || [];
      for (const id of ids) await remove(COLLECTIONS.subscriptions, id);
      return Response.json({ ok: true });
    }

    if (action === 'resetSettings') {
      const config = await updateConfig({
        modules: { ...DEFAULT_MODULES },
        appearance: { ...DEFAULT_APPEARANCE },
        brand: { ...DEFAULT_BRAND },
        support: { ...DEFAULT_SUPPORT },
        monthlyAlertQuota: DEFAULT_QUOTA,
        priceDropCooldownHours: PRICE_DROP_COOLDOWN_HOURS,
        digestFrequency: 'weekly',
        globalLowStockThreshold: 5,
        publicAppBaseUrl: '',
        lastDigestAt: null,
        notificationLimits: { ...DEFAULT_NOTIFICATION_LIMITS },
        triggerRules: { ...DEFAULT_TRIGGER_RULES },
        whatsappSetup: { ...DEFAULT_WHATSAPP_SETUP },
        syncSettings: { ...DEFAULT_SYNC_SETTINGS },
      });
      return Response.json({ config });
    }

    if (action === 'removeWhatsapp') {
      const remove = auth.elevate(items.remove);
      await remove(COLLECTIONS.whatsappQueue, body.id);
      return Response.json({ ok: true });
    }

    if (action === 'markWhatsappSent') {
      await markWhatsappSent(body.id);
      return Response.json({ ok: true });
    }

    if (action === 'testWhatsappConnection') {
      const result = await testWhatsappConnection();
      return Response.json({ ...result, config: await getOrCreateConfig() });
    }

    if (action === 'testAlert') {
      const to = body.to || (await getOrCreateConfig()).sellerEmail;
      const ok = await sendTestAlert(String(to || ''));
      return Response.json({ ok });
    }

    if (action === 'resyncCatalog') {
      const count = await resyncCatalogCache(50);
      return Response.json({ ok: true, count, config: await getOrCreateConfig() });
    }

    if (action === 'manualTriggerAlert') {
      const sent = await manualTriggerAlert({
        productId: String(body.productId || ''),
        subscriptionType: body.subscriptionType === 'price_drop' ? 'price_drop' : 'back_in_stock',
      });
      return Response.json({ ok: true, sent });
    }

    if (action === 'exportSubscribersCsv') {
      const type = body.type || 'back_in_stock';
      const query = auth.elevate(items.query);
      const rows = await queryAllPages(
        (limit, skip) =>
          query(COLLECTIONS.subscriptions)
            .eq('subscriptionType', type)
            .ne('state', 'cancelled')
            .fields('email', 'productId', 'productName', 'state', 'subscriptionType', 'phone')
            .skip(skip)
            .limit(limit)
            .find(),
        100,
      );
      const header = ['email', 'productId', 'productName', 'state', 'subscriptionType', 'phone'];
      const lines = [
        header.join(','),
        ...rows.map((row: any) => header.map((h) => csvEscape(row[h])).join(',')),
      ];
      return Response.json({ csv: lines.join('\n'), count: rows.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Admin write failed' },
      { status: 500 },
    );
  }
};
