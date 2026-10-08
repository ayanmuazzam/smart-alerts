import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'productOverrides';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Product Overrides',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'productId', displayName: 'Product ID' },
    { type: 'TEXT', key: 'variantId', displayName: 'Variant ID' },
    { type: 'TEXT', key: 'productName', displayName: 'Product Name' },
    { type: 'TEXT', key: 'sku', displayName: 'SKU' },
    { type: 'NUMBER', key: 'lowStockThreshold', displayName: 'Low Stock Threshold' },
    { type: 'BOOLEAN', key: 'useGlobalThreshold', displayName: 'Use Global Threshold' },
    { type: 'DATETIME', key: 'restockAt', displayName: 'Restock At' },
    // none | in_stock | in_stock_qty — what to do when restockAt elapses
    { type: 'TEXT', key: 'restockAction', displayName: 'Restock Action' },
    { type: 'NUMBER', key: 'restockQuantity', displayName: 'Restock Quantity' },
    { type: 'DATETIME', key: 'restockAppliedAt', displayName: 'Restock Applied At' },
    { type: 'NUMBER', key: 'lastKnownPrice', displayName: 'Last Known Price' },
    { type: 'TEXT', key: 'lastStockStatus', displayName: 'Last Stock Status' },
    { type: 'DATETIME', key: 'lastLowStockAlertAt', displayName: 'Last Low Stock Alert At' },
    { type: 'BOOLEAN', key: 'tracked', displayName: 'Tracked' },
    // 'manual' = Track Product button; 'scan' = Scan Out-of-Stock; omit/system = cache only
    { type: 'TEXT', key: 'trackedSource', displayName: 'Tracked Source' },
  ],
  displayField: 'title',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    itemRead: 'PRIVILEGED',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [
    {
      fields: [{ path: 'productId' }, { path: 'variantId' }],
    },
    {
      fields: [{ path: 'tracked' }],
    },
    {
      fields: [{ path: 'trackedSource' }],
    },
  ],
  initialData: [],
} satisfies DataCollection;
