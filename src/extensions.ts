import { app } from '@wix/astro/builders';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import inventoryStockUpdated from './extensions/backend/events/inventory-stock-updated/inventory-stock-updated.extension.ts';

import productUpdatedV3 from './extensions/backend/events/product-updated-v3/product-updated-v3.extension.ts';

import productDeletedV3 from './extensions/backend/events/product-deleted-v3/product-deleted-v3.extension.ts';

import productChangedV1 from './extensions/backend/events/product-changed-v1/product-changed-v1.extension.ts';

import productDeletedV1 from './extensions/backend/events/product-deleted-v1/product-deleted-v1.extension.ts';

import orderCreated from './extensions/backend/events/order-created/order-created.extension.ts';

import smartAlertsCorner from './extensions/site/embedded-scripts/smart-alerts-corner/smart-alerts-corner.extension.ts';

import smartAlertsPdp from './extensions/site/plugins/smart-alerts-pdp/smart-alerts-pdp.extension.ts';

export default app()
  .use(myPage).use(dataCollections).use(inventoryStockUpdated).use(productUpdatedV3).use(productDeletedV3).use(productChangedV1).use(productDeletedV1).use(orderCreated).use(smartAlertsCorner).use(smartAlertsPdp);
