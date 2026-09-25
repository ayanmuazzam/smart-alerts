import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Cell,
  ColorInput,
  FormField,
  Input,
  InputArea,
  Layout,
  NumberInput,
} from '@wix/design-system';
import {
  Package,
  Tag,
  Chat,
} from '@wix/wix-ui-icons-common';
import { MonoIconBadge } from '../components/MonoIconBadge';
import { CornerWidgetPreview } from '../components/CornerWidgetPreview';
import { DEFAULT_APPEARANCE } from '../../../../../lib/smart-alerts/constants';

type Props = {
  config: any;
  setConfig: (updater: any) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
};

type DesignTarget = 'notifyMe' | 'priceDrop' | 'modalSubmit' | 'urgency' | 'palette';

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

const THEME_PRESETS = [
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    desc: 'Bold dark button, 8px rounded corners',
    btnBg: '#111827',
    btnText: '#FFFFFF',
    btnRadius: 8,
    modalRadius: 12,
    primaryColor: '#111827',
  },
  {
    id: 'vibrant_pill',
    name: 'Vibrant Pill',
    desc: 'Wix Blue, 999px rounded pill shape',
    btnBg: '#116DFF',
    btnText: '#FFFFFF',
    btnRadius: 999,
    modalRadius: 16,
    primaryColor: '#116DFF',
  },
  {
    id: 'minimal_studio',
    name: 'Minimal Studio',
    desc: '0px sharp architectural borders',
    btnBg: '#000000',
    btnText: '#FFFFFF',
    btnRadius: 0,
    modalRadius: 0,
    primaryColor: '#000000',
  },
  {
    id: 'emerald_luxe',
    name: 'Emerald Luxe',
    desc: 'Forest green, 6px subtle radius',
    btnBg: '#059669',
    btnText: '#FFFFFF',
    btnRadius: 6,
    modalRadius: 10,
    primaryColor: '#059669',
  },
];

export function StorefrontCustomizationScreen({
  config,
  setConfig,
  onRun,
  adminPost,
}: Props) {
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [activeTab, setActiveTab] = useState<'button' | 'modal' | 'urgency' | 'palette'>('button');
  const [buttonTarget, setButtonTarget] = useState<'notifyMe' | 'priceDrop' | 'modalSubmit'>('notifyMe');

  const appearance = config?.appearance || {};
  const colors = appearance.colors || {};
  const buttons = {
    notifyMe: {
      ...DEFAULT_APPEARANCE.buttons.notifyMe,
      ...(appearance.buttons?.notifyMe || {}),
    },
    priceDrop: {
      ...DEFAULT_APPEARANCE.buttons.priceDrop,
      ...(appearance.buttons?.priceDrop || {}),
    },
    modalSubmit: {
      ...DEFAULT_APPEARANCE.buttons.modalSubmit,
      ...(appearance.buttons?.modalSubmit || {}),
    },
  };
  const modal = {
    ...DEFAULT_APPEARANCE.modal,
    ...(appearance.modal || {}),
  };

  const activeBtn = buttons[buttonTarget];
  const previewScenario = buttonTarget === 'priceDrop' ? 'in_stock' : 'out_of_stock';

  const patchButton = (key: 'notifyMe' | 'priceDrop' | 'modalSubmit', patch: Record<string, unknown>) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        buttons: {
          ...(c.appearance?.buttons || {}),
          [key]: {
            ...(c.appearance?.buttons?.[key] || {}),
            ...patch,
          },
        },
      },
    }));
  };

  const patchModal = (patch: Record<string, unknown>) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        modal: {
          ...(c.appearance?.modal || {}),
          ...patch,
        },
      },
    }));
  };

  const setBtnColor = (key: string, color: unknown) => {
    const hex =
      typeof color === 'string' ? color : (color as { hex?: string })?.hex || '#000000';
    patchButton(buttonTarget, { [key]: hex });
  };

  const setPaletteColor = (key: string, color: unknown) => {
    const hex =
      typeof color === 'string' ? color : (color as { hex?: string })?.hex || '#0F766E';
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        colors: { ...c.appearance.colors, [key]: hex },
      },
    }));
  };

  // Apply a 1-click curated theme preset
  const applyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        colors: {
          ...c.appearance?.colors,
          primary: preset.primaryColor,
        },
        buttons: {
          ...c.appearance?.buttons,
          notifyMe: {
            ...(c.appearance?.buttons?.notifyMe || {}),
            backgroundColor: preset.btnBg,
            textColor: preset.btnText,
            borderRadius: preset.btnRadius,
          },
          priceDrop: {
            ...(c.appearance?.buttons?.priceDrop || {}),
            backgroundColor: preset.btnBg,
            textColor: preset.btnText,
            borderRadius: preset.btnRadius,
          },
          modalSubmit: {
            ...(c.appearance?.buttons?.modalSubmit || {}),
            backgroundColor: preset.btnBg,
            textColor: preset.btnText,
            borderRadius: preset.btnRadius,
          },
        },
        modal: {
          ...(c.appearance?.modal || {}),
          borderRadius: preset.modalRadius,
          inputBorderRadius: Math.min(preset.btnRadius, 10),
        },
      },
    }));
  };

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Full-Width Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)',
          border: '1px solid #DDD6FE',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          fontFamily: FONT_SANS,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <MonoIconBadge tone="violet" size={42}>
            <Package size="20" />
          </MonoIconBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#4C1D95' }}>
              Storefront Widget &amp; Urgency Studio
            </span>
            <span style={{ fontSize: '12.5px', color: '#6D28D9' }}>
              Customize out-of-stock trigger buttons, subscriber popup forms, restock countdown timers, and urgency badges.
            </span>
          </div>
        </div>

        {/* 1-Click Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6D28D9', marginRight: '2px' }}>
            Theme Presets:
          </span>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid #C4B5FD',
                backgroundColor: '#FFFFFF',
                color: '#5B21B6',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: FONT_SANS,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F3FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: preset.btnBg,
                  display: 'inline-block',
                }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Side-by-Side 50/50 Split Layout */}
      <Layout gap="24px">
        {/* Left Column: Focused Interactive Controls */}
        <Cell span={6}>
          <Box direction="vertical" gap="SP4">
            <Card>
              <Card.Header
                title="Widget Customizer"
                subtitle="Select a component below to fine-tune its appearance"
              />
              <Card.Divider />
              <Card.Content>
                <Box direction="vertical" gap="16px">
                  {/* Step 1: Component Navigation Sub-tabs */}
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: '#F1F5F9',
                      padding: '3px',
                      borderRadius: '8px',
                      gap: '4px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {[
                      { id: 'button', label: '1. Product Page Button' },
                      { id: 'modal', label: '2. Popup Modal Form' },
                      { id: 'urgency', label: '3. Urgency & Timers' },
                      { id: 'palette', label: '4. Colors & Theme' },
                    ].map((tab) => {
                      const isAct = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as any)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isAct ? '#FFFFFF' : 'transparent',
                            color: isAct ? '#116DFF' : '#475569',
                            fontWeight: isAct ? 700 : 500,
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: isAct ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.15s ease',
                            fontFamily: FONT_SANS,
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: Product Page Button Customizer */}
                  {activeTab === 'button' && (
                    <Box direction="vertical" gap="14px">
                      {/* Sub-selector for button type */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Button Target:
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[
                            { id: 'notifyMe', label: 'Out of Stock ("Notify Me")', icon: <Package size="14" /> },
                            { id: 'priceDrop', label: 'In Stock ("Price Drop Alert")', icon: <Tag size="14" /> },
                            { id: 'modalSubmit', label: 'Modal Submit Button', icon: <Chat size="14" /> },
                          ].map((t) => {
                            const isSel = buttonTarget === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setButtonTarget(t.id as any)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: isSel ? '1.5px solid #116DFF' : '1px solid #E2E8F0',
                                  backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                                  color: isSel ? '#116DFF' : '#475569',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                {t.icon}
                                <span>{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <FormField label="Button Label Text">
                        <Input
                          value={String(activeBtn.label || '')}
                          onChange={(e) => patchButton(buttonTarget, { label: e.target.value })}
                          placeholder="Notify Me"
                        />
                      </FormField>

                      {/* Visual Corner Radius Picker */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Corner Shape:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                          {[
                            { label: 'Sharp', radius: 0, desc: '0px' },
                            { label: 'Subtle', radius: 4, desc: '4px' },
                            { label: 'Rounded', radius: 8, desc: '8px' },
                            { label: 'Full Pill', radius: 999, desc: '999px' },
                          ].map((r) => {
                            const isCur = Number(activeBtn.borderRadius ?? 0) === r.radius;
                            return (
                              <button
                                key={r.label}
                                type="button"
                                onClick={() => patchButton(buttonTarget, { borderRadius: r.radius })}
                                style={{
                                  padding: '7px 4px',
                                  borderRadius: '6px',
                                  border: isCur ? '2px solid #116DFF' : '1px solid #E2E8F0',
                                  backgroundColor: isCur ? '#EFF6FF' : '#FFFFFF',
                                  color: isCur ? '#116DFF' : '#334155',
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                <div>{r.label}</div>
                                <div style={{ fontSize: '10px', color: '#94A3B8' }}>{r.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Button Width Mode */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Button Width Mode:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[
                            { id: 'full', label: 'Full Width (100%)', desc: 'Fills the product column' },
                            { id: 'auto', label: 'Hug Content (Auto)', desc: 'Fits text and padding' },
                          ].map((w) => {
                            const isSel = (activeBtn.widthMode || 'full') === w.id;
                            return (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => patchButton(buttonTarget, { widthMode: w.id })}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: isSel ? '2px solid #116DFF' : '1px solid #E2E8F0',
                                  backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                                  color: isSel ? '#116DFF' : '#334155',
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                <div>{w.label}</div>
                                <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{w.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Size Presets */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Size Preset:
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
                              onClick={() =>
                                patchButton(buttonTarget, {
                                  paddingX: s.px,
                                  paddingY: s.py,
                                  fontSize: s.fs,
                                })
                              }
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

                      {/* Button Colors with Swatches */}
                      <FormField label="Button Background Color">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {PRESET_BUTTON_COLORS.map((c) => {
                              const isSel = (activeBtn.backgroundColor || '#000000').toLowerCase() === c.hex.toLowerCase();
                              return (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => patchButton(buttonTarget, { backgroundColor: c.hex })}
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
                            value={activeBtn.backgroundColor || '#000000'}
                            onConfirm={(c) => setBtnColor('backgroundColor', c)}
                            onChange={(c) => setBtnColor('backgroundColor', c)}
                          />
                        </div>
                      </FormField>

                      <Layout gap="12px">
                        <Cell span={6}>
                          <FormField label="Text Color">
                            <ColorInput
                              value={activeBtn.textColor || '#FFFFFF'}
                              onConfirm={(c) => setBtnColor('textColor', c)}
                              onChange={(c) => setBtnColor('textColor', c)}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Border Color">
                            <ColorInput
                              value={activeBtn.borderColor || '#FFFFFF'}
                              onConfirm={(c) => setBtnColor('borderColor', c)}
                              onChange={(c) => setBtnColor('borderColor', c)}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Border Width (px)">
                            <NumberInput
                              value={Number(activeBtn.borderWidth ?? 0)}
                              min={0}
                              max={8}
                              onChange={(v) => patchButton(buttonTarget, { borderWidth: Number(v ?? 0) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Font Size (px)">
                            <NumberInput
                              value={Number(activeBtn.fontSize ?? 14)}
                              min={11}
                              max={24}
                              onChange={(v) => patchButton(buttonTarget, { fontSize: Number(v ?? 14) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Padding X (Horizontal px)">
                            <NumberInput
                              value={Number(activeBtn.paddingX ?? 24)}
                              min={4}
                              max={80}
                              onChange={(v) => patchButton(buttonTarget, { paddingX: Number(v ?? 24) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Padding Y (Vertical px)">
                            <NumberInput
                              value={Number(activeBtn.paddingY ?? 12)}
                              min={4}
                              max={40}
                              onChange={(v) => patchButton(buttonTarget, { paddingY: Number(v ?? 12) })}
                            />
                          </FormField>
                        </Cell>
                      </Layout>
                    </Box>
                  )}

                  {/* TAB 2: Subscriber Popup Modal */}
                  {activeTab === 'modal' && (
                    <Box direction="vertical" gap="14px">
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: '1.4',
                        }}
                      >
                        💬 <strong>Subscriber Popup:</strong> Appears when shoppers tap the "Notify Me" or "Price Drop" button on your storefront to collect their email or WhatsApp.
                      </div>

                      <FormField label="Modal Headline (Out of Stock)">
                        <Input
                          value={String(modal.notifyTitle || '')}
                          onChange={(e) => patchModal({ notifyTitle: e.target.value })}
                          placeholder="Notify me when back in stock"
                        />
                      </FormField>

                      <FormField label="Modal Subtitle / Description">
                        <Input
                          value={String(modal.notifyDescription || '')}
                          onChange={(e) => patchModal({ notifyDescription: e.target.value })}
                          placeholder="We'll email you when this product is available again."
                        />
                      </FormField>

                      <FormField label="Consent Checkbox Text">
                        <Input
                          value={String(modal.notifyConsentLabel || '')}
                          onChange={(e) => patchModal({ notifyConsentLabel: e.target.value })}
                          placeholder="I agree to receive stock alerts for this product."
                        />
                      </FormField>

                      <Layout gap="12px">
                        <Cell span={6}>
                          <FormField label="Modal Corner Radius (px)">
                            <NumberInput
                              value={Number(modal.borderRadius ?? 12)}
                              min={0}
                              max={32}
                              onChange={(v) => patchModal({ borderRadius: Number(v ?? 12) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Input Corner Radius (px)">
                            <NumberInput
                              value={Number(modal.inputBorderRadius ?? 6)}
                              min={0}
                              max={24}
                              onChange={(v) => patchModal({ inputBorderRadius: Number(v ?? 6) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Input Padding (px)">
                            <NumberInput
                              value={Number(modal.inputPadding ?? 8)}
                              min={6}
                              max={20}
                              onChange={(v) => patchModal({ inputPadding: Number(v ?? 8) })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label="Modal Max Width (px)">
                            <NumberInput
                              value={Number(modal.maxWidth ?? 380)}
                              min={280}
                              max={600}
                              onChange={(v) => patchModal({ maxWidth: Number(v ?? 380) })}
                            />
                          </FormField>
                        </Cell>
                      </Layout>
                    </Box>
                  )}

                  {/* TAB 3: Urgency Badges & Restock Timer */}
                  {activeTab === 'urgency' && (
                    <Box direction="vertical" gap="14px">
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: '1.4',
                        }}
                      >
                        ⏱️ <strong>Social Urgency:</strong> Display live inventory depletion countdowns to increase visitor conversions before items sell out.
                      </div>

                      <FormField
                        label="“Only X Left” Low Stock Threshold"
                        infoContent="Displays a high-urgency badge when product stock falls below this quantity."
                      >
                        <NumberInput
                          value={Number(appearance.stockThreshold ?? 10)}
                          min={1}
                          max={100}
                          onChange={(v) =>
                            setConfig((c: any) => ({
                              ...c,
                              appearance: {
                                ...c.appearance,
                                stockThreshold: Number(v ?? 10),
                              },
                            }))
                          }
                        />
                      </FormField>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                          Restock Countdown Timer Style:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { id: 'pill', label: 'Pill Badge', desc: 'Compact & subtle' },
                            { id: 'blocks', label: 'Digital Blocks', desc: 'Bold hours/mins' },
                            { id: 'banner', label: 'Full-Width Bar', desc: 'High visibility banner' },
                          ].map((t) => {
                            const isCur = (appearance.timerStyle || 'pill') === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  setConfig((c: any) => ({
                                    ...c,
                                    appearance: { ...c.appearance, timerStyle: t.id },
                                  }))
                                }
                                style={{
                                  padding: '10px 8px',
                                  borderRadius: '8px',
                                  border: isCur ? '2px solid #116DFF' : '1px solid #E2E8F0',
                                  backgroundColor: isCur ? '#EFF6FF' : '#FFFFFF',
                                  color: isCur ? '#116DFF' : '#334155',
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                <div>{t.label}</div>
                                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{t.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Box>
                  )}

                  {/* TAB 4: Colors & Theme Palette */}
                  {activeTab === 'palette' && (
                    <Box direction="vertical" gap="14px">
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        Storefront Palette Mapping:
                      </div>
                      <Layout gap="12px">
                        {(
                          [
                            ['primary', 'Primary Accent Color'],
                            ['secondary', 'Modal Border & Accents'],
                            ['text', 'Heading & Main Text'],
                            ['background', 'Modal Background'],
                            ['badge', 'Urgency Badge Color'],
                            ['muted', 'Secondary / Subtitle Text'],
                          ] as const
                        ).map(([key, label]) => (
                          <Cell key={key} span={6}>
                            <FormField label={label}>
                              <ColorInput
                                value={
                                  colors[key] ||
                                  (DEFAULT_APPEARANCE.colors as Record<string, string>)[key] ||
                                  '#0F766E'
                                }
                                onConfirm={(color) => setPaletteColor(key, color)}
                                onChange={(color) => setPaletteColor(key, color)}
                              />
                            </FormField>
                          </Cell>
                        ))}
                      </Layout>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #E2E8F0',
                    }}
                  >
                    <Button
                      size="medium"
                      disabled={isSavingAppearance}
                      onClick={async () => {
                        setIsSavingAppearance(true);
                        try {
                          await onRun(async () => {
                            await adminPost({
                              action: 'saveConfig',
                              patch: { appearance: config.appearance },
                            });
                          }, 'Storefront appearance saved');
                        } finally {
                          setIsSavingAppearance(false);
                        }
                      }}
                    >
                      {isSavingAppearance ? 'Saving…' : 'Save Storefront Appearance'}
                    </Button>
                    <Button
                      priority="secondary"
                      size="medium"
                      onClick={() => {
                        setConfig((c: any) => ({
                          ...c,
                          appearance: DEFAULT_APPEARANCE,
                        }));
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </Box>
              </Card.Content>
            </Card>
          </Box>
        </Cell>

        {/* Right Column: Sticky Live Storefront Simulator */}
        <Cell span={6}>
          <div style={{ position: 'sticky', top: '16px' }}>
            <CornerWidgetPreview
              appearance={{
                ...appearance,
                buttons,
                modal,
              }}
              scenario={previewScenario}
              activeTarget={buttonTarget}
              forceModal={activeTab === 'modal' || buttonTarget === 'modalSubmit'}
              showWhatsapp={Boolean(config?.modules?.manualWhatsapp !== false)}
            />
          </div>
        </Cell>
      </Layout>
    </Box>
  );
}
