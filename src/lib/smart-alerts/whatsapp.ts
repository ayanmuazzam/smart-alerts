import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { COLLECTIONS } from './constants';
import { logAlert } from './email';

/** Mark a manual wa.me queue row as sent and log the audit entry. */
export async function markWhatsappSent(id: string) {
  const get = auth.elevate(items.get);
  const item = await get(COLLECTIONS.whatsappQueue, id);
  if (!item) throw new Error('WhatsApp queue item not found');
  const update = auth.elevate(items.update);
  await update(COLLECTIONS.whatsappQueue, { ...item, status: 'sent' });
  await logAlert({
    alertType: 'whatsapp',
    channel: 'whatsapp',
    to: String(item.phone || ''),
    status: 'sent',
    productId: String(item.productId || ''),
  });
}
