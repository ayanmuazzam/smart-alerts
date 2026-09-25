import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'config';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Smart Alerts Config',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    {
      type: 'OBJECT',
      key: 'modules',
      displayName: 'Modules',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'appearance',
      displayName: 'Appearance',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'brand',
      displayName: 'Brand',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'support',
      displayName: 'Support',
      objectOptions: { fields: [] },
    },
    { type: 'NUMBER', key: 'monthlyAlertQuota', displayName: 'Monthly Alert Quota' },
    { type: 'NUMBER', key: 'priceDropCooldownHours', displayName: 'Price Drop Cooldown Hours' },
    { type: 'TEXT', key: 'digestFrequency', displayName: 'Digest Frequency' },
    { type: 'TEXT', key: 'sellerEmail', displayName: 'Seller Email' },
    { type: 'NUMBER', key: 'globalLowStockThreshold', displayName: 'Global Low Stock Threshold' },
    { type: 'DATETIME', key: 'lastDigestAt', displayName: 'Last Digest At' },
    { type: 'TEXT', key: 'publicAppBaseUrl', displayName: 'Public App Base URL' },
    {
      type: 'OBJECT',
      key: 'notificationLimits',
      displayName: 'Notification Limits',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'triggerRules',
      displayName: 'Trigger Rules',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'whatsappSetup',
      displayName: 'WhatsApp Setup',
      objectOptions: { fields: [] },
    },
    {
      type: 'OBJECT',
      key: 'syncSettings',
      displayName: 'Sync Settings',
      objectOptions: { fields: [] },
    },
  ],
  displayField: 'title',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    // Storefront reads via /api/public-config and /api/product-context (elevated).
    itemRead: 'PRIVILEGED',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [],
  initialData: [],
} satisfies DataCollection;
