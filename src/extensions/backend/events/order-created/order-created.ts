import { orders } from '@wix/ecom';
import { handleOrderCreated } from '../../../../lib/smart-alerts/engine';

export default orders.onOrderCreated(async (event) => {
  try {
    await handleOrderCreated(event as never);
  } catch (err) {
    console.error('order-created failed', err);
  }
});
