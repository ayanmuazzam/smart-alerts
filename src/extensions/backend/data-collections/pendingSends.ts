import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'pendingSends';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Smart Alerts Pending Sends',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'to', displayName: 'To' },
    { type: 'TEXT', key: 'channel', displayName: 'Channel' },
    { type: 'TEXT', key: 'alertType', displayName: 'Alert Type' },
    { type: 'TEXT', key: 'productId', displayName: 'Product Id' },
    { type: 'OBJECT', key: 'payload', displayName: 'Payload', objectOptions: { fields: [] } },
    { type: 'DATETIME', key: 'scheduledFor', displayName: 'Scheduled For' },
    { type: 'TEXT', key: 'status', displayName: 'Status' },
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
      fields: [{ path: 'status' }, { path: 'scheduledFor' }],
    },
  ],
  initialData: [],
} satisfies DataCollection;
