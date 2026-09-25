import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { COLLECTIONS } from './constants';
import { getOrCreateConfig, updateConfig } from './config';
import { canNotifyCustomer, logAlert } from './email';

async function getSecret(name: string): Promise<string | undefined> {
  try {
    const { secrets } = await import('@wix/secrets');
    const elevated = auth.elevate(secrets.getSecretValue);
    const result = await elevated(name);
    return (result as { value?: string })?.value || (result as unknown as string);
  } catch {
    return process.env[name] as string | undefined;
  }
}

export async function getTwilioCredentials() {
  const accountSid = await getSecret('TWILIO_ACCOUNT_SID');
  const authToken = await getSecret('TWILIO_AUTH_TOKEN');
  const fromNumber =
    (await getSecret('TWILIO_WHATSAPP_FROM')) ||
    (await getOrCreateConfig()).whatsappSetup?.senderPhone ||
    '';
  return { accountSid, authToken, fromNumber };
}

export async function testWhatsappConnection(): Promise<{
  ok: boolean;
  status: 'connected' | 'disconnected' | 'error';
  message: string;
}> {
  const { accountSid, authToken, fromNumber } = await getTwilioCredentials();
  if (!accountSid || !authToken) {
    const current = await getOrCreateConfig();
    await updateConfig({
      whatsappSetup: {
        ...current.whatsappSetup,
        connectionStatus: 'disconnected',
        lastError: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN secrets missing',
        provider: 'twilio',
      },
    });
    return {
      ok: false,
      status: 'disconnected',
      message: 'Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Wix Secrets',
    };
  }
  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { Authorization: `Basic ${authHeader}` },
    });
    const current = await getOrCreateConfig();
    if (!res.ok) {
      const text = await res.text();
      await updateConfig({
        whatsappSetup: {
          ...current.whatsappSetup,
          connectionStatus: 'error',
          lastError: text.slice(0, 200),
          provider: 'twilio',
          mode: 'api',
        },
      });
      return { ok: false, status: 'error', message: `Twilio auth failed (${res.status})` };
    }
    await updateConfig({
      whatsappSetup: {
        ...current.whatsappSetup,
        connectionStatus: 'connected',
        lastError: '',
        provider: 'twilio',
        mode: 'api',
        senderPhone: fromNumber || current.whatsappSetup.senderPhone,
      },
    });
    return {
      ok: true,
      status: 'connected',
      message: fromNumber ? `Connected (from ${fromNumber})` : 'Connected — set sender phone',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const current = await getOrCreateConfig();
    await updateConfig({
      whatsappSetup: {
        ...current.whatsappSetup,
        connectionStatus: 'error',
        lastError: message,
        provider: 'twilio',
      },
    });
    return { ok: false, status: 'error', message };
  }
}

export async function sendWhatsappViaTwilio(opts: {
  to: string;
  body: string;
  productId?: string;
  alertType?: string;
}): Promise<boolean> {
  const config = await getOrCreateConfig();
  const customer = await canNotifyCustomer(opts.to, 'whatsapp', config);
  if (!customer.ok) {
    await logAlert({
      alertType: opts.alertType || 'whatsapp',
      channel: 'whatsapp',
      to: opts.to,
      status: 'skipped',
      productId: opts.productId,
      errorMessage: customer.reason,
    });
    return false;
  }

  const { accountSid, authToken, fromNumber } = await getTwilioCredentials();
  const from = fromNumber || config.whatsappSetup.senderPhone;
  if (!accountSid || !authToken || !from) {
    await logAlert({
      alertType: opts.alertType || 'whatsapp',
      channel: 'whatsapp',
      to: opts.to,
      status: 'failed',
      productId: opts.productId,
      errorMessage: 'Twilio credentials or sender phone missing',
    });
    return false;
  }

  const toWa = opts.to.startsWith('whatsapp:') ? opts.to : `whatsapp:${opts.to}`;
  const fromWa = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const body = new URLSearchParams({ To: toWa, From: fromWa, Body: opts.body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      await logAlert({
        alertType: opts.alertType || 'whatsapp',
        channel: 'whatsapp',
        to: opts.to,
        status: 'failed',
        productId: opts.productId,
        errorMessage: text.slice(0, 300),
      });
      return false;
    }
    await logAlert({
      alertType: opts.alertType || 'whatsapp',
      channel: 'whatsapp',
      to: opts.to,
      status: 'sent',
      productId: opts.productId,
    });
    return true;
  } catch (err) {
    await logAlert({
      alertType: opts.alertType || 'whatsapp',
      channel: 'whatsapp',
      to: opts.to,
      status: 'failed',
      productId: opts.productId,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

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
