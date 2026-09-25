import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'processedEvents';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Processed Events',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'eventId', displayName: 'Event ID' },
    { type: 'TEXT', key: 'eventType', displayName: 'Event Type' },
    { type: 'DATETIME', key: 'processedAt', displayName: 'Processed At' },
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
      fields: [{ path: 'eventId' }],
      unique: true,
    },
  ],
  initialData: [],
} satisfies DataCollection;
