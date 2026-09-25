import { inventoryItemsV3 } from '@wix/stores';
import { handleStockStatusUpdated } from '../../../../lib/smart-alerts/engine';

export default inventoryItemsV3.onInventoryItemStockStatusUpdated(async (event) => {
  try {
    await handleStockStatusUpdated(event as never);
  } catch (err) {
    console.error('inventory-stock-updated failed', err);
  }
});
