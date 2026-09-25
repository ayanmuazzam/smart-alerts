import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'whatsappQueue';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'WhatsApp Queue',
  fields: [
    { type: 'TEXT', key: 'title', displayName: 'Title' },
    { type: 'TEXT', key: 'phone', displayName: 'Phone' },
    { type: 'TEXT', key: 'productId', displayName: 'Product ID' },
    { type: 'TEXT', key: 'productName', displayName: 'Product Name' },
    { type: 'TEXT', key: 'message', displayName: 'Message' },
    { type: 'TEXT', key: 'waMeUrl', displayName: 'wa.me URL' },
    { type: 'TEXT', key: 'status', displayName: 'Status' },
    { type: 'TEXT', key: 'email', displayName: 'Email' },
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
