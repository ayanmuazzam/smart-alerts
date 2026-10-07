import React from 'react';
import {
  Cell,
  ColorInput,
  FormField,
  Input,
  Layout,
  NumberInput,
  Slider,
  Text,
} from '@wix/design-system';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const PRESET_BUTTON_COLORS = [
  { label: 'Pitch Black', hex: '#000000' },
  { label: 'Wix Blue', hex: '#116DFF' },
  { label: 'Royal Blue', hex: '#2563EB' },
  { label: 'Indigo', hex: '#4F46E5' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Coral Red', hex: '#E11D48' },
  { label: 'Clean White', hex: '#FFFFFF' },
];

type ButtonStyle = {
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  widthMode?: string;
  customWidth?: string;
  paddingX?: number;
  paddingY?: number;
  fontSize?: number;
};

function radiusSliderValue(borderRadius?: number) {
  const n = Number(borderRadius ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  // Legacy "full pill" used 999 — clamp to slider max.
  return Math.min(48, Math.round(n));
}

function widthPercentFromBtn(btn: ButtonStyle) {
  if (btn.widthMode === 'full' || !btn.widthMode) return 100;
  if (btn.widthMode === 'auto') return 40;
  const raw = String(btn.customWidth || '100%').trim();
  const pct = raw.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pct) return Math.min(100, Math.max(20, Math.round(Number(pct[1]))));
  const px = raw.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (px) {
    // Rough map of common px widths into the percent slider.
    return Math.min(100, Math.max(20, Math.round((Number(px[1]) / 360) * 100)));
  }
  return 100;
}

type Props = {
  btn: ButtonStyle;
  onPatch: (patch: Record<string, unknown>) => void;
  labelPlaceholder?: string;
};

function toHex(color: unknown, fallback: string) {
  if (typeof color === 'string') return color;
  return (color as { hex?: string })?.hex || fallback;
}

export function ButtonStyleEditor({ btn, onPatch, labelPlaceholder = 'Button label' }: Props) {
  const setColor = (key: string, color: unknown) => {
    onPatch({ [key]: toHex(color, '#000000') });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <FormField label="Button Label Text">
        <Input
          value={String(btn.label || '')}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder={labelPlaceholder}
        />
      </FormField>

      <Layout gap="16px">
        <Cell span={6}>
          <FormField
            label="Corner radius"
            suffix={<Text size="tiny">{radiusSliderValue(btn.borderRadius)}px</Text>}
          >
            <Slider
              min={0}
              max={48}
              step={1}
              value={radiusSliderValue(btn.borderRadius)}
              displayMarks={false}
              onChange={(value) => {
                const n = Array.isArray(value) ? value[0] : value;
                onPatch({ borderRadius: Number(n ?? 0) });
              }}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField
            label="Button width"
            suffix={<Text size="tiny">{widthPercentFromBtn(btn)}%</Text>}
          >
            <Slider
              min={20}
              max={100}
              step={1}
              value={widthPercentFromBtn(btn)}
              displayMarks={false}
              onChange={(value) => {
                const n = Number(Array.isArray(value) ? value[0] : value);
                const pct = Math.min(100, Math.max(20, Math.round(n || 100)));
                if (pct >= 100) {
                  onPatch({ widthMode: 'full', customWidth: '100%' });
                } else {
                  onPatch({ widthMode: 'custom', customWidth: `${pct}%` });
                }
              }}
            />
          </FormField>
        </Cell>
      </Layout>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
          Size Preset
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { label: 'Compact', px: 20, py: 10, fs: 13 },
            { label: 'Regular', px: 28, py: 14, fs: 14 },
            { label: 'Large & Bold', px: 36, py: 16, fs: 16 },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onPatch({ paddingX: s.px, paddingY: s.py, fontSize: s.fs })}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: FONT_SANS,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <FormField label="Button Background Color">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_BUTTON_COLORS.map((c) => {
              const isSel =
                (btn.backgroundColor || '#000000').toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onPatch({ backgroundColor: c.hex })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '16px',
                    border: isSel ? '2px solid #116DFF' : '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: FONT_SANS,
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: c.hex === '#FFFFFF' ? '1px solid #CBD5E1' : 'none',
                    }}
                  />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
          <ColorInput
            value={btn.backgroundColor || '#000000'}
            onConfirm={(c) => setColor('backgroundColor', c)}
            onChange={(c) => setColor('backgroundColor', c)}
          />
        </div>
      </FormField>

      <Layout gap="12px">
        <Cell span={6}>
          <FormField label="Text Color">
            <ColorInput
              value={btn.textColor || '#FFFFFF'}
              onConfirm={(c) => setColor('textColor', c)}
              onChange={(c) => setColor('textColor', c)}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField label="Border Color">
            <ColorInput
              value={btn.borderColor || '#FFFFFF'}
              onConfirm={(c) => setColor('borderColor', c)}
              onChange={(c) => setColor('borderColor', c)}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField label="Border Width (px)">
            <NumberInput
              value={Number(btn.borderWidth ?? 0)}
              min={0}
              max={8}
              onChange={(v) => onPatch({ borderWidth: Number(v ?? 0) })}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField label="Font Size (px)">
            <NumberInput
              value={Number(btn.fontSize ?? 14)}
              min={11}
              max={24}
              onChange={(v) => onPatch({ fontSize: Number(v ?? 14) })}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField label="Padding X (px)">
            <NumberInput
              value={Number(btn.paddingX ?? 24)}
              min={4}
              max={80}
              onChange={(v) => onPatch({ paddingX: Number(v ?? 24) })}
            />
          </FormField>
        </Cell>
        <Cell span={6}>
          <FormField label="Padding Y (px)">
            <NumberInput
              value={Number(btn.paddingY ?? 12)}
              min={4}
              max={40}
              onChange={(v) => onPatch({ paddingY: Number(v ?? 12) })}
            />
          </FormField>
        </Cell>
      </Layout>
    </div>
  );
}
