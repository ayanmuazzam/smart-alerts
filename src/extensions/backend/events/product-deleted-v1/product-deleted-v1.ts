import { products } from '@wix/stores';
import { handleProductDeleted } from '../../../../lib/smart-alerts/engine';

export default products.onProductDeleted(async (event) => {
  try {
    await handleProductDeleted(event as never);
  } catch (err) {
    console.error('product-deleted-v1 failed', err);
  }
});
