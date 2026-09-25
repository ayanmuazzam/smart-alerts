import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'subscriptions';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Subscriptions',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'productId', displayName: 'Product ID' },
    { type: 'TEXT', key: 'variantId', displayName: 'Variant ID' },
    { type: 'TEXT', key: 'productName', displayName: 'Product Name' },
    { type: 'TEXT', key: 'productUrl', displayName: 'Product URL' },
    { type: 'TEXT', key: 'productImage', displayName: 'Product Image' },
    { type: 'TEXT', key: 'subscriptionType', displayName: 'Subscription Type' },
    { type: 'TEXT', key: 'email', displayName: 'Email' },
    { type: 'TEXT', key: 'phone', displayName: 'Phone' },
    { type: 'TEXT', key: 'state', displayName: 'State' },
    { type: 'BOOLEAN', key: 'consent', displayName: 'Consent' },
    { type: 'NUMBER', key: 'watchedPrice', displayName: 'Watched Price' },
    { type: 'DATETIME', key: 'lastNotifiedAt', displayName: 'Last Notified At' },
    { type: 'DATETIME', key: 'cooldownUntil', displayName: 'Cooldown Until' },
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
      fields: [
        { path: 'productId' },
        { path: 'subscriptionType' },
        { path: 'state' },
      ],
    },
    {
      fields: [{ path: 'email' }, { path: 'productId' }, { path: 'state' }],
    },
    {
      fields: [{ path: 'subscriptionType' }, { path: 'state' }, { path: 'cooldownUntil' }],
    },
  ],
  initialData: [],
} satisfies DataCollection;
