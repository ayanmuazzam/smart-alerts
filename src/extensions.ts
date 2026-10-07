import { app } from '@wix/astro/builders';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import inventoryStockUpdated from './extensions/backend/events/inventory-stock-updated/inventory-stock-updated.extension.ts';

import inventoryItemUpdated from './extensions/backend/events/inventory-item-updated/inventory-item-updated.extension.ts';

import inventoryVariantsChangedV1 from './extensions/backend/events/inventory-variants-changed-v1/inventory-variants-changed-v1.extension.ts';

import productUpdatedV3 from './extensions/backend/events/product-updated-v3/product-updated-v3.extension.ts';

import productDeletedV3 from './extensions/backend/events/product-deleted-v3/product-deleted-v3.extension.ts';

import productChangedV1 from './extensions/backend/events/product-changed-v1/product-changed-v1.extension.ts';

import productDeletedV1 from './extensions/backend/events/product-deleted-v1/product-deleted-v1.extension.ts';

import smartAlertsCorner from './extensions/site/embedded-scripts/smart-alerts-corner/smart-alerts-corner.extension.ts';

import smartAlertsPdp from './extensions/site/plugins/smart-alerts-pdp/smart-alerts-pdp.extension.ts';

import appInstanceInstalled from './extensions/backend/events/app-instance-installed/app-instance-installed.extension.ts';

export default app()
  .use(myPage)
  .use(dataCollections)
  .use(inventoryStockUpdated)
  .use(inventoryItemUpdated)
  .use(inventoryVariantsChangedV1)
  .use(productUpdatedV3)
  .use(productDeletedV3)
  .use(productChangedV1)
  .use(productDeletedV1)
  .use(smartAlertsCorner)
  .use(smartAlertsPdp)
  .use(appInstanceInstalled);
