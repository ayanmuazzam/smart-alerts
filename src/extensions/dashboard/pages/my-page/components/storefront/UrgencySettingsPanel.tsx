import React from 'react';
import {
  Box,
  ColorInput,
  Divider,
  FormField,
  Input,
  NumberInput,
  Text,
  ToggleSwitch,
} from '@wix/design-system';
import { DEFAULT_APPEARANCE } from '../../../../../../lib/smart-alerts/constants';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

type Props = {
  stockThreshold: number;
  timerStyle: string;
  timerTheme?: string;
  timerPrefix?: string;
  timerShowSeconds?: boolean;
  timerPulse?: boolean;
  timerShowIcon?: boolean;
  badgeColor: string;
  onStockThreshold: (n: number) => void;
  onTimerStyle: (id: string) => void;
  onTimerTheme?: (theme: string) => void;
  onTimerPrefix?: (prefix: string) => void;
  onTimerShowSeconds?: (show: boolean) => void;
  onTimerPulse?: (pulse: boolean) => void;
  onTimerShowIcon?: (show: boolean) => void;
  onBadgeColor: (color: unknown) => void;
};

const TIMER_STYLES = [
  {
    id: 'pill',
    label: 'Pill Badge',
    desc: 'Compact & subtle with live pulse',
    iconPreview: (
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
        <rect x="0.5" y="0.5" width="21" height="13" rx="6.5" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
        <circle cx="5" cy="7" r="2" fill="#3B82F6" />
        <line x1="9" y1="7" x2="18" y2="7" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'blocks',
    label: 'Digital Blocks',
    desc: 'Bold hours, mins & secs tiles',
    iconPreview: (
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
        <rect x="1" y="1" width="9" height="12" rx="2" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
        <rect x="14" y="1" width="9" height="12" rx="2" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
        <circle cx="12" cy="5" r="0.8" fill="#3B82F6" />
        <circle cx="12" cy="9" r="0.8" fill="#3B82F6" />
      </svg>
    ),
  },
  {
    id: 'banner',
    label: 'Full-Width Bar',
    desc: 'High-visibility announcement strip',
    iconPreview: (
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
        <rect x="0.5" y="1" width="25" height="12" rx="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
        <circle cx="4.5" cy="7" r="1.8" fill="#3B82F6" />
        <line x1="8" y1="7" x2="15" y2="7" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="18" y="3.5" width="6" height="7" rx="1.5" fill="#3B82F6" />
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Urgency Card',
    desc: 'Framed card with header & capsules',
    iconPreview: (
      <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
        <rect x="0.5" y="0.5" width="23" height="15" rx="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
        <line x1="4" y1="4" x2="12" y2="4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="4" y="7" width="6" height="6" rx="1.5" fill="#3B82F6" />
        <rect x="14" y="7" width="6" height="6" rx="1.5" fill="#3B82F6" />
      </svg>
    ),
  },
];

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

const TIMER_THEMES = [
  {
    id: 'solid',
    label: 'Vibrant Solid',
    desc: 'Rich saturated high-contrast fill',
  },
  {
    id: 'tint',
    label: 'Soft Tint',
    desc: 'Frosted glow & accent border',
  },
  {
    id: 'dark',
    label: 'Dark Contrast',
    desc: 'Obsidian slate with neon digits',
  },
];

export function UrgencySettingsPanel({
  stockThreshold,
  timerStyle,
  timerTheme = 'solid',
  timerPrefix = 'Back in stock in',
  timerShowSeconds = true,
  timerPulse = true,
  timerShowIcon = true,
  badgeColor,
  onStockThreshold,
  onTimerStyle,
  onTimerTheme,
  onTimerPrefix,
  onTimerShowSeconds,
  onTimerPulse,
  onTimerShowIcon,
  onBadgeColor,
}: Props) {
  const currentStyle = timerStyle || 'pill';
  const currentTheme = timerTheme || 'solid';

  const activeBadgeColor = badgeColor || DEFAULT_APPEARANCE.colors.badge || '#000000';
  const isDarkBadge = isDarkColor(activeBadgeColor);

  const getThemePreview = (id: string) => {
    if (id === 'solid') {
      return {
        bg: isDarkBadge ? '#000000' : activeBadgeColor,
        border: isDarkBadge ? '#27272A' : activeBadgeColor,
        text: '#FFFFFF',
      };
    }
    if (id === 'dark') {
      return {
        bg: '#0F172A',
        border: '#334155',
        text: isDarkBadge ? '#FFFFFF' : activeBadgeColor,
      };
    }
    // tint
    return {
      bg: isDarkBadge ? '#F4F4F5' : '#FEF3C7',
      border: isDarkBadge ? '#71717A' : activeBadgeColor,
      text: isDarkBadge ? '#18181B' : activeBadgeColor,
    };
  };

  return (
    <Box direction="vertical" gap="16px">
      <FormField
        label="“Only X Left” Low Stock Threshold"
        infoContent="Shows the urgency badge when stock is at or below this quantity."
      >
        <NumberInput
          value={stockThreshold}
          min={1}
          max={100}
          onChange={(v) => onStockThreshold(Number(v ?? 10))}
        />
      </FormField>

      <FormField
        label="Urgency Badge & Timer Accent Color"
        infoContent="Used for low-stock badges, countdown digits, pulse beacons, and accents."
      >
        <ColorInput
          value={badgeColor || DEFAULT_APPEARANCE.colors.badge}
          onConfirm={onBadgeColor}
          onChange={onBadgeColor}
        />
      </FormField>

      <Divider />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', fontFamily: FONT_SANS }}>
            Restock Countdown Timer Style
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
            Active on OOS items
          </span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#64748B', lineHeight: 1.4 }}>
          Select the layout used for expected restock dates on product pages.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {TIMER_STYLES.map((t) => {
            const isCur = currentStyle === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTimerStyle(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isCur ? '2px solid #116DFF' : '1px solid #E2E8F0',
                  backgroundColor: isCur ? '#F0F7FF' : '#FFFFFF',
                  color: isCur ? '#0B57D0' : '#334155',
                  cursor: 'pointer',
                  fontFamily: FONT_SANS,
                  transition: 'all 0.15s ease',
                  boxShadow: isCur ? '0 2px 6px rgba(17, 109, 255, 0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{t.label}</span>
                  <div>{t.iconPreview}</div>
                </div>
                <div style={{ fontSize: '10.5px', color: isCur ? '#1E40AF' : '#64748B', lineHeight: 1.3 }}>
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
          Visual Surface Theme
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: '#64748B' }}>
          Choose surface background, border, and contrast styling.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {TIMER_THEMES.map((theme) => {
            const isCur = currentTheme === theme.id;
            const preview = getThemePreview(theme.id);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onTimerTheme?.(theme.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: isCur ? '2px solid #116DFF' : '1px solid #E2E8F0',
                  backgroundColor: isCur ? '#F0F7FF' : '#FFFFFF',
                  cursor: 'pointer',
                  fontFamily: FONT_SANS,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: preview.bg,
                    border: `1.5px solid ${preview.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: preview.text,
                    marginBottom: '6px',
                  }}
                >
                  12h
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: isCur ? '#116DFF' : '#1E293B' }}>
                  {theme.label}
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.2 }}>
                  {theme.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <FormField
        label="Countdown Label / Callout"
        infoContent="Headline or prefix displayed before the time digits (e.g. Back in stock in, Estimated restock in)."
      >
        <Input
          value={timerPrefix}
          onChange={(e) => onTimerPrefix?.(e.target.value)}
          placeholder="e.g. Back in stock in"
        />
      </FormField>

      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 14px',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: FONT_SANS,
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Urgency &amp; Motion Controls
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
              Show Live Seconds
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B' }}>
              Ticks down (: 45s) every second to heighten purchase urgency
            </div>
          </div>
          <ToggleSwitch
            checked={timerShowSeconds}
            onChange={() => onTimerShowSeconds?.(!timerShowSeconds)}
          />
        </div>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                Live Pulsing Beacon
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B' }}>
              Animated radar dot indicating active real-time countdown
            </div>
          </div>
          <ToggleSwitch
            checked={timerPulse}
            onChange={() => onTimerPulse?.(!timerPulse)}
          />
        </div>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
              Urgency Clock Icon
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B' }}>
              Displays subtle clock/hourglass icon inside the widget
            </div>
          </div>
          <ToggleSwitch
            checked={timerShowIcon}
            onChange={() => onTimerShowIcon?.(!timerShowIcon)}
          />
        </div>
      </div>
    </Box>
  );
}
