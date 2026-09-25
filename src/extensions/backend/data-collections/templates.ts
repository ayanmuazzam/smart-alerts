import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'templates';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Templates',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'triggerType', displayName: 'Trigger Type' },
    { type: 'TEXT', key: 'channel', displayName: 'Channel' },
    { type: 'TEXT', key: 'layout', displayName: 'Layout' },
    { type: 'TEXT', key: 'subject', displayName: 'Subject' },
    { type: 'TEXT', key: 'preheader', displayName: 'Preheader' },
    { type: 'TEXT', key: 'headline', displayName: 'Headline' },
    { type: 'TEXT', key: 'body', displayName: 'Body' },
    { type: 'TEXT', key: 'buttonLabel', displayName: 'Button Label' },
    { type: 'BOOLEAN', key: 'showProductImage', displayName: 'Show Product Image' },
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
