import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { inventory, inventoryItemsV3 } from '@wix/stores';
import { COLLECTIONS } from './constants';
import {
  getCatalogVersion,
  getInventoryItem,
  listInventoryItemsForProduct,
  getProductSnapshot,
  type InventoryItemRow,
  type RestockAction,
  upsertProductOverride,
} from './products';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type DueRestockRow = {
  _id?: string;
  productId: string;
  variantId?: string;
  productName?: string;
  restockAt?: Date | string | null;
  restockAction?: string | null;
  restockQuantity?: number | null;
  restockAppliedAt?: Date | string | null;
};

export type RestockApplyResult = {
  productId: string;
  variantId: string;
  action: RestockAction;
  ok: boolean;
  error?: string;
};

function normalizeAction(raw: unknown): RestockAction {
  const v = String(raw || 'none').trim().toLowerCase();
  if (v === 'in_stock' || v === 'in_stock_qty') return v;
  return 'none';
}

async function writeV3InventoryItem(
  item: InventoryItemRow,
  opts: { mode: 'in_stock' | 'in_stock_qty'; quantity?: number },
): Promise<void> {
  if (!item?._id || item.revision == null) {
    throw new Error('Inventory item not found for product');
  }
  const id = String(item._id);
  const revision = String(item.revision);
  const options = { reason: inventoryItemsV3.ReasonType.MANUAL };

  if (opts.mode === 'in_stock_qty') {
    const qty = Math.max(0, Math.min(99999, Math.floor(Number(opts.quantity) || 0)));
    if (qty <= 0) throw new Error('Restock quantity must be at least 1');

    try {
      const update = auth.elevate(inventoryItemsV3.updateInventoryItem);
      await update(id, { _id: id, revision, quantity: qty } as never, options as never);
    } catch (err) {
      if (!isForbidden(err)) throw err;
      const current = Number(item.quantity ?? 0) || 0;
      const delta = qty - current;
      if (delta === 0) return;
      if (delta < 0) throw inventoryWriteDeniedError(err);
      try {
        const inc = auth.elevate(inventoryItemsV3.bulkIncrementInventoryItems);
        await inc([{ inventoryItemId: id, incrementBy: delta }], options as never);
      } catch (incErr) {
        throw inventoryWriteDeniedError(incErr);
      }
    }
    return;
  }

  try {
    const update = auth.elevate(inventoryItemsV3.updateInventoryItem);
    await update(id, { _id: id, revision, inStock: true } as never, options as never);
  } catch (err) {
    if (!isForbidden(err)) throw err;
    try {
      const inc = auth.elevate(inventoryItemsV3.bulkIncrementInventoryItems);
      await inc([{ inventoryItemId: id, incrementBy: 1 }], options as never);
    } catch (incErr) {
      throw inventoryWriteDeniedError(incErr);
    }
  }
}

/**
 * Set store inventory for a product/variant.
 * - in_stock: status tracking → available
 * - in_stock_qty: quantity tracking → absolute quantity
 * - no variantId on multi-SKU: restock every inventory item for the product
 */
export async function setProductInStock(opts: {
  productId: string;
  variantId?: string;
  mode: 'in_stock' | 'in_stock_qty';
  quantity?: number;
}): Promise<void> {
  const productId = String(opts.productId || '').trim();
  if (!productId) throw new Error('productId required');
  const variantId = String(opts.variantId || '').trim();
  const version = await getCatalogVersion();

  if (version === 'V3_CATALOG') {
    if (variantId) {
      const item = await getInventoryItem(productId, variantId);
      if (!item) throw new Error('Inventory item not found for product');
      await writeV3InventoryItem(item, opts);
      return;
    }

    const items = await listInventoryItemsForProduct(productId);
    if (items.length === 0) throw new Error('Inventory item not found for product');
    // Product-level restock: apply to every SKU so multi-variant products recover fully.
    for (const item of items) {
      await writeV3InventoryItem(item, opts);
    }
    return;
  }

  if (version === 'V1_CATALOG') {
    const increment = auth.elevate(inventory.incrementInventory);
    if (opts.mode === 'in_stock_qty') {
      const target = Math.max(1, Math.min(99999, Math.floor(Number(opts.quantity) || 0)));
      type V1Var = { variantId?: string; quantity?: number };
      let variants: V1Var[] = [];
      try {
        const q = auth.elevate(inventory.queryInventory);
        const res = await q({
          query: { filter: JSON.stringify({ productId }) },
        });
        variants =
          (res as { inventoryItems?: Array<{ variants?: V1Var[] }> })?.inventoryItems?.[0]
            ?.variants || [];
      } catch {
        variants = [];
      }

      const bump = async (vid: string | undefined, fromQty: number) => {
        const delta = target - fromQty;
        if (delta > 0) {
          await increment([{ productId, ...(vid ? { variantId: vid } : {}), incrementBy: delta }]);
        } else if (fromQty <= 0) {
          await increment([{ productId, ...(vid ? { variantId: vid } : {}), incrementBy: target }]);
        }
      };

      if (!variantId && variants.length > 1) {
        for (const v of variants) {
          const vid = String(v.variantId || '').trim();
          if (!vid) continue;
          await bump(vid, Number(v.quantity ?? 0) || 0);
        }
        return;
      }

      const match = variantId
        ? variants.find((v) => String(v.variantId || '') === variantId)
        : variants[0];
      await bump(variantId || undefined, Number(match?.quantity ?? 0) || 0);
      return;
    }
    if (variantId) {
      await increment([{ productId, variantId, incrementBy: 1 }]);
      return;
    }
    // Product-level status restock on V1: bump default + any listed variants once.
    try {
      const q = auth.elevate(inventory.queryInventory);
      const res = await q({
        query: { filter: JSON.stringify({ productId }) },
      });
      const variants =
        (res as { inventoryItems?: Array<{ variants?: Array<{ variantId?: string }> }> })
          ?.inventoryItems?.[0]?.variants || [];
      if (variants.length > 1) {
        for (const v of variants) {
          const vid = String(v.variantId || '').trim();
          if (!vid) continue;
          await increment([{ productId, variantId: vid, incrementBy: 1 }]);
        }
        return;
      }
    } catch {
      /* fall through to product-level bump */
    }
    await increment([{ productId, incrementBy: 1 }]);
    return;
  }

  throw new Error('Stores catalog not available');
}

async function markRestockApplied(row: DueRestockRow): Promise<void> {
  await upsertProductOverride({
    productId: row.productId,
    variantId: row.variantId || '',
    productName: row.productName,
    restockAt: null,
    restockAppliedAt: new Date(),
    lastStockStatus: 'IN_STOCK',
    tracked: true,
  });
}

/**
 * Apply when restockAt has passed, or when we're within `earlyMs` of the deadline
 * (storefront starts the inventory write while the last seconds still count down).
 */
function isDueOrEarly(
  restockAt: Date | string | null | undefined,
  now: Date,
  earlyMs = 0,
): boolean {
  if (!restockAt) return false;
  const t = new Date(restockAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t - now.getTime() <= Math.max(0, earlyMs);
}

function shouldApplyRow(row: DueRestockRow, now: Date, earlyMs = 0): boolean {
  if (!row.productId || !isDueOrEarly(row.restockAt, now, earlyMs)) return false;
  if (normalizeAction(row.restockAction) === 'none') return false;
  if (row.restockAppliedAt && row.restockAt) {
    const applied = new Date(row.restockAppliedAt).getTime();
    const dueAt = new Date(row.restockAt).getTime();
    if (Number.isFinite(applied) && Number.isFinite(dueAt) && applied >= dueAt - earlyMs) {
      return false;
    }
  }
  return true;
}

async function applyOneRow(
  row: DueRestockRow,
  /** Inventory write target — may differ from override variantId (product-level timer + PDP SKU). */
  inventoryVariantId?: string,
): Promise<RestockApplyResult> {
  const action = normalizeAction(row.restockAction);
  const writeVid = String(
    inventoryVariantId !== undefined ? inventoryVariantId : row.variantId || '',
  );
  if (action === 'none') {
    return { productId: row.productId, variantId: writeVid, action, ok: true };
  }
  try {
    await setProductInStock({
      productId: row.productId,
      variantId: writeVid || undefined,
      mode: action,
      quantity: Number(row.restockQuantity) || 0,
    });
    // Clear timer on the override row that owned the schedule (not the write SKU).
    await markRestockApplied(row);
    return { productId: row.productId, variantId: writeVid, action, ok: true };
  } catch (err) {
    console.error('[smart-alerts] restock apply failed', row.productId, err);
    if (isForbidden(err)) {
      const perms = await getGrantedInventoryPermissions();
      console.warn('[smart-alerts] install inventory permissions', perms);
    }
    return {
      productId: row.productId,
      variantId: writeVid,
      action,
      ok: false,
      error: formatRestockError(err),
    };
  }
}

function isForbidden(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const status = 'status' in err ? Number((err as { status?: number }).status) : undefined;
  const code =
    'details' in err
      ? Number(
          (err as { details?: { applicationError?: { code?: number } } }).details
            ?.applicationError?.code,
        )
      : undefined;
  return status === 403 || code === 403;
}

function inventoryWriteDeniedError(err: unknown): Error {
  return new Error(formatRestockError(err));
}

function formatRestockError(err: unknown): string {
  if (isForbidden(err)) {
    return (
      'Inventory write denied (403). The app lists SCOPE.STORES.INVENTORY_ITEM_WRITE, but this ' +
      'site install has not granted WIX_STORES.INVENTORY_UPDATE yet. Fix: remove US Smart Alerts ' +
      'from the site → reinstall via npm run dev (Agree & Add) so the write scope is approved. ' +
      'Wait a few minutes after adding the permission if you just saved it.'
    );
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Restock apply failed';
}

/** Debug helper: which inventory-related permissions this install actually has. */
export async function getGrantedInventoryPermissions(): Promise<{
  permissions: string[];
  hasInventoryUpdate: boolean;
  hasInventoryRead: boolean;
}> {
  try {
    const { appInstances } = await import('@wix/app-management');
    const get = auth.elevate(appInstances.getAppInstance);
    const res = await get();
    const permissions = ((res as { instance?: { permissions?: string[] } })?.instance
      ?.permissions || []) as string[];
    return {
      permissions: permissions.filter((p) => /INVENTORY|STORES/i.test(p)),
      hasInventoryUpdate: permissions.some(
        (p) => p === 'WIX_STORES.INVENTORY_UPDATE' || p.includes('INVENTORY_UPDATE'),
      ),
      hasInventoryRead: permissions.some(
        (p) => p === 'WIX_STORES.INVENTORY_READ' || p.includes('INVENTORY_READ'),
      ),
    };
  } catch (err) {
    console.warn('[smart-alerts] getAppInstance permissions failed', err);
    return { permissions: [], hasInventoryUpdate: false, hasInventoryRead: false };
  }
}

/**
 * Poll inventory + product snapshot until Stores reports sellable stock.
 * Prevents reloading the PDP before Wix flips Pre-Order → Add to Cart.
 */
export async function waitUntilProductSellable(
  productId: string,
  variantId?: string,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<{ ready: boolean; inStock: boolean; quantity: number | null }> {
  const timeoutMs = Math.min(Math.max(Number(opts?.timeoutMs) || 10000, 1000), 20000);
  const intervalMs = Math.min(Math.max(Number(opts?.intervalMs) || 700, 250), 2000);
  const started = Date.now();
  let last = { ready: false, inStock: false, quantity: null as number | null };

  while (Date.now() - started < timeoutMs) {
    try {
      const inv = await getInventoryItem(productId, variantId || undefined);
      const snap = await getProductSnapshot(productId, variantId);
      const qty =
        inv?.quantity != null
          ? Number(inv.quantity)
          : snap?.quantity != null
            ? Number(snap.quantity)
            : null;
      const invInStock =
        typeof inv?.inStock === 'boolean'
          ? inv.inStock
          : qty != null
            ? qty > 0
            : false;
      const snapInStock = Boolean(snap?.inStock);
      const inStock = invInStock || snapInStock || (qty != null && qty > 0);
      last = { ready: inStock, inStock, quantity: qty };
      if (inStock) return last;
    } catch (err) {
      console.warn('[smart-alerts] waitUntilProductSellable poll failed', err);
    }
    await sleep(intervalMs);
  }
  return last;
}

/**
 * Apply a due (or nearly due) restock action for one product.
 * Safe to call repeatedly — no-ops unless restock window matches and action is set.
 * When waitForStock is false (early tick at ~5s left), returns immediately after write
 * so the storefront timer can keep counting down.
 */
export async function applyDueRestockForProduct(
  productId: string,
  variantId?: string,
  opts?: { earlyMs?: number; waitForStock?: boolean },
): Promise<{
  applied: RestockApplyResult[];
  refreshed: boolean;
  stockReady: boolean;
  quantity: number | null;
}> {
  const pid = String(productId || '').trim();
  if (!pid) {
    return { applied: [], refreshed: false, stockReady: false, quantity: null };
  }

  const earlyMs = Math.max(0, Number(opts?.earlyMs) || 0);
  const waitForStock = opts?.waitForStock !== false;
  const now = new Date();
  const query = auth.elevate(items.query);
  const vid = String(variantId || '').trim();

  let builder = query(COLLECTIONS.productOverrides).eq('productId', pid).eq('tracked', true);
  if (vid) builder = builder.eq('variantId', vid);
  const result = await builder.limit(5).find();
  let rows = (result.items || []) as DueRestockRow[];

  // Merchant tracker rows use variantId ''; also try product-level if variant miss.
  if (vid && rows.length === 0) {
    const fallback = await query(COLLECTIONS.productOverrides)
      .eq('productId', pid)
      .eq('variantId', '')
      .eq('tracked', true)
      .limit(1)
      .find();
    rows = (fallback.items || []) as DueRestockRow[];
  }

  const due = rows.filter((row) => shouldApplyRow(row, now, earlyMs));
  const applied: RestockApplyResult[] = [];
  for (const row of due) {
    // PDP may request a specific SKU while the merchant timer is product-level ('').
    // Prefer the shopper's variant for the inventory write; keep override identity for clear.
    const writeVid = vid || String(row.variantId || '');
    applied.push(await applyOneRow(row, writeVid));
  }

  const refreshed = applied.some((r) => r.ok);
  if (!refreshed) {
    return { applied, refreshed: false, stockReady: false, quantity: null };
  }

  if (!waitForStock) {
    return { applied, refreshed: true, stockReady: false, quantity: null };
  }

  // Give Stores a beat, then poll until sellable so the first PDP reload shows Add to Cart.
  await sleep(800);
  const ready = await waitUntilProductSellable(pid, vid || undefined, {
    timeoutMs: 12000,
    intervalMs: 700,
  });
  // Extra settle time for storefront widget cache after inventory API is already green.
  if (ready.ready) await sleep(1200);

  return {
    applied,
    refreshed: true,
    stockReady: ready.ready,
    quantity: ready.quantity,
  };
}

/**
 * Find tracked overrides whose restock timer has elapsed and apply the
 * merchant-chosen inventory action (if any). Idempotent via clearing restockAt
 * + setting restockAppliedAt.
 */
export async function applyDueRestocks(opts?: {
  limit?: number;
}): Promise<{ checked: number; applied: RestockApplyResult[] }> {
  const limit = Math.min(Math.max(Number(opts?.limit) || 25, 1), 50);
  const now = new Date();
  const query = auth.elevate(items.query);

  // Scan tracked rows in memory — more reliable than compound CMS filters on new fields.
  const result = await query(COLLECTIONS.productOverrides)
    .eq('tracked', true)
    .limit(100)
    .find();
  const due = ((result.items || []) as DueRestockRow[])
    .filter((row) => shouldApplyRow(row, now))
    .slice(0, limit);

  const applied: RestockApplyResult[] = [];
  for (const row of due) {
    applied.push(await applyOneRow(row));
  }

  return { checked: due.length, applied };
}
