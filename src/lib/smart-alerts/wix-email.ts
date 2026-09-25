import { emailTransmissions } from '@wix/email-transmissions';
import { auth } from '@wix/essentials';

export type WixEmailSendResult = {
  transmissionId: string;
  status: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function transmissionIdOf(result: any): string {
  return String(result?.emailTransmission?._id || result?._id || '');
}

function statusOf(result: any): string {
  return String(result?.emailTransmission?.status || result?.status || '');
}

function recipientFailure(result: any): string | null {
  const recipients =
    result?.emailTransmission?.toRecipients || result?.toRecipients || [];
  for (const r of recipients) {
    const reason = String(r?.failureReason || '').toUpperCase();
    if (reason && reason !== 'NONE' && reason !== 'UNDEFINED') {
      return reason;
    }
  }
  return null;
}

function formatWixError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const anyErr = err as Error & {
    details?: { applicationError?: { code?: string; description?: string } };
    response?: { data?: unknown; status?: number };
  };
  const app = anyErr.details?.applicationError;
  if (app?.code || app?.description) {
    return [app.code, app.description].filter(Boolean).join(': ');
  }
  const status = anyErr.response?.status;
  if (status) return `${err.message} (HTTP ${status})`;
  return err.message;
}

async function waitForProcessed(transmissionId: string): Promise<any> {
  const get = auth.elevate(emailTransmissions.getEmailTransmission);
  let last: any = null;
  for (let i = 0; i < 4; i++) {
    await sleep(800);
    last = await get(transmissionId);
    const status = statusOf({ emailTransmission: last }).toUpperCase();
    if (status === 'PROCESSED' || status === 'REJECTED') {
      return { emailTransmission: last };
    }
  }
  return last ? { emailTransmission: last } : null;
}

/**
 * Native Wix Email Transmissions (TRANSACTIONAL) via @wix/email-transmissions.
 * Requires SCOPE.DC-PROMOTE.EMAIL-MARKETING and site Email Marketing quota.
 */
export async function sendWixTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
  senderEmail?: string;
}): Promise<WixEmailSendResult> {
  const emailTransmission = {
    emailSubject: (opts.subject || 'Smart Alerts notification').trim().slice(0, 200) || 'Smart Alerts notification',
    emailHtmlContent: opts.html || '<p>Smart Alerts notification</p>',
    senderName: (opts.fromName || 'Smart Alerts').slice(0, 50),
    toRecipients: [{ emailAddress: opts.to }],
    type: 'TRANSACTIONAL' as const,
    ...(opts.replyTo ? { replyTo: { emailAddress: opts.replyTo } } : {}),
    ...(opts.senderEmail && opts.senderEmail !== opts.replyTo
      ? { senderEmailAddress: opts.senderEmail }
      : {}),
  };

  const send = auth.elevate(emailTransmissions.sendEmailTransmission);

  let result: any;
  try {
    result = await send(emailTransmission as any, {
      idempotencyKey: crypto.randomUUID(),
    });
  } catch (err) {
    throw new Error(
      `Wix email send failed: ${formatWixError(err)}. Enable Manage Email Marketing (SCOPE.DC-PROMOTE.EMAIL-MARKETING) and check site email quota.`,
    );
  }

  const id = transmissionIdOf(result);
  let status = statusOf(result).toUpperCase() || 'ACCEPTED';

  if (status === 'REJECTED') {
    const reasons = result?.emailTransmission?.rejectedOptions?.rejectionReasons;
    throw new Error(
      reasons?.length
        ? `Wix email rejected: ${reasons.join(', ')}`
        : 'Wix email transmission was rejected',
    );
  }

  if (!id) {
    console.error('[smart-alerts] unexpected Wix email response:', result);
    throw new Error(
      `Wix email API returned no transmission id (${JSON.stringify(result)?.slice(0, 300) || 'empty'}). Enable Manage Email Marketing and check site email quota.`,
    );
  }

  try {
    const settled = await waitForProcessed(id);
    if (settled) {
      status = statusOf(settled).toUpperCase() || status;
      if (status === 'REJECTED') {
        const reasons = settled?.emailTransmission?.rejectedOptions?.rejectionReasons;
        throw new Error(
          reasons?.length
            ? `Wix email rejected: ${reasons.join(', ')}`
            : 'Wix email transmission was rejected',
        );
      }
      const failure = recipientFailure(settled);
      if (failure) {
        throw new Error(`Wix email recipient failed: ${failure}`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Wix email')) throw err;
    console.warn('[smart-alerts] email transmission poll skipped:', err);
  }

  return { transmissionId: id, status: status || 'ACCEPTED' };
}
