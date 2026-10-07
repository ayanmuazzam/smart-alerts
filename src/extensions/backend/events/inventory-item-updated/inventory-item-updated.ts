import { inventoryItemsV3 } from '@wix/stores';
import { handleInventoryItemUpdated } from '../../../../lib/smart-alerts/engine';

export default inventoryItemsV3.onInventoryItemUpdated(async (event) => {
  try {
    await handleInventoryItemUpdated(event as never);
  } catch (err) {
    console.error('inventory-item-updated failed', err);
  }
});
