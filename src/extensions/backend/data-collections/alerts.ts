import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'alerts';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Alerts',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'alertType', displayName: 'Alert Type' },
    { type: 'TEXT', key: 'channel', displayName: 'Channel' },
    { type: 'TEXT', key: 'to', displayName: 'To' },
    { type: 'TEXT', key: 'status', displayName: 'Status' },
    { type: 'TEXT', key: 'productId', displayName: 'Product ID' },
    { type: 'TEXT', key: 'errorMessage', displayName: 'Error Message' },
    { type: 'DATETIME', key: 'sentAt', displayName: 'Sent At' },
  ],
  displayField: 'title',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    itemRead: 'PRIVILEGED',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [],
  initialData: [],
} satisfies DataCollection;
