import { SITE_DEFAULT_MODULES } from '../../lib/defaults';
import { buttonCssString } from '../../../../lib/smart-alerts/storefront-styles';

export const DEFAULT_MODULES = SITE_DEFAULT_MODULES;

export const DEFAULT_BUTTON = {
  label: 'Notify Me',
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  borderWidth: 0,
  borderRadius: 0,
  widthMode: 'full' as 'auto' | 'full' | 'custom',
  customWidth: '200px',
  fontSize: 14,
  fontWeight: 600,
  paddingX: 48,
  paddingY: 15,
};

export const DEFAULT_APPEARANCE = {
  timerStyle: 'pill' as string,
  timerTheme: 'solid' as string,
  timerPrefix: 'Back in stock in' as string,
  timerShowSeconds: true as boolean,
  timerPulse: true as boolean,
  timerShowIcon: true as boolean,
  stockThreshold: 10,
  lowStockMessage: 'Only {x} left' as string,
  colors: {
    primary: '#0F766E',
    secondary: '#134E4A',
    accent: '#14B8A6',
    text: '#0F172A',
    background: '#FFFFFF',
    buttonText: '#FFFFFF',
    badge: '#000000',
    timer: '#000000',
    muted: '#64748B',
    inputBackground: '#FFFFFF',
    inputText: '#0F172A',
    inputBorder: '#134E4A',
    label: '#64748B',
  },
  buttons: {
    notifyMe: {
      ...DEFAULT_BUTTON,
      label: 'Notify Me',
    },
    priceDrop: {
      ...DEFAULT_BUTTON,
      label: 'Watch for price drop',
    },
    modalSubmit: {
      ...DEFAULT_BUTTON,
      label: 'Subscribe',
      widthMode: 'full' as const,
    },
  },
  modal: {
    borderRadius: 0,
    borderWidth: 1,
    padding: 48,
    maxWidth: 575,
    titleFontSize: 22,
    descriptionFontSize: 15,
    labelFontSize: 14,
    inputBorderRadius: 0,
    inputBorderWidth: 1,
    inputPadding: 15,
    notifyTitle: 'Notify me when back in stock',
    notifyDescription: "We'll email you when this product is available again.",
    priceTitle: 'Watch for price drop',
    priceDescription: 'Get an email when the price of this product drops.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'WhatsApp (optional)',
    phonePlaceholder: '+1…',
    notifyConsentLabel: 'I agree to receive stock alerts for this product.',
    priceConsentLabel: 'Send me a price-drop alert.',
    notifySuccessTitle: "You're subscribed!",
    notifySuccessDescription: "We'll email you when it's back in stock.",
    priceSuccessTitle: "You're watching this price!",
    priceSuccessDescription: "We'll email you if the price drops.",
    successAutoCloseMs: 2500,
  },
};

export type ButtonStyle = typeof DEFAULT_BUTTON;

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export function safeColor(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  return HEX_COLOR.test(raw) ? raw : fallback;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buttonCss(btn: ButtonStyle, opts?: { forceFullWidth?: boolean }): string {
  return buttonCssString(
    {
      ...btn,
      backgroundColor: safeColor(btn.backgroundColor, '#000000'),
      textColor: safeColor(btn.textColor, '#FFFFFF'),
      borderColor: safeColor(btn.borderColor, '#FFFFFF'),
    },
    { forceFullWidth: opts?.forceFullWidth },
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return `rgba(0, 0, 0, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex: string, percent: number): string {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return '#000000';
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 255) * (1 - percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function isDarkColor(hex: string): boolean {
  let c = String(hex || '').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.45;
}

export function getTimerThemeTokens(theme: string, badge: string, buttonTextColor: string) {
  const safeBadge = badge || '#000000';
  const safeBtnText = buttonTextColor || '#FFFFFF';
  const isDarkBadge = isDarkColor(safeBadge);

  if (theme === 'solid') {
    const bg = isDarkBadge
      ? 'linear-gradient(135deg, #18181B 0%, #000000 100%)'
      : `linear-gradient(135deg, ${safeBadge} 0%, ${darkenHex(safeBadge, 18)} 100%)`;
    const border = isDarkBadge ? '1px solid #27272A' : `1px solid ${hexToRgba(safeBadge, 0.85)}`;
    const textCol = isDarkBadge ? '#FFFFFF' : safeBtnText;
    return {
      bg,
      border,
      textColor: textCol,
      numColor: textCol,
      labelColor: 'rgba(255, 255, 255, 0.8)',
      badgeShadow: isDarkBadge
        ? '0 4px 14px rgba(0, 0, 0, 0.25)'
        : `0 4px 14px ${hexToRgba(safeBadge, 0.3)}`,
      tileBg: 'rgba(255, 255, 255, 0.22)',
      tileBorder: '1px solid rgba(255, 255, 255, 0.35)',
      pulseColor: '#FFFFFF',
      separatorColor: 'rgba(255, 255, 255, 0.7)',
    };
  }

  if (theme === 'dark') {
    const accentCol = isDarkBadge ? '#FFFFFF' : safeBadge;
    return {
      bg: '#0F172A',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      textColor: '#F8FAFC',
      numColor: accentCol,
      labelColor: '#94A3B8',
      badgeShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      tileBg: '#1E293B',
      tileBorder: '1px solid rgba(255, 255, 255, 0.08)',
      pulseColor: accentCol,
      separatorColor: 'rgba(255, 255, 255, 0.4)',
    };
  }

  return {
    bg: hexToRgba(safeBadge, 0.08),
    border: `1.5px solid ${hexToRgba(safeBadge, 0.25)}`,
    textColor: safeBadge,
    numColor: safeBadge,
    labelColor: hexToRgba(safeBadge, 0.75),
    badgeShadow: `0 2px 10px ${hexToRgba(safeBadge, 0.08)}`,
    tileBg: hexToRgba(safeBadge, 0.1),
    tileBorder: `1px solid ${hexToRgba(safeBadge, 0.2)}`,
    pulseColor: safeBadge,
    separatorColor: hexToRgba(safeBadge, 0.6),
  };
}

export function mergeButtons(raw?: Partial<typeof DEFAULT_APPEARANCE.buttons>) {
  return {
    notifyMe: { ...DEFAULT_APPEARANCE.buttons.notifyMe, ...(raw?.notifyMe || {}) },
    priceDrop: { ...DEFAULT_APPEARANCE.buttons.priceDrop, ...(raw?.priceDrop || {}) },
    modalSubmit: { ...DEFAULT_APPEARANCE.buttons.modalSubmit, ...(raw?.modalSubmit || {}) },
  };
}

export function mergeModal(raw?: Partial<typeof DEFAULT_APPEARANCE.modal>) {
  return { ...DEFAULT_APPEARANCE.modal, ...(raw || {}) };
}
