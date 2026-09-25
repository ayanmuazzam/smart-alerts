import { products } from '@wix/stores';
import { handleProductUpdated } from '../../../../lib/smart-alerts/engine';

export default products.onProductChanged(async (event) => {
  try {
    await handleProductUpdated(event as never);
  } catch (err) {
    console.error('product-changed-v1 failed', err);
  }
});
