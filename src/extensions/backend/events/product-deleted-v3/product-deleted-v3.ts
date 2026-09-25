import { productsV3 } from '@wix/stores';
import { handleProductDeleted } from '../../../../lib/smart-alerts/engine';

export default productsV3.onProductDeleted(async (event) => {
  try {
    await handleProductDeleted(event as never);
  } catch (err) {
    console.error('product-deleted-v3 failed', err);
  }
});
