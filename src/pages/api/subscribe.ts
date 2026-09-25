import type { APIRoute } from 'astro';
import { createSubscription, addWhatsappQueue } from '../../lib/smart-alerts/subscriptions';
import { getOrCreateConfig, isModuleEnabled } from '../../lib/smart-alerts/config';
import type { SubscriptionType } from '../../lib/smart-alerts/constants';
import { sendWhatsappViaTwilio } from '../../lib/smart-alerts/whatsapp';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const subscriptionType = body.subscriptionType as SubscriptionType;
    if (!['back_in_stock', 'price_drop'].includes(subscriptionType)) {
      return Response.json({ error: 'Invalid subscriptionType' }, { status: 400 });
    }

    const config = await getOrCreateConfig();
    if (subscriptionType === 'back_in_stock' && !isModuleEnabled(config, 'backInStock')) {
      return Response.json({ error: 'Back in stock is disabled' }, { status: 403 });
    }
    if (subscriptionType === 'price_drop' && !isModuleEnabled(config, 'priceDrop')) {
      return Response.json({ error: 'Price drop is disabled' }, { status: 403 });
    }

    const sub = await createSubscription({
      productId: body.productId,
      variantId: body.variantId,
      productName: body.productName,
      productUrl: body.productUrl,
      productImage: body.productImage,
      subscriptionType,
      email: body.email,
      phone: body.phone,
      consent: Boolean(body.consent),
      watchedPrice: body.watchedPrice,
    });

    if (body.phone && isModuleEnabled(config, 'manualWhatsapp')) {
      const message = `Hi! I'm interested in ${body.productName || 'your product'}.`;
      if (config.whatsappSetup?.mode === 'api') {
        const sent = await sendWhatsappViaTwilio({
          to: body.phone,
          body: message,
          productId: body.productId,
          alertType: 'whatsapp',
        });
        if (!sent) {
          await addWhatsappQueue({
            phone: body.phone,
            productId: body.productId,
            productName: body.productName,
            email: body.email,
            message,
          });
        }
      } else {
        await addWhatsappQueue({
          phone: body.phone,
          productId: body.productId,
          productName: body.productName,
          email: body.email,
          message,
        });
      }
    }

    return Response.json({
      ok: true,
      id: sub._id,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to subscribe' },
      { status: 400 },
    );
  }
};
