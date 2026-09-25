const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeHexColor(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  return HEX_COLOR.test(raw) ? raw : fallback;
}

export function safeUrl(value: unknown, fallback = ''): string {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {
    /* invalid */
  }
  return fallback;
}

export function isValidEmail(value: unknown): boolean {
  const s = String(value ?? '').trim();
  return s.length > 0 && s.length <= 254 && EMAIL_RE.test(s);
}

export function isValidE164Phone(value: unknown): boolean {
  const s = String(value ?? '').trim();
  if (!s) return true; // optional
  return E164_RE.test(s);
}

export function clampNonNegative(value: unknown, fallback: number, max = 1_000_000): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

export function clampPositiveInt(value: unknown, fallback: number, max = 1_000_000): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function sanitizeColorMap(
  colors: Record<string, unknown> | undefined,
  defaults: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  if (!colors) return out;
  for (const key of Object.keys(defaults)) {
    if (colors[key] != null) {
      out[key] = safeHexColor(colors[key], defaults[key]);
    }
  }
  return out;
}
