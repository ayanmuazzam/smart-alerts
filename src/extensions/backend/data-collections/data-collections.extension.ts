import { extensions } from '@wix/astro/builders'

import configCollection from './config';

import subscriptionsCollection from './subscriptions';

import productOverridesCollection from './productOverrides';

import templatesCollection from './templates';

import alertsCollection from './alerts';

import whatsappQueueCollection from './whatsappQueue';

import processedEventsCollection from './processedEvents';

import pendingSendsCollection from './pendingSends';

export default extensions.dataCollections({
  id: '2dc3cfe7-2563-4bd0-a685-cdf7f237b121',
  name: 'Data Collections',
  collections: [
    configCollection,
    subscriptionsCollection,
    productOverridesCollection,
    templatesCollection,
    alertsCollection,
    whatsappQueueCollection,
    processedEventsCollection,
    pendingSendsCollection,
  ],
});
