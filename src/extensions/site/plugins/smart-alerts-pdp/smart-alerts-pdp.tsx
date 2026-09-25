import { items } from '@wix/data';
import { products, productsV3 } from '@wix/stores';
import { fetchAppApi } from '../../lib/fetch-app-api';

/** Inline defaults — avoid importing app backend libs into the site plugin bundle. */
const APP_NS = '@ayanmuazzam/us-smart-alerts';
const CONFIG_ID = 'site-config';
const COL_CONFIG = `${APP_NS}/config`;
const COL_OVERRIDES = `${APP_NS}/productOverrides`;

const DEFAULT_MODULES: Record<string, boolean> = {
  backInStock: true,
  priceDrop: true,
  manualWhatsapp: true,
  sellerOutOfStock: true,
  sellerLowStock: true,
  sellerNewOrder: true,
  digest: false,
  stockCounter: true,
  restockCountdown: false,
};

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
  stockThreshold: 10,
  colors: {
    primary: '#0F766E',
    secondary: '#134E4A',
    accent: '#14B8A6',
    text: '#0F172A',
    background: '#FFFFFF',
    buttonText: '#FFFFFF',
    badge: '#F59E0B',
    muted: '#64748B',
    inputBackground: '#FFFFFF',
    inputText: '#0F172A',
    inputBorder: '#E2E8F0',
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
    borderWidth: 0,
    padding: 48,
    maxWidth: 575,
    titleFontSize: 22,
    descriptionFontSize: 15,
    labelFontSize: 14,
    inputBorderRadius: 0,
    inputBorderWidth: 0,
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
  },
};

type ButtonStyle = typeof DEFAULT_BUTTON;

function resolveButtonWidth(btn: ButtonStyle): string {
  if (btn.widthMode === 'full') return '100%';
  if (btn.widthMode === 'custom' && btn.customWidth) return String(btn.customWidth);
  return 'auto';
}

function buttonCss(btn: ButtonStyle, overrides?: Partial<ButtonStyle>): string {
  const b = { ...btn, ...overrides };
  const width = resolveButtonWidth(b);
  return [
    `background:${b.backgroundColor}`,
    `color:${b.textColor}`,
    `border:${Number(b.borderWidth) || 0}px solid ${b.borderColor}`,
    `border-radius:${Number(b.borderRadius) || 0}px`,
    `padding:${Number(b.paddingY) || 0}px ${Number(b.paddingX) || 0}px`,
    `font-size:${Number(b.fontSize) || 14}px`,
    `font-weight:${Number(b.fontWeight) || 600}`,
    `width:${width}`,
    width === '100%' ? 'box-sizing:border-box' : '',
    'cursor:pointer',
    'font-family:inherit',
    'line-height:1.2',
  ]
    .filter(Boolean)
    .join(';');
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  override: { restockAt?: string; lowStockThreshold?: number } | null;
  globalLowStockThreshold: number;
};

async function loadProduct(productId: string, variantId: string): Promise<ProductView | null> {
  try {
    const result = (await productsV3.getProduct(productId, {
      fields: ['CURRENCY', 'URL', 'MEDIA_ITEMS_INFO'] as never,
    })) as any;
    const product = result?.product || result;
    if (!product?._id && !product?.name) throw new Error('empty v3 product');
    const variants = product.variantsInfo?.variants || [];
    const variant =
      (variantId && variants.find((v: { id?: string }) => v.id === variantId)) || variants[0];
    const availability = product.inventory?.availabilityStatus || 'IN_STOCK';
    return {
      productId,
      variantId: variant?.id || '',
      name: product.name || '',
      url: product.url?.url || '',
      image: product.media?.main?.image || '',
      price: Number(variant?.price?.actualPrice?.amount || 0),
      inStock: availability === 'IN_STOCK' || availability === 'PARTIALLY_OUT_OF_STOCK',
      quantity: null,
    };
  } catch (v3Err) {
    console.warn('[smart-alerts-pdp] v3 getProduct failed, trying v1', v3Err);
    try {
      const result = (await products.getProduct(productId)) as any;
      const product = result?.product || result;
      if (!product) return null;
      const status = product.stock?.inventoryStatus || 'IN_STOCK';
      return {
        productId,
        variantId: variantId || '',
        name: product.name || '',
        url: product.productPageUrl?.base || '',
        image: product.media?.mainMedia?.image?.url || '',
        price: Number(product.priceData?.discountedPrice ?? product.priceData?.price ?? 0),
        inStock: status !== 'OUT_OF_STOCK',
        quantity: product.stock?.quantity ?? null,
      };
    } catch (v1Err) {
      console.error('[smart-alerts-pdp] product load failed', v1Err);
      return null;
    }
  }
}

async function loadConfigBits(productId: string, variantId: string) {
  let modules = { ...DEFAULT_MODULES };
  let appearance = {
    ...DEFAULT_APPEARANCE,
    colors: { ...DEFAULT_APPEARANCE.colors },
    buttons: mergeButtons(),
    modal: mergeModal(),
  };
  let globalLowStockThreshold = 5;
  let override: ContextView['override'] = null;

  try {
    const config = (await items.get(COL_CONFIG, CONFIG_ID)) as any;
    if (config) {
      modules = { ...DEFAULT_MODULES, ...(config.modules || {}) };
      appearance = {
        ...DEFAULT_APPEARANCE,
        ...(config.appearance || {}),
        colors: { ...DEFAULT_APPEARANCE.colors, ...(config.appearance?.colors || {}) },
        buttons: mergeButtons(config.appearance?.buttons),
        modal: mergeModal(config.appearance?.modal),
      };
      globalLowStockThreshold = Number(config.globalLowStockThreshold ?? 5);
    }
  } catch (err) {
    console.warn('[smart-alerts-pdp] config read failed; using defaults', err);
  }

  try {
    const result = await items
      .query(COL_OVERRIDES)
      .eq('productId', productId)
      .eq('variantId', variantId || '')
      .limit(1)
      .find();
    const row = result.items?.[0] as any;
    if (row) {
      override = {
        restockAt: row.restockAt ? String(row.restockAt) : undefined,
        lowStockThreshold:
          row.lowStockThreshold != null ? Number(row.lowStockThreshold) : undefined,
      };
    }
  } catch (err) {
    console.warn('[smart-alerts-pdp] override read failed', err);
  }

  return { modules, appearance, globalLowStockThreshold, override };
}

class SmartAlertsPdp extends HTMLElement {
  static get observedAttributes() {
    return ['product-id', 'selected-variant-id'];
  }

  private root: HTMLDivElement | null = null;
  private loading = false;
  private lastProductId = '';
  private escHandler: ((e: KeyboardEvent) => void) | null = null;

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
      const product = await loadProduct(productId, variantId);
      if (!product) {
        this.root.innerHTML =
          '<div style="font-size:12px;color:#64748B;margin:8px 0;">Alerts unavailable for this product.</div>';
        return;
      }
      const bits = await loadConfigBits(productId, variantId);
      this.render({ product, ...bits });
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
    const primary = colors.primary || '#0F766E';
    const buttonText = colors.buttonText || '#fff';
    const badge = colors.badge || '#F59E0B';
    const muted = colors.muted || '#64748B';
    const text = colors.text || '#0F172A';
    const background = colors.background || '#FFFFFF';
    const border = colors.secondary || '#e2e8f0';
    const labelColor = colors.label || muted;
    const inputBg = colors.inputBackground || '#FFFFFF';
    const inputText = colors.inputText || text;
    const inputBorder = colors.inputBorder || border;
    const buttons = mergeButtons(data.appearance?.buttons);
    const modal = mergeModal(data.appearance?.modal);
    const notifyBtn = buttons.notifyMe;
    const priceBtn = buttons.priceDrop;
    const submitBtn = buttons.modalSubmit;
    const parts: string[] = [];
    const showPhone = Boolean(data.modules.manualWhatsapp);

    const inputCss = [
      'width:100%',
      `padding:${Number(modal.inputPadding) || 8}px`,
      'margin-bottom:8px',
      'box-sizing:border-box',
      `border:${Number(modal.inputBorderWidth) || 1}px solid ${inputBorder}`,
      `border-radius:${Number(modal.inputBorderRadius) || 0}px`,
      `background:${inputBg}`,
      `color:${inputText}`,
      'font-family:inherit',
    ].join(';');
    const labelCss = `display:block;font-size:${Number(modal.labelFontSize) || 12}px;margin-bottom:4px;color:${labelColor};`;
    const modalShellCss = [
      'position:relative',
      'z-index:1',
      'width:100%',
      `max-width:${Number(modal.maxWidth) || 380}px`,
      `padding:${Number(modal.padding) || 20}px`,
      `border-radius:${Number(modal.borderRadius) || 0}px`,
      `border:${Number(modal.borderWidth) || 0}px solid ${border}`,
      `background:${background}`,
      `color:${text}`,
      'box-shadow:0 20px 40px rgba(15,23,42,0.18)',
      'font-family:inherit',
    ].join(';');

    const qty = data.product.quantity;
    const threshold =
      data.override?.lowStockThreshold ??
      data.appearance?.stockThreshold ??
      data.globalLowStockThreshold;
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
      const style = data.appearance?.timerStyle || 'pill';
      let timer = '';
      if (style === 'blocks') {
        timer = `<span style="display:inline-flex;gap:4px;"><span style="background:${primary};color:${buttonText};padding:4px 8px;border-radius:4px;">${hours}h</span><span style="background:${primary};color:${buttonText};padding:4px 8px;border-radius:4px;">${mins}m</span></span>`;
      } else if (style === 'banner') {
        timer = `<div style="background:${primary};color:${buttonText};padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;">Back in stock in ${hours}h ${mins}m</div>`;
      } else {
        timer = `<span style="display:inline-block;background:${primary};color:${buttonText};padding:6px 12px;border-radius:999px;font-size:13px;">Back in ${hours}h ${mins}m</span>`;
      }
      parts.push(`<div style="margin:8px 0;">${timer}</div>`);
    }

    const phoneFieldBis = showPhone
      ? `<label style="${labelCss}">${escapeHtml(modal.phoneLabel)}</label>
         <input id="sa-phone" type="tel" placeholder="${escapeHtml(modal.phonePlaceholder)}" style="${inputCss}" />`
      : '';

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
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
              <div id="sa-bis-title" style="font-weight:700;font-size:${Number(modal.titleFontSize) || 16}px;color:${text};">${escapeHtml(modal.notifyTitle)}</div>
              <button id="sa-bis-close" type="button" aria-label="Close" style="background:transparent;border:0;color:${muted};font-size:22px;line-height:1;cursor:pointer;padding:0 2px;">×</button>
            </div>
            <p style="margin:0 0 14px;font-size:${Number(modal.descriptionFontSize) || 13}px;color:${muted};line-height:1.4;">${escapeHtml(modal.notifyDescription)}</p>
            <label style="${labelCss}">${escapeHtml(modal.emailLabel)}</label>
            <input id="sa-email" type="email" placeholder="${escapeHtml(modal.emailPlaceholder)}" style="${inputCss}" />
            ${phoneFieldBis}
            <label style="display:flex;gap:8px;align-items:flex-start;font-size:${Number(modal.labelFontSize) || 12}px;margin-bottom:12px;color:${labelColor};">
              <input id="sa-consent" type="checkbox" />
              <span>${escapeHtml(modal.notifyConsentLabel)}</span>
            </label>
            <button id="sa-bis" type="button" style="${buttonCss(submitBtn, { label: notifyBtn.label, widthMode: 'full' })}">${escapeHtml(notifyBtn.label || 'Notify me')}</button>
            <div id="sa-msg" style="font-size:12px;margin-top:8px;color:${muted};" role="status"></div>
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
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
              <div id="sa-price-title" style="font-weight:700;font-size:${Number(modal.titleFontSize) || 16}px;color:${text};">${escapeHtml(modal.priceTitle)}</div>
              <button id="sa-price-close" type="button" aria-label="Close" style="background:transparent;border:0;color:${muted};font-size:22px;line-height:1;cursor:pointer;padding:0 2px;">×</button>
            </div>
            <p style="margin:0 0 14px;font-size:${Number(modal.descriptionFontSize) || 13}px;color:${muted};line-height:1.4;">${escapeHtml(modal.priceDescription)}</p>
            <label style="${labelCss}">${escapeHtml(modal.emailLabel)}</label>
            <input id="sa-price-email" type="email" placeholder="${escapeHtml(modal.emailPlaceholder)}" style="${inputCss}" />
            ${
              showPhone
                ? `<label style="${labelCss}">${escapeHtml(modal.phoneLabel)}</label>
                   <input id="sa-price-phone" type="tel" placeholder="${escapeHtml(modal.phonePlaceholder)}" style="${inputCss}" />`
                : ''
            }
            <label style="display:flex;gap:8px;font-size:${Number(modal.labelFontSize) || 12}px;margin-bottom:12px;color:${labelColor};align-items:flex-start;">
              <input id="sa-price-consent" type="checkbox" />
              <span>${escapeHtml(modal.priceConsentLabel)}</span>
            </label>
            <button id="sa-price-submit" type="button" style="${buttonCss(submitBtn, { widthMode: 'full' })}">${escapeHtml(submitBtn.label || 'Subscribe')}</button>
            <div id="sa-price-msg" style="font-size:12px;margin-top:8px;color:${muted};" role="status"></div>
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
    this.bindActions(data, colors);
  }

  private bindActions(data: ContextView, colors: Record<string, string>) {
    if (!this.root) return;
    const product = data.product;

    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
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

    this.root.querySelector('#sa-bis')?.addEventListener('click', async () => {
      const email = (this.root!.querySelector('#sa-email') as HTMLInputElement)?.value;
      const phone = (this.root!.querySelector('#sa-phone') as HTMLInputElement | null)?.value;
      const consent = (this.root!.querySelector('#sa-consent') as HTMLInputElement)?.checked;
      const msg = this.root!.querySelector('#sa-msg') as HTMLElement;
      try {
        const res = await this.apiFetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.variantId,
            productName: product.name,
            productUrl: product.url,
            productImage: product.image,
            subscriptionType: 'back_in_stock',
            email,
            phone: phone || undefined,
            consent,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Subscribe failed (' + res.status + ')');
        msg.style.color = colors.muted || '#64748B';
        msg.textContent = `You're subscribed. We'll email you when it's back in stock.`;
        try {
          localStorage.setItem('sa_email', email);
        } catch {
          /* ignore */
        }
      } catch (e) {
        msg.style.color = '#b91c1c';
        msg.textContent = e instanceof Error ? e.message : 'Failed';
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

    this.root.querySelector('#sa-price-submit')?.addEventListener('click', async () => {
      const email = (this.root!.querySelector('#sa-price-email') as HTMLInputElement)?.value;
      const phone = (this.root!.querySelector('#sa-price-phone') as HTMLInputElement | null)?.value;
      const consent = (this.root!.querySelector('#sa-price-consent') as HTMLInputElement)?.checked;
      const msg = this.root!.querySelector('#sa-price-msg') as HTMLElement;
      try {
        const res = await this.apiFetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.variantId,
            productName: product.name,
            productUrl: product.url,
            productImage: product.image,
            subscriptionType: 'price_drop',
            email,
            phone: phone || undefined,
            consent,
            watchedPrice: product.price,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Subscribe failed (' + res.status + ')');
        msg.style.color = colors.muted || '#64748B';
        msg.textContent = `You're watching this price. We'll email you if it drops.`;
        try {
          localStorage.setItem('sa_email', email);
        } catch {
          /* ignore */
        }
      } catch (e) {
        msg.style.color = '#b91c1c';
        msg.textContent = e instanceof Error ? e.message : 'Failed';
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

  private openModal(modalId: string, focusSelector: string) {
    const modal = this.root?.querySelector(`#${modalId}`) as HTMLElement | null;
    if (!modal) return;
    modal.hidden = false;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    (this.root?.querySelector(focusSelector) as HTMLInputElement | null)?.focus();
  }

  private closeModal(modalId: string) {
    const modal = this.root?.querySelector(`#${modalId}`) as HTMLElement | null;
    if (!modal) return;
    modal.hidden = true;
    modal.style.display = 'none';
    const bisOpen = this.root?.querySelector('#sa-bis-modal') as HTMLElement | null;
    const priceOpen = this.root?.querySelector('#sa-price-modal') as HTMLElement | null;
    const anyOpen =
      (bisOpen && !bisOpen.hidden && bisOpen.style.display !== 'none') ||
      (priceOpen && !priceOpen.hidden && priceOpen.style.display !== 'none');
    if (!anyOpen) document.body.style.overflow = '';
  }
}

export default SmartAlertsPdp;
