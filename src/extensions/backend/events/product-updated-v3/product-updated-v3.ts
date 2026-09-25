import { productsV3 } from '@wix/stores';
import { handleProductUpdated } from '../../../../lib/smart-alerts/engine';

export default productsV3.onProductUpdated(async (event) => {
  try {
    await handleProductUpdated(event as never);
  } catch (err) {
    console.error('product-updated-v3 failed', err);
  }
});
