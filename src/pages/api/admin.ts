import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { requireDashboardAuth } from '../../lib/smart-alerts/auth-guard';
import { getOrCreateConfig, updateConfig } from '../../lib/smart-alerts/config';
import { canSendAlert, countAlertsUsed } from '../../lib/smart-alerts/email';
import { getCatalogVersion, searchProducts, upsertProductOverride } from '../../lib/smart-alerts/products';
import {
  manualTriggerAlert,
  ensureCatalogSeeded,
  resyncCatalogCache,
  sendTestAlert,
} from '../../lib/smart-alerts/engine';
import { markWhatsappSent } from '../../lib/smart-alerts/whatsapp';
import { queryAllPages } from '../../lib/smart-alerts/query-helpers';
import { datetimeLocalToStored } from '../../lib/smart-alerts/datetime-local';
import { getSiteTimeZone } from '../../lib/smart-alerts/site-timezone';
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
  'variantId',
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
  'trackedSource',
] as const;

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireDashboardAuth(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'dashboard';

  try {
    if (view === 'dashboard') {
      await ensureCatalogSeeded('first_open');
      const config = await getOrCreateConfig();
      const quota = await canSendAlert(config);
      const query = auth.elevate(items.query);
      const [bis, price, wa, recentSubs, recentAlerts] = await Promise.all([
        query(COLLECTIONS.subscriptions).eq('subscriptionType', 'back_in_stock').eq('state', 'waiting').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.subscriptions).eq('subscriptionType', 'price_drop').eq('state', 'waiting').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.whatsappQueue).eq('status', 'pending').limit(1).find({ returnTotalCount: true }),
        query(COLLECTIONS.subscriptions)
          .descending('_createdDate')
          .fields('_id', 'email', 'subscriptionType', '_createdDate', 'lastNotifiedAt')
          .limit(10)
          .find(),
        query(COLLECTIONS.alerts)
          .descending('sentAt')
          .fields('_id', 'alertType', 'to', 'status', 'sentAt')
          .limit(10)
          .find(),
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

      let enrichedItems = result.items;
      if (type === 'price_drop' && result.items.length > 0) {
        const productIds = Array.from(new Set(result.items.map((i: any) => i.productId).filter(Boolean)));
        if (productIds.length > 0) {
          try {
            const overrides = await query(COLLECTIONS.productOverrides)
              .hasSome('productId', productIds)
              .fields('productId', 'variantId', 'lastKnownPrice')
              .find();
            const priceMap = new Map<string, number>();
            for (const o of (overrides.items || []) as any[]) {
              if (o.productId && o.lastKnownPrice != null) {
                const key = `${o.productId}::${o.variantId || ''}`;
                priceMap.set(key, Number(o.lastKnownPrice));
              }
            }
            enrichedItems = result.items.map((item: any) => {
              const key = `${item.productId}::${item.variantId || ''}`;
              const productKey = `${item.productId}::`;
              return {
                ...item,
                currentPrice:
                  priceMap.get(key) ??
                  priceMap.get(productKey) ??
                  item.watchedPrice ??
                  null,
              };
            });
          } catch {
            enrichedItems = result.items;
          }
        }
      }

      return Response.json({
        items: enrichedItems,
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
      if (q) {
        // Phone-like → phone field; otherwise product name (single contains filter).
        builder = /^\+?\d[\d\s-]{2,}$/.test(q)
          ? builder.contains('phone', q)
          : builder.contains('productName', q);
      }
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
      const q = (url.searchParams.get('q') || '').trim();
      // Only intentional tracks: Track Product (manual) and Scan Out-of-Stock (scan).
      const source = url.searchParams.get('source') || 'all';
      const stock = url.searchParams.get('stock') || 'all';
      const { limit, skip } = pageParams(url, 50);
      const query = auth.elevate(items.query);

      let builder = query(COLLECTIONS.productOverrides)
        .eq('tracked', true)
        .fields(...TRACKED_FIELDS);
      if (source === 'manual' || source === 'scan') {
        builder = builder.eq('trackedSource', source);
      } else {
        builder = builder.hasSome('trackedSource', ['manual', 'scan']);
      }
      if (stock === 'oos') {
        builder = builder.eq('lastStockStatus', 'OUT_OF_STOCK');
      }

      const result = await builder.skip(skip).limit(limit).find({ returnTotalCount: true });
      const totalCount = result.totalCount ?? result.items.length;
      const search = q ? await searchProducts(q) : [];
      const siteTimeZone = await getSiteTimeZone();
      return Response.json({
        tracked: result.items,
        search,
        catalogVersion: await getCatalogVersion(),
        siteTimeZone,
        totalCount,
        skip,
        limit,
        nextSkip: skip + result.items.length < totalCount ? skip + result.items.length : null,
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
  const denied = await requireDashboardAuth(request);
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
      const siteTimeZone = await getSiteTimeZone();
      const restockAt =
        body.restockAt === null || body.restockAt === ''
          ? null
          : datetimeLocalToStored(
              // Accept wall-clock (YYYY-MM-DDTHH:mm) or a prior ISO; strip zone and re-interpret in site TZ.
              String(body.restockAt).replace(/\.\d{3}Z$/, '').replace(/Z$/, '').slice(0, 16),
              siteTimeZone,
            );
      await upsertProductOverride({
        ...body,
        restockAt,
        tracked: body.tracked !== false,
        trackedSource: body.trackedSource === 'scan' ? 'scan' : 'manual',
      });
      return Response.json({ ok: true, siteTimeZone });
    }

    if (action === 'deleteAlerts') {
      const remove = auth.elevate(items.remove);
      const ids: string[] = body.ids || [];
      if (body.all) {
        const query = auth.elevate(items.query);
        const pageSize = 50;
        const maxBatches = Math.min(Math.max(Number(body.maxBatches) || 20, 1), 40);
        let deleted = 0;
        let hasMore = false;
        for (let batch = 0; batch < maxBatches; batch += 1) {
          const page = await query(COLLECTIONS.alerts).fields('_id').limit(pageSize).find();
          const batchItems = page.items || [];
          if (batchItems.length === 0) {
            hasMore = false;
            break;
          }
          for (const item of batchItems) {
            await remove(COLLECTIONS.alerts, String(item._id));
            deleted += 1;
          }
          hasMore = batchItems.length >= pageSize;
          if (!hasMore) break;
        }
        return Response.json({ ok: true, deleted, hasMore });
      }
      for (const id of ids) await remove(COLLECTIONS.alerts, id);
      return Response.json({ ok: true, deleted: ids.length, hasMore: false });
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
        globalLowStockThreshold: 5,
        notificationLimits: {
          ...DEFAULT_NOTIFICATION_LIMITS,
          batchMode: 'immediate',
          batchHourUtc: DEFAULT_NOTIFICATION_LIMITS.batchHourUtc,
        },
        triggerRules: { ...DEFAULT_TRIGGER_RULES },
        whatsappSetup: { ...DEFAULT_WHATSAPP_SETUP },
        syncSettings: { ...DEFAULT_SYNC_SETTINGS },
      });
      return Response.json({ config });
    }

    if (action === 'removeWhatsapp') {
      const remove = auth.elevate(items.remove);
      const ids: string[] = Array.isArray(body.ids)
        ? body.ids.map(String).filter(Boolean)
        : body.id
          ? [String(body.id)]
          : [];
      for (const id of ids) {
        await remove(COLLECTIONS.whatsappQueue, id);
      }
      return Response.json({ ok: true, count: ids.length });
    }

    if (action === 'markWhatsappSent') {
      const ids: string[] = Array.isArray(body.ids)
        ? body.ids.map(String).filter(Boolean)
        : body.id
          ? [String(body.id)]
          : [];
      for (const id of ids) {
        await markWhatsappSent(id);
      }
      return Response.json({ ok: true, count: ids.length });
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
      const isPrice = type === 'price_drop';
      const fields = isPrice
        ? [
            'email',
            'productId',
            'variantId',
            'productName',
            'state',
            'subscriptionType',
            'watchedPrice',
            'phone',
          ]
        : [
            'email',
            'productId',
            'variantId',
            'productName',
            'state',
            'subscriptionType',
            'phone',
          ];
      const rows = await queryAllPages(
        (limit, skip) =>
          query(COLLECTIONS.subscriptions)
            .eq('subscriptionType', type)
            .ne('state', 'cancelled')
            .fields(...fields)
            .skip(skip)
            .limit(limit)
            .find(),
        100,
      );
      const header = fields;
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
