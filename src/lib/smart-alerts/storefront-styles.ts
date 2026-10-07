/**
 * Shared storefront appearance math — dashboard preview and site PDP must use these.
 * Uses finite-number checks so 0 is never treated as “missing”.
 */

type StyleMap = Record<string, string | number | undefined>;

export const SF = {
  modalPadding: 48,
  modalMaxWidth: 575,
  modalBorderRadius: 0,
  modalBorderWidth: 1,
  titleFontSize: 22,
  descriptionFontSize: 15,
  labelFontSize: 14,
  inputPadding: 15,
  inputBorderRadius: 0,
  inputBorderWidth: 1,
  btnPaddingX: 48,
  btnPaddingY: 15,
  btnFontSize: 14,
  btnFontWeight: 600,
  btnBorderRadius: 0,
  btnBorderWidth: 0,
} as const;

export function pxNum(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export type SfButton = {
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  widthMode?: string;
  customWidth?: string;
  fontSize?: number;
  fontWeight?: number;
  paddingX?: number;
  paddingY?: number;
};

export function resolveButtonWidth(btn: SfButton, forceFull = false): string {
  if (forceFull || btn.widthMode === 'full') return '100%';
  if (btn.widthMode === 'custom' && btn.customWidth) return String(btn.customWidth);
  return 'auto';
}

/** React-friendly button style (dashboard preview). */
export function buttonReactStyle(
  btn: SfButton,
  opts?: { forceFullWidth?: boolean },
): StyleMap {
  const width = resolveButtonWidth(btn, opts?.forceFullWidth);
  return {
    backgroundColor: btn.backgroundColor || '#000000',
    color: btn.textColor || '#FFFFFF',
    border: `${pxNum(btn.borderWidth, SF.btnBorderWidth)}px solid ${btn.borderColor || '#FFFFFF'}`,
    borderRadius: pxNum(btn.borderRadius, SF.btnBorderRadius),
    padding: `${pxNum(btn.paddingY, SF.btnPaddingY)}px ${pxNum(btn.paddingX, SF.btnPaddingX)}px`,
    fontSize: pxNum(btn.fontSize, SF.btnFontSize),
    fontWeight: pxNum(btn.fontWeight, SF.btnFontWeight),
    width,
    boxSizing: width === '100%' ? 'border-box' : undefined,
    cursor: 'default',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.2,
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/** Inline CSS string for site PDP custom element. */
export function buttonCssString(btn: SfButton, opts?: { forceFullWidth?: boolean }): string {
  const width = resolveButtonWidth(btn, opts?.forceFullWidth);
  return [
    `background:${btn.backgroundColor || '#000000'}`,
    `color:${btn.textColor || '#FFFFFF'}`,
    `border:${pxNum(btn.borderWidth, SF.btnBorderWidth)}px solid ${btn.borderColor || '#FFFFFF'}`,
    `border-radius:${pxNum(btn.borderRadius, SF.btnBorderRadius)}px`,
    `padding:${pxNum(btn.paddingY, SF.btnPaddingY)}px ${pxNum(btn.paddingX, SF.btnPaddingX)}px`,
    `font-size:${pxNum(btn.fontSize, SF.btnFontSize)}px`,
    `font-weight:${pxNum(btn.fontWeight, SF.btnFontWeight)}`,
    `width:${width}`,
    width === '100%' ? 'box-sizing:border-box' : '',
    'cursor:pointer',
    'font-family:inherit',
    'line-height:1.2',
    'text-align:center',
  ]
    .filter(Boolean)
    .join(';');
}

export type SfModal = {
  padding?: number;
  maxWidth?: number;
  borderRadius?: number;
  borderWidth?: number;
  titleFontSize?: number;
  descriptionFontSize?: number;
  labelFontSize?: number;
  inputPadding?: number;
  inputBorderRadius?: number;
  inputBorderWidth?: number;
};

export function modalShellReactStyle(
  modal: SfModal,
  opts: { background: string; color: string; borderColor: string },
): StyleMap {
  return {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: pxNum(modal.maxWidth, SF.modalMaxWidth),
    padding: pxNum(modal.padding, SF.modalPadding),
    borderRadius: pxNum(modal.borderRadius, SF.modalBorderRadius),
    border: `${pxNum(modal.borderWidth, SF.modalBorderWidth)}px solid ${opts.borderColor}`,
    backgroundColor: opts.background,
    color: opts.color,
    boxShadow: '0 20px 40px rgba(15,23,42,0.18)',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
}

export function modalShellCssString(
  modal: SfModal,
  opts: { background: string; color: string; borderColor: string },
): string {
  return [
    'position:relative',
    'z-index:1',
    'width:100%',
    `max-width:${pxNum(modal.maxWidth, SF.modalMaxWidth)}px`,
    `padding:${pxNum(modal.padding, SF.modalPadding)}px`,
    `border-radius:${pxNum(modal.borderRadius, SF.modalBorderRadius)}px`,
    `border:${pxNum(modal.borderWidth, SF.modalBorderWidth)}px solid ${opts.borderColor}`,
    `background:${opts.background}`,
    `color:${opts.color}`,
    'box-shadow:0 20px 40px rgba(15,23,42,0.18)',
    'font-family:inherit',
    'box-sizing:border-box',
  ].join(';');
}

export function modalInputReactStyle(
  modal: SfModal,
  opts: { background: string; color: string; borderColor: string },
): StyleMap {
  return {
    width: '100%',
    padding: pxNum(modal.inputPadding, SF.inputPadding),
    border: `${pxNum(modal.inputBorderWidth, SF.inputBorderWidth)}px solid ${opts.borderColor}`,
    borderRadius: pxNum(modal.inputBorderRadius, SF.inputBorderRadius),
    backgroundColor: opts.background,
    color: opts.color,
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
}

export function modalInputCssString(
  modal: SfModal,
  opts: { background: string; color: string; borderColor: string },
): string {
  return [
    'width:100%',
    `padding:${pxNum(modal.inputPadding, SF.inputPadding)}px`,
    'margin-bottom:8px',
    'box-sizing:border-box',
    `border:${pxNum(modal.inputBorderWidth, SF.inputBorderWidth)}px solid ${opts.borderColor}`,
    `border-radius:${pxNum(modal.inputBorderRadius, SF.inputBorderRadius)}px`,
    `background:${opts.background}`,
    `color:${opts.color}`,
    'font-family:inherit',
  ].join(';');
}
