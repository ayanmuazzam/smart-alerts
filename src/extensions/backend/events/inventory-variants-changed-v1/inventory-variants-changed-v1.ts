import { inventory } from '@wix/stores';
import { handleInventoryVariantsChanged } from '../../../../lib/smart-alerts/engine';

export default inventory.onInventoryVariantsChanged(async (event) => {
  try {
    await handleInventoryVariantsChanged(event as never);
  } catch (err) {
    console.error('inventory-variants-changed-v1 failed', err);
  }
});
