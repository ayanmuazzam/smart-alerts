import React, { useEffect, useState } from 'react';
import { Card, Text } from '@wix/design-system';
import { DesktopSmall, MobileSmall } from '@wix/wix-ui-icons-common';
import { DEFAULT_APPEARANCE } from '../../../../../lib/smart-alerts/constants';
import {
  SF,
  buttonReactStyle,
  modalInputReactStyle,
  modalShellReactStyle,
  pxNum,
} from '../../../../../lib/smart-alerts/storefront-styles';

type ButtonStyle = (typeof DEFAULT_APPEARANCE.buttons)['notifyMe'];
type ModalStyle = typeof DEFAULT_APPEARANCE.modal;

export type WidgetPreviewAppearance = {
  timerStyle?: string;
  timerTheme?: string;
  timerPrefix?: string;
  timerShowSeconds?: boolean;
  timerPulse?: boolean;
  timerShowIcon?: boolean;
  stockThreshold?: number;
  colors?: Record<string, string>;
  buttons?: {
    notifyMe?: Partial<ButtonStyle>;
    priceDrop?: Partial<ButtonStyle>;
    modalSubmit?: Partial<ButtonStyle>;
  };
  modal?: Partial<ModalStyle>;
};

type Scenario = 'out_of_stock' | 'in_stock';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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

  // 'tint' (Soft Tint & Glow)
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

function PulseDot({ color = '#000000', size = 8 }: { color?: string; size?: number }) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: size * 2.2,
          height: size * 2.2,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.45,
          animation: 'sa-timer-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
    </span>
  );
}

function ClockIcon({ color = 'currentColor', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export type PreviewMode = 'buttons' | 'modal' | 'urgency';

export function CornerWidgetPreview({
  appearance,
  showWhatsapp = true,
  scenario = 'out_of_stock',
  activeTarget = 'notifyMe',
  previewMode = 'buttons',
  showSuccess = false,
}: {
  appearance: WidgetPreviewAppearance;
  showWhatsapp?: boolean;
  scenario?: Scenario;
  activeTarget?: 'notifyMe' | 'priceDrop' | 'modalSubmit' | 'shared';
  /** Which storefront piece to focus in the live preview. */
  previewMode?: PreviewMode;
  /** Show post-subscribe success state in modal preview. */
  showSuccess?: boolean;
  /** @deprecated use previewMode="modal" */
  forceModal?: boolean;
}) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [demoSecs, setDemoSecs] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoSecs((s) => (s > 0 ? s - 1 : 59));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const colors = appearance?.colors || {};
  const primary = colors.primary || '#0F766E';
  const buttonTextColor = colors.buttonText || '#FFFFFF';
  const badge = colors.badge || '#000000';
  const muted = colors.muted || '#64748B';
  const text = colors.text || '#0F172A';
  const background = colors.background || '#FFFFFF';
  // Border & Accents (secondary) drives modal shell + field borders.
  const border = colors.secondary || '#134E4A';
  const labelColor = colors.label || muted;
  const inputBg = colors.inputBackground || '#FFFFFF';
  const inputText = colors.inputText || text;
  const inputBorder = border;

  const timerStyle = appearance?.timerStyle || 'pill';
  const timerTheme = appearance?.timerTheme || 'solid';
  const timerPrefix = appearance?.timerPrefix ?? 'Back in stock in';
  const timerShowSeconds = appearance?.timerShowSeconds !== false;
  const timerPulse = appearance?.timerPulse !== false;
  const timerShowIcon = appearance?.timerShowIcon !== false;
  const stockThreshold = Number(appearance?.stockThreshold ?? 10);

  const notifyBtn = {
    ...DEFAULT_APPEARANCE.buttons.notifyMe,
    ...(appearance.buttons?.notifyMe || {}),
  };
  const priceBtn = {
    ...DEFAULT_APPEARANCE.buttons.priceDrop,
    ...(appearance.buttons?.priceDrop || {}),
  };
  const submitBtn = {
    ...DEFAULT_APPEARANCE.buttons.modalSubmit,
    ...(appearance.buttons?.modalSubmit || {}),
  };
  const modal = {
    ...DEFAULT_APPEARANCE.modal,
    ...(appearance.modal || {}),
  };

  const isOos = scenario === 'out_of_stock';
  const activeTriggerBtn = isOos ? notifyBtn : priceBtn;

  const renderTimer = () => {
    const hours = 12;
    const mins = 30;
    const secs = demoSecs;
    const styles = getTimerThemeTokens(timerTheme, badge, buttonTextColor);

    // Style 1: Digital Blocks
    if (timerStyle === 'blocks') {
      const isSolid = timerTheme === 'solid';
      const isDark = timerTheme === 'dark';
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

      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
          {(timerPrefix || timerPulse || timerShowIcon) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {timerPulse && <PulseDot color={blockPulseColor} />}
              {timerShowIcon && <ClockIcon color={blockIconColor} size={13} />}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: blockHeaderColor,
                }}
              >
                {timerPrefix || 'Restock Expected In'}
              </span>
            </div>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {/* Hours Block */}
            <div
              style={{
                minWidth: '44px',
                padding: '6px 8px',
                borderRadius: '8px',
                background: blockTileBg,
                border: blockTileBorder,
                textAlign: 'center',
                boxShadow: blockTileShadow,
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: blockNumColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {hours < 10 ? '0' + hours : hours}
              </div>
              <div
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: blockLabelColor,
                  marginTop: '2px',
                }}
              >
                HOURS
              </div>
            </div>

            <span style={{ fontSize: '15px', fontWeight: 800, color: blockSeparatorColor }}>:</span>

            {/* Mins Block */}
            <div
              style={{
                minWidth: '44px',
                padding: '6px 8px',
                borderRadius: '8px',
                background: blockTileBg,
                border: blockTileBorder,
                textAlign: 'center',
                boxShadow: blockTileShadow,
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: blockNumColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {mins < 10 ? '0' + mins : mins}
              </div>
              <div
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: blockLabelColor,
                  marginTop: '2px',
                }}
              >
                MINS
              </div>
            </div>

            {timerShowSeconds && (
              <>
                <span style={{ fontSize: '15px', fontWeight: 800, color: blockSeparatorColor }}>:</span>
                <div
                  style={{
                    minWidth: '44px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: blockTileBg,
                    border: blockTileBorder,
                    textAlign: 'center',
                    boxShadow: blockTileShadow,
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: blockNumColor,
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {secs < 10 ? '0' + secs : secs}
                  </div>
                  <div
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      color: blockLabelColor,
                      marginTop: '2px',
                    }}
                  >
                    SECS
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Style 2: Full-Width Bar
    if (timerStyle === 'banner') {
      return (
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: '10px',
            background: styles.bg,
            border: styles.border,
            color: styles.textColor,
            boxShadow: styles.badgeShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {timerPulse && <PulseDot color={styles.pulseColor} />}
            {timerShowIcon && <ClockIcon color={styles.numColor} size={15} />}
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.2px' }}>
                {timerPrefix || 'Restock Expected In'}
              </div>
              <div style={{ fontSize: '10.5px', opacity: 0.75, marginTop: '1px' }}>
                Limited inventory returning soon
              </div>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: styles.tileBg,
                border: styles.tileBorder,
                fontSize: '12.5px',
                fontWeight: 800,
                color: styles.numColor,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {hours}h
            </span>
            <span style={{ fontWeight: 800, opacity: 0.6, color: styles.numColor }}>:</span>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: styles.tileBg,
                border: styles.tileBorder,
                fontSize: '12.5px',
                fontWeight: 800,
                color: styles.numColor,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {mins}m
            </span>
            {timerShowSeconds && (
              <>
                <span style={{ fontWeight: 800, opacity: 0.6, color: styles.numColor }}>:</span>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: styles.tileBg,
                    border: styles.tileBorder,
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: styles.numColor,
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {secs < 10 ? '0' + secs : secs}s
                </span>
              </>
            )}
          </div>
        </div>
      );
    }

    // Style 3: Urgency Card
    if (timerStyle === 'card') {
      return (
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: '12px',
            background: styles.bg,
            border: styles.border,
            color: styles.textColor,
            boxShadow: styles.badgeShadow,
            fontFamily: FONT_SANS,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {timerPulse && <PulseDot color={styles.pulseColor} />}
              {timerShowIcon && <ClockIcon color={styles.numColor} size={14} />}
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {timerPrefix || 'Restock Countdown'}
              </span>
            </div>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: styles.tileBg,
                color: styles.numColor,
                border: styles.tileBorder,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              High Demand
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              margin: '4px 0 8px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                minWidth: '44px',
                padding: '5px 6px',
                borderRadius: '8px',
                background: styles.tileBg,
                border: styles.tileBorder,
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: styles.numColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {hours < 10 ? '0' + hours : hours}
              </div>
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: styles.labelColor,
                  letterSpacing: '0.5px',
                }}
              >
                HOURS
              </div>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: styles.separatorColor }}>:</span>
            <div
              style={{
                textAlign: 'center',
                minWidth: '44px',
                padding: '5px 6px',
                borderRadius: '8px',
                background: styles.tileBg,
                border: styles.tileBorder,
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: styles.numColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {mins < 10 ? '0' + mins : mins}
              </div>
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: styles.labelColor,
                  letterSpacing: '0.5px',
                }}
              >
                MINS
              </div>
            </div>
            {timerShowSeconds && (
              <>
                <span style={{ fontSize: '15px', fontWeight: 800, color: styles.separatorColor }}>:</span>
                <div
                  style={{
                    textAlign: 'center',
                    minWidth: '44px',
                    padding: '5px 6px',
                    borderRadius: '8px',
                    background: styles.tileBg,
                    border: styles.tileBorder,
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: styles.numColor,
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {secs < 10 ? '0' + secs : secs}
                  </div>
                  <div
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      color: styles.labelColor,
                      letterSpacing: '0.5px',
                    }}
                  >
                    SECS
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ fontSize: '10.5px', opacity: 0.75, textAlign: 'center' }}>
            Subscribers get first access upon warehouse arrival
          </div>
        </div>
      );
    }

    // Default Style: Pill Badge
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          borderRadius: '999px',
          background: styles.bg,
          border: styles.border,
          color: styles.textColor,
          boxShadow: styles.badgeShadow,
          fontFamily: FONT_SANS,
          fontSize: '12.5px',
          fontWeight: 600,
          letterSpacing: '0.2px',
          transition: 'all 0.2s ease',
        }}
      >
        {timerPulse && <PulseDot color={styles.pulseColor} />}
        {timerShowIcon && <ClockIcon color={styles.numColor} size={14} />}
        {timerPrefix && (
          <span style={{ opacity: 0.85, fontSize: '11.5px', fontWeight: 600 }}>
            {timerPrefix}
          </span>
        )}
        <span
          style={{
            fontWeight: 800,
            color: styles.numColor,
            letterSpacing: '0.3px',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {hours}h {mins}m{timerShowSeconds ? ` ${secs < 10 ? '0' + secs : secs}s` : ''}
        </span>
      </div>
    );
  };


  const previewSubtitle =
    previewMode === 'modal'
      ? isOos
        ? 'Notify Me popup modal only'
        : 'Watch Price popup modal only'
      : previewMode === 'urgency'
        ? 'Low-stock badge & restock countdown'
        : isOos
          ? 'Notify Me product-page button'
          : 'Watch Price product-page button';

  const showProductCard = previewMode === 'buttons' || previewMode === 'urgency';
  const showModalCard = previewMode === 'modal';
  // Urgency widgets only on Urgency tab — never on Notify Me / Watch Price buttons.
  const showUrgencyBits = previewMode === 'urgency';
  const showTriggerButton = previewMode === 'buttons';
  // “Only X left” is for low stock while still available — never when out of stock.
  const showLowStockBadge = showUrgencyBits && !isOos;
  // Restock countdown is for out-of-stock (or scheduled restock) products.
  const showRestockTimer = showUrgencyBits;

  return (
    <Card>
      <Card.Header
        title="Storefront Preview"
        subtitle={previewSubtitle}
        suffix={
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: deviceMode === 'desktop' ? '#FFFFFF' : 'transparent',
                color: deviceMode === 'desktop' ? '#116DFF' : '#64748B',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deviceMode === 'desktop' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                fontFamily: FONT_SANS,
              }}
            >
              <DesktopSmall size="14" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: deviceMode === 'mobile' ? '#FFFFFF' : 'transparent',
                color: deviceMode === 'mobile' ? '#116DFF' : '#64748B',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deviceMode === 'mobile' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                fontFamily: FONT_SANS,
              }}
            >
              <MobileSmall size="14" />
              <span>Mobile</span>
            </button>
          </div>
        }
      />
      <Card.Divider />
      <Card.Content>
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            padding: deviceMode === 'desktop' ? '28px 20px' : '20px 12px',
            display: 'flex',
            justifyContent: 'center',
            fontFamily: FONT_SANS,
            minHeight: '420px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: deviceMode === 'desktop' ? '100%' : '340px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {showProductCard ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748B',
                  }}
                >
                  {previewMode === 'urgency' ? 'Urgency Widgets' : 'Product Page Trigger'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: isOos ? '#DC2626' : '#16A34A',
                    fontWeight: 600,
                  }}
                >
                  {isOos ? '● Out of Stock' : '● In Stock'}
                </span>
              </div>

              {showLowStockBadge ? (
                <div style={{ fontWeight: 700, color: badge, fontSize: '13px' }}>
                  Only {stockThreshold} left
                </div>
              ) : null}
              {showRestockTimer ? (
                <div>
                  <style>{`
                    @keyframes sa-timer-ping {
                      0% { transform: scale(1); opacity: 0.8; }
                      75%, 100% { transform: scale(2.4); opacity: 0; }
                    }
                  `}</style>
                  {renderTimer()}
                </div>
              ) : null}

              {showTriggerButton ? (
                <div style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    style={buttonReactStyle(activeTriggerBtn) as React.CSSProperties}
                  >
                    {activeTriggerBtn.label}
                  </button>
                </div>
              ) : null}
            </div>
            ) : null}

            {showModalCard ? (
            <div
              style={
                modalShellReactStyle(modal, {
                  background,
                  color: text,
                  borderColor: border,
                }) as React.CSSProperties
              }
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    color: muted,
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: 'default',
                    userSelect: 'none',
                    padding: '0 2px',
                  }}
                >
                  ×
                </span>
              </div>
              {showSuccess ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '8px 4px 4px',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: `${primary}22`,
                      color: primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                    aria-hidden
                  >
                    ✓
                  </div>
                  <h4
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: pxNum(modal.titleFontSize, SF.titleFontSize),
                      color: text,
                      lineHeight: 1.3,
                    }}
                  >
                    {isOos
                      ? modal.notifySuccessTitle || "You're subscribed!"
                      : modal.priceSuccessTitle || "You're watching this price!"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: pxNum(modal.descriptionFontSize, SF.descriptionFontSize),
                      color: muted,
                      lineHeight: 1.45,
                    }}
                  >
                    {isOos
                      ? modal.notifySuccessDescription ||
                        "We'll email you when it's back in stock."
                      : modal.priceSuccessDescription ||
                        "We'll email you if the price drops."}
                  </p>
                  <Text size="tiny" secondary>
                    Closes in{' '}
                    {Math.max(1, Math.round(pxNum(modal.successAutoCloseMs, 2500) / 1000))}s
                  </Text>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: pxNum(modal.titleFontSize, SF.titleFontSize),
                      color: text,
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {isOos ? modal.notifyTitle : modal.priceTitle}
                  </div>
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: pxNum(modal.descriptionFontSize, SF.descriptionFontSize),
                      color: muted,
                      lineHeight: 1.4,
                    }}
                  >
                    {isOos ? modal.notifyDescription : modal.priceDescription}
                  </p>
                  <label
                    style={{
                      display: 'block',
                      fontSize: pxNum(modal.labelFontSize, SF.labelFontSize),
                      marginBottom: 4,
                      color: labelColor,
                    }}
                  >
                    {modal.emailLabel || 'Email'}
                  </label>
                  <input
                    type="email"
                    readOnly
                    placeholder={modal.emailPlaceholder || 'you@example.com'}
                    style={
                      {
                        ...modalInputReactStyle(modal, {
                          background: inputBg,
                          color: inputText,
                          borderColor: inputBorder,
                        }),
                        marginBottom: 8,
                      } as React.CSSProperties
                    }
                  />
                  {showWhatsapp ? (
                    <>
                      <label
                        style={{
                          display: 'block',
                          fontSize: pxNum(modal.labelFontSize, SF.labelFontSize),
                          marginBottom: 4,
                          color: labelColor,
                        }}
                      >
                        {modal.phoneLabel || 'WhatsApp (optional)'}
                      </label>
                      <input
                        type="tel"
                        readOnly
                        placeholder={modal.phonePlaceholder || '+1…'}
                        style={
                          {
                            ...modalInputReactStyle(modal, {
                              background: inputBg,
                              color: inputText,
                              borderColor: inputBorder,
                            }),
                            marginBottom: 8,
                          } as React.CSSProperties
                        }
                      />
                    </>
                  ) : null}
                  <label
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      fontSize: pxNum(modal.labelFontSize, SF.labelFontSize),
                      marginBottom: 12,
                      color: labelColor,
                      cursor: 'default',
                    }}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked
                      style={{ accentColor: primary, cursor: 'default' }}
                    />
                    <span>{isOos ? modal.notifyConsentLabel : modal.priceConsentLabel}</span>
                  </label>
                  <button
                    type="button"
                    style={buttonReactStyle(submitBtn, { forceFullWidth: true }) as React.CSSProperties}
                  >
                    {submitBtn.label || 'Subscribe'}
                  </button>
                </>
              )}
            </div>
            ) : null}

            <Text size="tiny" secondary>
              Save Appearance, then open Site preview (apps-override) to verify on your live storefront.
            </Text>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
