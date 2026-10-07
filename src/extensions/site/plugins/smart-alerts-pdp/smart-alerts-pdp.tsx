import { fetchAppApi } from '../../lib/fetch-app-api';
import { SITE_DEFAULT_MODULES } from '../../lib/defaults';
import {
  SF,
  buttonCssString,
  modalInputCssString,
  modalShellCssString,
  pxNum,
} from '../../../../lib/smart-alerts/storefront-styles';

/** Inline appearance defaults — avoid importing app backend libs into the site plugin bundle. */
const DEFAULT_MODULES = SITE_DEFAULT_MODULES;

const DEFAULT_BUTTON = {
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

const DEFAULT_APPEARANCE = {
  timerStyle: 'pill' as string,
  timerTheme: 'solid' as string,
  timerPrefix: 'Back in stock in' as string,
  timerShowSeconds: true as boolean,
  timerPulse: true as boolean,
  timerShowIcon: true as boolean,
  stockThreshold: 10,
  colors: {
    primary: '#0F766E',
    secondary: '#134E4A',
    accent: '#14B8A6',
    text: '#0F172A',
    background: '#FFFFFF',
    buttonText: '#FFFFFF',
    badge: '#000000',
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

type ButtonStyle = typeof DEFAULT_BUTTON;

function buttonCss(btn: ButtonStyle, opts?: { forceFullWidth?: boolean }): string {
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

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
function safeColor(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  return HEX_COLOR.test(raw) ? raw : fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0, 0, 0, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, percent: number): string {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return '#000000';
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 255) * (1 - percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function isDarkColor(hex: string): boolean {
  let c = String(hex || '').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.45;
}

function getTimerThemeTokens(theme: string, badge: string, buttonTextColor: string) {
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
      badgeShadow: isDarkBadge ? '0 4px 14px rgba(0, 0, 0, 0.25)' : `0 4px 14px ${hexToRgba(safeBadge, 0.3)}`,
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

function mergeButtons(raw?: Partial<typeof DEFAULT_APPEARANCE.buttons>) {
  return {
    notifyMe: { ...DEFAULT_APPEARANCE.buttons.notifyMe, ...(raw?.notifyMe || {}) },
    priceDrop: { ...DEFAULT_APPEARANCE.buttons.priceDrop, ...(raw?.priceDrop || {}) },
    modalSubmit: { ...DEFAULT_APPEARANCE.buttons.modalSubmit, ...(raw?.modalSubmit || {}) },
  };
}

function mergeModal(raw?: Partial<typeof DEFAULT_APPEARANCE.modal>) {
  return { ...DEFAULT_APPEARANCE.modal, ...(raw || {}) };
}

type ProductView = {
  name: string;
  inStock: boolean;
  quantity: number | null;
  price: number;
  url: string;
  image: string;
  productId: string;
  variantId: string;
};

type ContextView = {
  product: ProductView;
  modules: Record<string, boolean>;
  appearance: typeof DEFAULT_APPEARANCE & {
    colors: Record<string, string>;
    buttons: typeof DEFAULT_APPEARANCE.buttons;
    modal: typeof DEFAULT_APPEARANCE.modal;
  };
  override: {
    restockAt?: string;
    lowStockThreshold?: number;
    useGlobalThreshold?: boolean;
  } | null;
  globalLowStockThreshold: number;
};

async function loadContext(
  endpoint: (path: string) => string,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>,
  productId: string,
  variantId: string,
): Promise<ContextView | null> {
  const qs = new URLSearchParams({ productId });
  if (variantId) qs.set('variantId', variantId);
  const res = await apiFetch(`/api/product-context?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`product-context failed (${res.status})`);
  }
  const json = await res.json();
  const snapshot = json.product;
  if (!snapshot?.productId) return null;

  return {
    product: {
      productId: snapshot.productId,
      variantId: snapshot.variantId || variantId || '',
      name: snapshot.name || '',
      url: snapshot.url || '',
      image: snapshot.image || '',
      price: Number(snapshot.price || 0),
      inStock: Boolean(snapshot.inStock),
      quantity: snapshot.quantity != null ? Number(snapshot.quantity) : null,
    },
    modules: { ...DEFAULT_MODULES, ...(json.modules || {}) },
    appearance: {
      ...DEFAULT_APPEARANCE,
      ...(json.appearance || {}),
      colors: { ...DEFAULT_APPEARANCE.colors, ...(json.appearance?.colors || {}) },
      buttons: mergeButtons(json.appearance?.buttons),
      modal: mergeModal(json.appearance?.modal),
    },
    override: json.override
      ? {
          restockAt: json.override.restockAt
            ? String(json.override.restockAt)
            : undefined,
          lowStockThreshold:
            json.override.lowStockThreshold != null
              ? Number(json.override.lowStockThreshold)
              : undefined,
          useGlobalThreshold: json.override.useGlobalThreshold,
        }
      : null,
    globalLowStockThreshold: Number(json.globalLowStockThreshold ?? 5),
  };
}

class SmartAlertsPdp extends HTMLElement {
  static get observedAttributes() {
    return ['product-id', 'selected-variant-id'];
  }

  private root: HTMLDivElement | null = null;
  private loading = false;
  private lastProductId = '';
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private successCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    if (!this.root) {
      this.root = document.createElement('div');
      this.appendChild(this.root);
    }
    void this.refresh();
  }

  attributeChangedCallback(name: string) {
    if (name === 'product-id' || name === 'selected-variant-id') {
      void this.refresh();
    }
  }

  disconnectedCallback() {
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    if (this.successCloseTimer) {
      clearTimeout(this.successCloseTimer);
      this.successCloseTimer = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    document.body.style.overflow = '';
  }

  private endpoint(path: string): string {
    return new URL(path, import.meta.url).href;
  }

  private async apiFetch(pathAndQuery: string, init?: RequestInit): Promise<Response> {
    // Do not use httpClient.fetchWithAuth here — it adds x-wix-linguist and
    // app-host CORS rejects that header from the storefront origin.
    return fetchAppApi(this.endpoint(pathAndQuery), init);
  }

  private async refresh() {
    const productId = this.getAttribute('product-id') || '';
    if (!productId || !this.root) return;
    if (this.loading && this.lastProductId === productId) return;
    this.loading = true;
    this.lastProductId = productId;
    const variantId = this.getAttribute('selected-variant-id') || '';

    try {
      const ctx = await loadContext(
        (p) => this.endpoint(p),
        (p, init) => this.apiFetch(p, init),
        productId,
        variantId,
      );
      if (!ctx) {
        this.root.innerHTML =
          '<div style="font-size:12px;color:#64748B;margin:8px 0;">Alerts unavailable for this product.</div>';
        return;
      }
      this.render(ctx);
    } catch (err) {
      console.error('[smart-alerts-pdp]', err);
      // Last-resort: still show subscribe UI with defaults so OAuth/API issues
      // do not blank the storefront widget.
      try {
        this.render({
          product: {
            productId,
            variantId,
            name: 'Product',
            url: location.href,
            image: '',
            price: 0,
            inStock: false,
            quantity: null,
          },
          modules: { ...DEFAULT_MODULES },
          appearance: {
            ...DEFAULT_APPEARANCE,
            colors: { ...DEFAULT_APPEARANCE.colors },
            buttons: mergeButtons(),
            modal: mergeModal(),
          },
          override: null,
          globalLowStockThreshold: 5,
        });
      } catch (renderErr) {
        console.error('[smart-alerts-pdp] fallback render failed', renderErr);
        if (this.root) {
          this.root.innerHTML =
            '<div style="font-size:12px;color:#b91c1c;margin:8px 0;">Alerts temporarily unavailable.</div>';
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private render(data: ContextView) {
    if (!this.root) return;

    const colors = data.appearance?.colors || {};
    const primary = safeColor(colors.primary, '#0F766E');
    const buttonText = safeColor(colors.buttonText, '#fff');
    const badge = safeColor(colors.badge, '#000000');
    const muted = safeColor(colors.muted, '#64748B');
    const text = safeColor(colors.text, '#0F172A');
    const background = safeColor(colors.background, '#FFFFFF');
    // Border & Accents (secondary) drives modal shell + field borders.
    const border = safeColor(colors.secondary, '#134E4A');
    const labelColor = safeColor(colors.label, muted);
    const inputBg = safeColor(colors.inputBackground, '#FFFFFF');
    const inputText = safeColor(colors.inputText, text);
    const inputBorder = border;
    const buttons = mergeButtons(data.appearance?.buttons);
    const modal = mergeModal(data.appearance?.modal);
    const notifyBtn = buttons.notifyMe;
    const priceBtn = buttons.priceDrop;
    const submitBtn = buttons.modalSubmit;
    const parts: string[] = [];
    const showPhone = Boolean(data.modules.manualWhatsapp);

    const inputCss = modalInputCssString(modal, {
      background: inputBg,
      color: inputText,
      borderColor: inputBorder,
    });
    const labelCss = `display:block;font-size:${pxNum(modal.labelFontSize, SF.labelFontSize)}px;margin-bottom:4px;color:${labelColor};`;
    const modalShellCss = modalShellCssString(modal, {
      background,
      color: text,
      borderColor: border,
    });

    const qty = data.product.quantity;
    const threshold =
      data.override?.useGlobalThreshold === false && data.override?.lowStockThreshold != null
        ? data.override.lowStockThreshold
        : (data.appearance?.stockThreshold ?? data.globalLowStockThreshold);
    if (data.modules.stockCounter && qty != null && qty > 0 && qty <= threshold) {
      parts.push(
        `<div style="margin:8px 0;font-weight:600;color:${badge};">Only ${qty} left</div>`,
      );
    }

    if (data.modules.restockCountdown && data.override?.restockAt) {
      const target = new Date(data.override.restockAt).getTime();
      const ms = Math.max(0, target - Date.now());
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      const secs = Math.floor((ms % 60000) / 1000);

      const style = data.appearance?.timerStyle || 'pill';
      const theme = data.appearance?.timerTheme || 'solid';
      const prefix = data.appearance?.timerPrefix ?? 'Back in stock in';
      const showSecs = data.appearance?.timerShowSeconds !== false;
      const showPulse = data.appearance?.timerPulse !== false;
      const showIcon = data.appearance?.timerShowIcon !== false;

      const styles = getTimerThemeTokens(theme, badge, buttonText);

      const pulseDotHtml = showPulse
        ? `<span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px;flex-shrink:0;">
            <span style="position:absolute;width:18px;height:18px;border-radius:50%;background:${styles.pulseColor};opacity:0.45;animation:sa-timer-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <span style="position:relative;width:8px;height:8px;border-radius:50%;background:${styles.pulseColor};"></span>
          </span>`
        : '';

      const iconHtml = showIcon
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${styles.numColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;flex-shrink:0;" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
        : '';

      const hoursFormatted = hours < 10 ? '0' + hours : String(hours);
      const minsFormatted = mins < 10 ? '0' + mins : String(mins);
      const secsFormatted = secs < 10 ? '0' + secs : String(secs);

      let timerHtml = '';

      if (style === 'blocks') {
        const isSolid = theme === 'solid';
        const isDark = theme === 'dark';
        const isDarkBadge = isDarkColor(badge);

        const blockHeaderColor = isSolid || isDark ? '#1E293B' : badge;
        const blockPulseColor = isDark && isDarkBadge ? '#FFFFFF' : badge;
        const blockIconColor = isSolid ? (isDarkBadge ? '#FFFFFF' : badge) : styles.numColor;

        const blockTileBg = isSolid
          ? (isDarkBadge ? 'linear-gradient(135deg, #18181B 0%, #000000 100%)' : `linear-gradient(135deg, ${badge} 0%, ${darkenHex(badge, 14)} 100%)`)
          : isDark
            ? '#0F172A'
            : hexToRgba(badge, 0.08);

        const blockTileBorder = isSolid
          ? (isDarkBadge ? '1px solid #27272A' : `1px solid ${darkenHex(badge, 22)}`)
          : isDark
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : `1.5px solid ${hexToRgba(badge, 0.25)}`;

        const blockNumColor = isSolid
          ? '#FFFFFF'
          : isDark
            ? (isDarkBadge ? '#FFFFFF' : badge)
            : badge;

        const blockLabelColor = isSolid
          ? 'rgba(255, 255, 255, 0.85)'
          : isDark
            ? '#94A3B8'
            : hexToRgba(badge, 0.75);

        const blockSeparatorColor = isSolid
          ? (isDarkBadge ? '#0F172A' : badge)
          : isDark
            ? '#64748B'
            : hexToRgba(badge, 0.6);

        const blockTileShadow = isSolid
          ? (isDarkBadge ? '0 3px 10px rgba(0, 0, 0, 0.35)' : `0 3px 10px ${hexToRgba(badge, 0.35)}`)
          : isDark
            ? '0 3px 8px rgba(0, 0, 0, 0.25)'
            : `0 2px 6px ${hexToRgba(badge, 0.08)}`;

        const blockPulseDotHtml = showPulse
          ? `<span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px;flex-shrink:0;">
              <span style="position:absolute;width:18px;height:18px;border-radius:50%;background:${blockPulseColor};opacity:0.45;animation:sa-timer-ping 1.6s cubic-bezier(0,0,0,2) infinite;"></span>
              <span style="position:relative;width:8px;height:8px;border-radius:50%;background:${blockPulseColor};"></span>
            </span>`
          : '';

        const blockIconHtml = showIcon
          ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${blockIconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;flex-shrink:0;" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
          : '';

        const headerBits = [
          blockPulseDotHtml,
          blockIconHtml,
          `<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${blockHeaderColor};">${escapeHtml(prefix || 'Restock Expected In')}</span>`,
        ].filter(Boolean).join('');

        const secsBlockHtml = showSecs
          ? `<span style="font-size:15px;font-weight:800;color:${blockSeparatorColor};">:</span>
             <div style="min-width:44px;padding:6px 8px;border-radius:8px;background:${blockTileBg};border:${blockTileBorder};text-align:center;box-shadow:${blockTileShadow};">
               <div data-sa-secs style="font-size:16px;font-weight:800;line-height:1.1;color:${blockNumColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${secsFormatted}</div>
               <div style="font-size:8.5px;font-weight:700;letter-spacing:0.5px;color:${blockLabelColor};margin-top:2px;">SECS</div>
             </div>`
          : '';

        timerHtml = `
          <div style="display:inline-flex;flex-direction:column;gap:6px;">
            ${headerBits ? `<div style="display:flex;align-items:center;gap:6px;">${headerBits}</div>` : ''}
            <div style="display:inline-flex;align-items:center;gap:5px;">
              <div style="min-width:44px;padding:6px 8px;border-radius:8px;background:${blockTileBg};border:${blockTileBorder};text-align:center;box-shadow:${blockTileShadow};">
                <div data-sa-hours style="font-size:16px;font-weight:800;line-height:1.1;color:${blockNumColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${hoursFormatted}</div>
                <div style="font-size:8.5px;font-weight:700;letter-spacing:0.5px;color:${blockLabelColor};margin-top:2px;">HOURS</div>
              </div>
              <span style="font-size:15px;font-weight:800;color:${blockSeparatorColor};">:</span>
              <div style="min-width:44px;padding:6px 8px;border-radius:8px;background:${blockTileBg};border:${blockTileBorder};text-align:center;box-shadow:${blockTileShadow};">
                <div data-sa-mins style="font-size:16px;font-weight:800;line-height:1.1;color:${blockNumColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${minsFormatted}</div>
                <div style="font-size:8.5px;font-weight:700;letter-spacing:0.5px;color:${blockLabelColor};margin-top:2px;">MINS</div>
              </div>
              ${secsBlockHtml}
            </div>
          </div>
        `;
      } else if (style === 'banner') {
        const secsCapsuleHtml = showSecs
          ? `<span style="font-weight:800;opacity:0.6;color:${styles.numColor};">:</span>
             <span data-sa-secs style="padding:4px 8px;border-radius:6px;background:${styles.tileBg};border:${styles.tileBorder};font-size:12.5px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${secsFormatted}s</span>`
          : '';

        timerHtml = `
          <div style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;background:${styles.bg};border:${styles.border};color:${styles.textColor};box-shadow:${styles.badgeShadow};display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${pulseDotHtml}
              ${iconHtml}
              <div>
                <div style="font-size:12.5px;font-weight:700;letter-spacing:0.2px;">${escapeHtml(prefix || 'Restock Expected In')}</div>
                <div style="font-size:10.5px;opacity:0.75;margin-top:1px;">Limited inventory returning soon</div>
              </div>
            </div>
            <div style="display:inline-flex;align-items:center;gap:4px;">
              <span data-sa-hours style="padding:4px 8px;border-radius:6px;background:${styles.tileBg};border:${styles.tileBorder};font-size:12.5px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${hours}h</span>
              <span style="font-weight:800;opacity:0.6;color:${styles.numColor};">:</span>
              <span data-sa-mins style="padding:4px 8px;border-radius:6px;background:${styles.tileBg};border:${styles.tileBorder};font-size:12.5px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${mins}m</span>
              ${secsCapsuleHtml}
            </div>
          </div>
        `;
      } else if (style === 'card') {
        const secsCardBlock = showSecs
          ? `<span style="font-size:15px;font-weight:800;color:${styles.separatorColor};">:</span>
             <div style="text-align:center;min-width:44px;padding:5px 6px;border-radius:8px;background:${styles.tileBg};border:${styles.tileBorder};">
               <div data-sa-secs style="font-size:16px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${secsFormatted}</div>
               <div style="font-size:8px;font-weight:700;color:${styles.labelColor};letter-spacing:0.5px;">SECS</div>
             </div>`
          : '';

        timerHtml = `
          <div style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;background:${styles.bg};border:${styles.border};color:${styles.textColor};box-shadow:${styles.badgeShadow};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:6px;">
                ${pulseDotHtml}
                ${iconHtml}
                <span style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(prefix || 'Restock Countdown')}</span>
              </div>
              <span style="font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:${styles.tileBg};color:${styles.numColor};border:${styles.tileBorder};text-transform:uppercase;letter-spacing:0.5px;">High Demand</span>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;gap:6px;margin:4px 0 8px;">
              <div style="text-align:center;min-width:44px;padding:5px 6px;border-radius:8px;background:${styles.tileBg};border:${styles.tileBorder};">
                <div data-sa-hours style="font-size:16px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${hoursFormatted}</div>
                <div style="font-size:8px;font-weight:700;color:${styles.labelColor};letter-spacing:0.5px;">HOURS</div>
              </div>
              <span style="font-size:15px;font-weight:800;color:${styles.separatorColor};">:</span>
              <div style="text-align:center;min-width:44px;padding:5px 6px;border-radius:8px;background:${styles.tileBg};border:${styles.tileBorder};">
                <div data-sa-mins style="font-size:16px;font-weight:800;color:${styles.numColor};font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${minsFormatted}</div>
                <div style="font-size:8px;font-weight:700;color:${styles.labelColor};letter-spacing:0.5px;">MINS</div>
              </div>
              ${secsCardBlock}
            </div>
            <div style="font-size:10.5px;opacity:0.75;text-align:center;">Subscribers get first access upon warehouse arrival</div>
          </div>
        `;
      } else {
        // Pill
        const timeDigits = `${hours}h ${mins}m${showSecs ? ` ${secsFormatted}s` : ''}`;
        timerHtml = `
          <div style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:${styles.bg};border:${styles.border};color:${styles.textColor};box-shadow:${styles.badgeShadow};font-size:12.5px;font-weight:600;letter-spacing:0.2px;">
            ${pulseDotHtml}
            ${iconHtml}
            ${prefix ? `<span style="opacity:0.85;font-size:11.5px;font-weight:600;">${escapeHtml(prefix)}</span>` : ''}
            <span data-sa-time style="font-weight:800;color:${styles.numColor};letter-spacing:0.3px;font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${timeDigits}</span>
          </div>
        `;
      }

      parts.push(`
        <div id="sa-restock-timer" data-target="${target}" data-show-secs="${showSecs ? '1' : '0'}" style="margin:8px 0;">
          <style>
            @keyframes sa-timer-ping {
              0% { transform: scale(1); opacity: 0.8; }
              75%, 100% { transform: scale(2.4); opacity: 0; }
            }
          </style>
          ${timerHtml}
        </div>
      `);
    }

    const phoneFieldBis = showPhone
      ? `<label style="${labelCss}">${escapeHtml(modal.phoneLabel)}</label>
         <input id="sa-phone" type="tel" placeholder="${escapeHtml(modal.phonePlaceholder)}" style="${inputCss}" />`
      : '';

    const successIconCss = [
      'width:52px',
      'height:52px',
      'border-radius:50%',
      `background:${primary}22`,
      `color:${primary}`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:28px',
      'font-weight:700',
      'line-height:1',
      'margin:0 auto 12px',
    ].join(';');
    const successWrapCss =
      'display:none;flex-direction:column;align-items:center;text-align:center;padding:8px 4px 4px;';

    if (!data.product.inStock && data.modules.backInStock) {
      parts.push(`
        <div style="margin:12px 0;">
          <button id="sa-bis-open" type="button" style="${buttonCss(notifyBtn)}">
            ${escapeHtml(notifyBtn.label || 'Notify me')}
          </button>
        </div>
        <div id="sa-bis-modal" hidden style="position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
          <div id="sa-bis-backdrop" style="position:absolute;inset:0;background:rgba(15,23,42,0.45);"></div>
          <div role="dialog" aria-modal="true" aria-labelledby="sa-bis-title" style="${modalShellCss}">
            <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
              <button id="sa-bis-close" type="button" aria-label="Close" style="background:transparent;border:0;color:${muted};font-size:22px;line-height:1;cursor:pointer;padding:0 2px;">×</button>
            </div>
            <div id="sa-bis-form">
              <div id="sa-bis-title" style="font-weight:700;font-size:${pxNum(modal.titleFontSize, SF.titleFontSize)}px;color:${text};margin-bottom:8px;">${escapeHtml(modal.notifyTitle)}</div>
              <p style="margin:0 0 14px;font-size:${pxNum(modal.descriptionFontSize, SF.descriptionFontSize)}px;color:${muted};line-height:1.4;">${escapeHtml(modal.notifyDescription)}</p>
              <label style="${labelCss}">${escapeHtml(modal.emailLabel)}</label>
              <input id="sa-email" type="email" placeholder="${escapeHtml(modal.emailPlaceholder)}" style="${inputCss}" />
              ${phoneFieldBis}
              <label style="display:flex;gap:8px;align-items:flex-start;font-size:${pxNum(modal.labelFontSize, SF.labelFontSize)}px;margin-bottom:12px;color:${labelColor};">
                <input id="sa-consent" type="checkbox" style="accent-color:${primary};width:16px;height:16px;margin-top:2px;flex-shrink:0;" />
                <span>${escapeHtml(modal.notifyConsentLabel)}</span>
              </label>
              <button id="sa-bis" type="button" style="${buttonCss(submitBtn, { forceFullWidth: true })}">${escapeHtml(submitBtn.label || 'Subscribe')}</button>
              <div id="sa-msg" style="font-size:12px;margin-top:8px;color:${muted};" role="status"></div>
            </div>
            <div id="sa-bis-success" style="${successWrapCss}" role="status" aria-live="polite">
              <div style="${successIconCss}" aria-hidden="true">✓</div>
              <div id="sa-bis-success-title" style="font-weight:700;font-size:${pxNum(modal.titleFontSize, SF.titleFontSize)}px;color:${text};margin-bottom:8px;">${escapeHtml(modal.notifySuccessTitle)}</div>
              <p id="sa-bis-success-desc" style="margin:0;font-size:${pxNum(modal.descriptionFontSize, SF.descriptionFontSize)}px;color:${muted};line-height:1.45;">${escapeHtml(modal.notifySuccessDescription)}</p>
            </div>
          </div>
        </div>
      `);
    }

    if (data.product.inStock && data.modules.priceDrop) {
      parts.push(`
        <div style="margin:12px 0;">
          <button id="sa-price" type="button" style="${buttonCss(priceBtn)}">
            ${escapeHtml(priceBtn.label || 'Watch for price drop')}
          </button>
        </div>
        <div id="sa-price-modal" hidden style="position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
          <div id="sa-price-backdrop" style="position:absolute;inset:0;background:rgba(15,23,42,0.45);"></div>
          <div role="dialog" aria-modal="true" aria-labelledby="sa-price-title" style="${modalShellCss}">
            <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
              <button id="sa-price-close" type="button" aria-label="Close" style="background:transparent;border:0;color:${muted};font-size:22px;line-height:1;cursor:pointer;padding:0 2px;">×</button>
            </div>
            <div id="sa-price-form">
              <div id="sa-price-title" style="font-weight:700;font-size:${pxNum(modal.titleFontSize, SF.titleFontSize)}px;color:${text};margin-bottom:8px;">${escapeHtml(modal.priceTitle)}</div>
              <p style="margin:0 0 14px;font-size:${pxNum(modal.descriptionFontSize, SF.descriptionFontSize)}px;color:${muted};line-height:1.4;">${escapeHtml(modal.priceDescription)}</p>
              <label style="${labelCss}">${escapeHtml(modal.emailLabel)}</label>
              <input id="sa-price-email" type="email" placeholder="${escapeHtml(modal.emailPlaceholder)}" style="${inputCss}" />
              ${
                showPhone
                  ? `<label style="${labelCss}">${escapeHtml(modal.phoneLabel)}</label>
                     <input id="sa-price-phone" type="tel" placeholder="${escapeHtml(modal.phonePlaceholder)}" style="${inputCss}" />`
                  : ''
              }
              <label style="display:flex;gap:8px;font-size:${pxNum(modal.labelFontSize, SF.labelFontSize)}px;margin-bottom:12px;color:${labelColor};align-items:flex-start;">
                <input id="sa-price-consent" type="checkbox" style="accent-color:${primary};width:16px;height:16px;margin-top:2px;flex-shrink:0;" />
                <span>${escapeHtml(modal.priceConsentLabel)}</span>
              </label>
              <button id="sa-price-submit" type="button" style="${buttonCss(submitBtn, { forceFullWidth: true })}">${escapeHtml(submitBtn.label || 'Subscribe')}</button>
              <div id="sa-price-msg" style="font-size:12px;margin-top:8px;color:${muted};" role="status"></div>
            </div>
            <div id="sa-price-success" style="${successWrapCss}" role="status" aria-live="polite">
              <div style="${successIconCss}" aria-hidden="true">✓</div>
              <div id="sa-price-success-title" style="font-weight:700;font-size:${pxNum(modal.titleFontSize, SF.titleFontSize)}px;color:${text};margin-bottom:8px;">${escapeHtml(modal.priceSuccessTitle)}</div>
              <p id="sa-price-success-desc" style="margin:0;font-size:${pxNum(modal.descriptionFontSize, SF.descriptionFontSize)}px;color:${muted};line-height:1.45;">${escapeHtml(modal.priceSuccessDescription)}</p>
            </div>
          </div>
        </div>
      `);
    }

    if (parts.length === 0) {
      parts.push(
        `<div style="font-size:12px;color:${muted};margin:8px 0;">Smart Alerts is ready on this product.</div>`,
      );
    }

    this.root.innerHTML = parts.join('');
    this.bindActions(data);
  }

  private bindActions(data: ContextView) {
    if (!this.root) return;
    const product = data.product;
    const modalCfg = mergeModal(data.appearance?.modal);
    const autoCloseMs = Math.max(1000, Number(modalCfg.successAutoCloseMs) || 2500);

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const timerEl = this.root.querySelector('#sa-restock-timer') as HTMLElement | null;
    if (timerEl && data.override?.restockAt) {
      const targetTime = new Date(data.override.restockAt).getTime();
      const showSecs = data.appearance?.timerShowSeconds !== false;
      const updateClock = () => {
        const remaining = Math.max(0, targetTime - Date.now());
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);

        const hEl = timerEl.querySelector('[data-sa-hours]');
        const mEl = timerEl.querySelector('[data-sa-mins]');
        const sEl = timerEl.querySelector('[data-sa-secs]');
        const timeEl = timerEl.querySelector('[data-sa-time]');

        const hStr = h < 10 ? '0' + h : String(h);
        const mStr = m < 10 ? '0' + m : String(m);
        const sStr = s < 10 ? '0' + s : String(s);

        if (hEl) hEl.textContent = hStr;
        if (mEl) mEl.textContent = mStr;
        if (sEl) sEl.textContent = sStr;
        if (timeEl) {
          timeEl.textContent = `${h}h ${m}m${showSecs ? ` ${sStr}s` : ''}`;
        }
      };
      this.timerInterval = setInterval(updateClock, 1000);
    }

    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    if (this.successCloseTimer) {
      clearTimeout(this.successCloseTimer);
      this.successCloseTimer = null;
    }

    this.root.querySelector('#sa-bis-open')?.addEventListener('click', () => {
      this.openModal('sa-bis-modal', '#sa-email');
    });
    this.root.querySelector('#sa-bis-close')?.addEventListener('click', () => {
      this.closeModal('sa-bis-modal');
    });
    this.root.querySelector('#sa-bis-backdrop')?.addEventListener('click', () => {
      this.closeModal('sa-bis-modal');
    });

    const bisBtn = this.root.querySelector('#sa-bis') as HTMLButtonElement | null;
    const priceSubmitBtn = this.root.querySelector('#sa-price-submit') as HTMLButtonElement | null;
    const notifyBtnLabel = bisBtn?.textContent || 'Notify me';
    const priceSubmitLabel = priceSubmitBtn?.textContent || 'Subscribe';

    bisBtn?.addEventListener('click', async () => {
      const btn = this.root!.querySelector('#sa-bis') as HTMLButtonElement | null;
      const email = String(
        (this.root!.querySelector('#sa-email') as HTMLInputElement | null)?.value || '',
      ).trim();
      const phone = String(
        (this.root!.querySelector('#sa-phone') as HTMLInputElement | null)?.value || '',
      ).trim();
      const consent = Boolean(
        (this.root!.querySelector('#sa-consent') as HTMLInputElement | null)?.checked,
      );
      const msg = this.root!.querySelector('#sa-msg') as HTMLElement | null;
      if (btn?.disabled) return;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = 'Enter a valid email';
        }
        return;
      }
      if (!consent) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = 'Consent is required';
        }
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Subscribing…';
      }
      if (msg) msg.textContent = '';
      try {
        const res = await this.apiFetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.variantId,
            subscriptionType: 'back_in_stock',
            email,
            phone: phone || undefined,
            consent,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Subscribe failed (' + res.status + ')');
        try {
          localStorage.setItem('sa_email', email);
        } catch {
          /* ignore */
        }
        this.showSubscribeSuccess('sa-bis', {
          title: modalCfg.notifySuccessTitle,
          description: modalCfg.notifySuccessDescription,
          autoCloseMs,
        });
      } catch (e) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = e instanceof Error ? e.message : 'Failed';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = notifyBtnLabel;
        }
      }
    });

    this.root.querySelector('#sa-price')?.addEventListener('click', () => {
      this.openModal('sa-price-modal', '#sa-price-email');
    });
    this.root.querySelector('#sa-price-close')?.addEventListener('click', () => {
      this.closeModal('sa-price-modal');
    });
    this.root.querySelector('#sa-price-backdrop')?.addEventListener('click', () => {
      this.closeModal('sa-price-modal');
    });

    priceSubmitBtn?.addEventListener('click', async () => {
      const btn = this.root!.querySelector('#sa-price-submit') as HTMLButtonElement | null;
      const email = String(
        (this.root!.querySelector('#sa-price-email') as HTMLInputElement | null)?.value || '',
      ).trim();
      const phone = String(
        (this.root!.querySelector('#sa-price-phone') as HTMLInputElement | null)?.value || '',
      ).trim();
      const consent = Boolean(
        (this.root!.querySelector('#sa-price-consent') as HTMLInputElement | null)?.checked,
      );
      const msg = this.root!.querySelector('#sa-price-msg') as HTMLElement | null;
      if (btn?.disabled) return;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = 'Enter a valid email';
        }
        return;
      }
      if (!consent) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = 'Consent is required';
        }
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Subscribing…';
      }
      if (msg) msg.textContent = '';
      try {
        const res = await this.apiFetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.variantId,
            subscriptionType: 'price_drop',
            email,
            phone: phone || undefined,
            consent,
            watchedPrice: product.price,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Subscribe failed (' + res.status + ')');
        try {
          localStorage.setItem('sa_email', email);
        } catch {
          /* ignore */
        }
        this.showSubscribeSuccess('sa-price', {
          title: modalCfg.priceSuccessTitle,
          description: modalCfg.priceSuccessDescription,
          autoCloseMs,
        });
      } catch (e) {
        if (msg) {
          msg.style.color = '#b91c1c';
          msg.textContent = e instanceof Error ? e.message : 'Failed';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = priceSubmitLabel;
        }
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      this.closeModal('sa-bis-modal');
      this.closeModal('sa-price-modal');
    };
    this.escHandler = onKeyDown;
    document.addEventListener('keydown', onKeyDown);
  }

  private showSubscribeSuccess(
    prefix: 'sa-bis' | 'sa-price',
    opts: { title: string; description: string; autoCloseMs: number },
  ) {
    const form = this.root?.querySelector(`#${prefix}-form`) as HTMLElement | null;
    const success = this.root?.querySelector(`#${prefix}-success`) as HTMLElement | null;
    const titleEl = this.root?.querySelector(`#${prefix}-success-title`) as HTMLElement | null;
    const descEl = this.root?.querySelector(`#${prefix}-success-desc`) as HTMLElement | null;
    if (titleEl) titleEl.textContent = opts.title;
    if (descEl) descEl.textContent = opts.description;
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'flex';
    if (this.successCloseTimer) clearTimeout(this.successCloseTimer);
    this.successCloseTimer = setTimeout(() => {
      this.successCloseTimer = null;
      this.closeModal(`${prefix}-modal`);
    }, opts.autoCloseMs);
  }

  private resetModalView(modalId: string) {
    const prefix = modalId === 'sa-bis-modal' ? 'sa-bis' : 'sa-price';
    const form = this.root?.querySelector(`#${prefix}-form`) as HTMLElement | null;
    const success = this.root?.querySelector(`#${prefix}-success`) as HTMLElement | null;
    const msg = this.root?.querySelector(
      prefix === 'sa-bis' ? '#sa-msg' : '#sa-price-msg',
    ) as HTMLElement | null;
    const btn = this.root?.querySelector(
      prefix === 'sa-bis' ? '#sa-bis' : '#sa-price-submit',
    ) as HTMLButtonElement | null;
    if (form) form.style.display = '';
    if (success) success.style.display = 'none';
    if (msg) msg.textContent = '';
    if (btn) {
      btn.disabled = false;
      // label restored from original HTML on full re-render; keep enabled for reopen
      if (btn.dataset.saLabel) btn.textContent = btn.dataset.saLabel;
    }
  }

  private openModal(modalId: string, focusSelector: string) {
    const modal = this.root?.querySelector(`#${modalId}`) as HTMLElement | null;
    if (!modal) return;
    if (this.successCloseTimer) {
      clearTimeout(this.successCloseTimer);
      this.successCloseTimer = null;
    }
    this.resetModalView(modalId);
    const btn = this.root?.querySelector(
      modalId === 'sa-bis-modal' ? '#sa-bis' : '#sa-price-submit',
    ) as HTMLButtonElement | null;
    if (btn && !btn.dataset.saLabel) {
      btn.dataset.saLabel = btn.textContent || '';
    }
    modal.hidden = false;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    (this.root?.querySelector(focusSelector) as HTMLInputElement | null)?.focus();
  }

  private closeModal(modalId: string) {
    const modal = this.root?.querySelector(`#${modalId}`) as HTMLElement | null;
    if (!modal) return;
    if (this.successCloseTimer) {
      clearTimeout(this.successCloseTimer);
      this.successCloseTimer = null;
    }
    modal.hidden = true;
    modal.style.display = 'none';
    this.resetModalView(modalId);
    const bisOpen = this.root?.querySelector('#sa-bis-modal') as HTMLElement | null;
    const priceOpen = this.root?.querySelector('#sa-price-modal') as HTMLElement | null;
    const anyOpen =
      (bisOpen && !bisOpen.hidden && bisOpen.style.display !== 'none') ||
      (priceOpen && !priceOpen.hidden && priceOpen.style.display !== 'none');
    if (!anyOpen) document.body.style.overflow = '';
  }
}

export default SmartAlertsPdp;
