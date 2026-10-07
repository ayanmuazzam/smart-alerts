import React, { useState } from 'react';
import { Box, Button, Card, Cell, Layout } from '@wix/design-system';
import { Package, Tag } from '@wix/wix-ui-icons-common';
import { MonoIconBadge } from '../components/MonoIconBadge';
import { CornerWidgetPreview, type PreviewMode } from '../components/CornerWidgetPreview';
import { ButtonStyleEditor } from '../components/storefront/ButtonStyleEditor';
import { ModalSettingsPanel } from '../components/storefront/ModalSettingsPanel';
import { UrgencySettingsPanel } from '../components/storefront/UrgencySettingsPanel';
import { DEFAULT_APPEARANCE } from '../../../../../lib/smart-alerts/constants';

type Props = {
  config: any;
  setConfig: (updater: any) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
};

type StorefrontTab = 'buttons' | 'modal' | 'urgency';
type ButtonTarget = 'notifyMe' | 'priceDrop';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const THEME_PRESETS = [
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    btnBg: '#111827',
    btnText: '#FFFFFF',
    btnRadius: 8,
    modalRadius: 12,
    primaryColor: '#111827',
    timerTheme: 'dark',
  },
  {
    id: 'vibrant_pill',
    name: 'Vibrant Pill',
    btnBg: '#116DFF',
    btnText: '#FFFFFF',
    btnRadius: 999,
    modalRadius: 16,
    primaryColor: '#116DFF',
    timerTheme: 'solid',
  },
  {
    id: 'minimal_studio',
    name: 'Minimal Studio',
    btnBg: '#000000',
    btnText: '#FFFFFF',
    btnRadius: 0,
    modalRadius: 0,
    primaryColor: '#000000',
    timerTheme: 'solid',
  },
  {
    id: 'emerald_luxe',
    name: 'Emerald Luxe',
    btnBg: '#059669',
    btnText: '#FFFFFF',
    btnRadius: 6,
    modalRadius: 10,
    primaryColor: '#059669',
    timerTheme: 'tint',
  },
];

const TABS: { id: StorefrontTab; label: string }[] = [
  { id: 'buttons', label: '1. Product Page Buttons' },
  { id: 'modal', label: '2. Popup Modal' },
  { id: 'urgency', label: '3. Urgency & Timers' },
];

export function StorefrontCustomizationScreen({
  config,
  setConfig,
  onRun,
  adminPost,
}: Props) {
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [activeTab, setActiveTab] = useState<StorefrontTab>('buttons');
  const [buttonTarget, setButtonTarget] = useState<ButtonTarget>('notifyMe');
  const [modalScenario, setModalScenario] = useState<'out_of_stock' | 'in_stock'>('out_of_stock');
  const [modalShowSuccess, setModalShowSuccess] = useState(false);

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
  const previewMode: PreviewMode = activeTab;
  const previewScenario =
    activeTab === 'modal'
      ? modalScenario
      : activeTab === 'urgency'
        ? 'in_stock' // low-stock badge only applies while product is still available
        : buttonTarget === 'priceDrop'
          ? 'in_stock'
          : 'out_of_stock';

  const patchButton = (
    key: 'notifyMe' | 'priceDrop' | 'modalSubmit',
    patch: Record<string, unknown>,
  ) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        buttons: {
          ...(c.appearance?.buttons || {}),
          [key]: { ...(c.appearance?.buttons?.[key] || {}), ...patch },
        },
      },
    }));
  };

  const patchModal = (patch: Record<string, unknown>) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        modal: { ...(c.appearance?.modal || {}), ...patch },
      },
    }));
  };

  const setPaletteColor = (key: string, color: unknown) => {
    const hex =
      typeof color === 'string' ? color : (color as { hex?: string })?.hex || '#0F766E';
    setConfig((c: any) => {
      const nextColors = { ...c.appearance?.colors, [key]: hex };
      // Border & Accents paints modal + input borders — keep inputBorder in sync
      // and ensure widths are visible (legacy configs often had 0).
      let nextModal = c.appearance?.modal || {};
      if (key === 'secondary') {
        nextColors.inputBorder = hex;
        nextModal = {
          ...nextModal,
          borderWidth: Math.max(1, Number(nextModal.borderWidth ?? 0) || 0),
          inputBorderWidth: Math.max(1, Number(nextModal.inputBorderWidth ?? 0) || 0),
        };
      }
      return {
        ...c,
        appearance: {
          ...c.appearance,
          colors: nextColors,
          modal: nextModal,
        },
      };
    });
  };

  const applyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    setConfig((c: any) => ({
      ...c,
      appearance: {
        ...c.appearance,
        colors: { ...c.appearance?.colors, primary: preset.primaryColor },
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
        timerTheme: preset.timerTheme,
      },
    }));
  };

  return (
    <Box direction="vertical" gap="SP4">
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
              Edit Notify Me &amp; Watch Price buttons, popup modal, and urgency widgets — preview
              matches the active tab.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #DDD6FE',
                backgroundColor: '#FFFFFF',
                color: '#5B21B6',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: FONT_SANS,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <Layout gap="24px">
        <Cell span={6}>
          <Card>
            <Card.Header
              title="Widget Customizer"
              subtitle="Each tab has its own settings; the live preview shows that tab only"
            />
            <Card.Divider />
            <Card.Content>
              <Box direction="vertical" gap="16px">
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
                  {TABS.map((tab) => {
                    const isAct = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id !== 'modal') setModalShowSuccess(false);
                        }}
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
                          fontFamily: FONT_SANS,
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === 'buttons' ? (
                  <Box direction="vertical" gap="14px">
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          marginBottom: '6px',
                        }}
                      >
                        Notify Me &amp; Watch Price
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          {
                            id: 'notifyMe' as const,
                            label: 'Out of Stock — Notify Me',
                            icon: <Package size="14" />,
                          },
                          {
                            id: 'priceDrop' as const,
                            label: 'In Stock — Watch Price',
                            icon: <Tag size="14" />,
                          },
                        ].map((t) => {
                          const isSel = buttonTarget === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setButtonTarget(t.id)}
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
                    <ButtonStyleEditor
                      btn={activeBtn}
                      onPatch={(patch) => patchButton(buttonTarget, patch)}
                      labelPlaceholder={
                        buttonTarget === 'notifyMe' ? 'Notify Me' : 'Watch for price drop'
                      }
                    />
                  </Box>
                ) : null}

                {activeTab === 'modal' ? (
                  <ModalSettingsPanel
                    modal={modal}
                    colors={colors}
                    modalSubmit={buttons.modalSubmit}
                    modalScenario={modalScenario}
                    setModalScenario={setModalScenario}
                    setShowSuccessPreview={setModalShowSuccess}
                    patchModal={patchModal}
                    patchModalSubmit={(patch) => patchButton('modalSubmit', patch)}
                    setPaletteColor={setPaletteColor}
                  />
                ) : null}

                {activeTab === 'urgency' ? (
                  <UrgencySettingsPanel
                    stockThreshold={Number(appearance.stockThreshold ?? 10)}
                    timerStyle={String(appearance.timerStyle || 'pill')}
                    timerTheme={String(appearance.timerTheme || 'solid')}
                    timerPrefix={String(appearance.timerPrefix ?? 'Back in stock in')}
                    timerShowSeconds={appearance.timerShowSeconds !== false}
                    timerPulse={appearance.timerPulse !== false}
                    timerShowIcon={appearance.timerShowIcon !== false}
                    badgeColor={colors.badge || DEFAULT_APPEARANCE.colors.badge}
                    onStockThreshold={(n) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, stockThreshold: n },
                      }))
                    }
                    onTimerStyle={(id) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerStyle: id },
                      }))
                    }
                    onTimerTheme={(theme) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerTheme: theme },
                      }))
                    }
                    onTimerPrefix={(prefix) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerPrefix: prefix },
                      }))
                    }
                    onTimerShowSeconds={(show) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerShowSeconds: show },
                      }))
                    }
                    onTimerPulse={(pulse) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerPulse: pulse },
                      }))
                    }
                    onTimerShowIcon={(show) =>
                      setConfig((c: any) => ({
                        ...c,
                        appearance: { ...c.appearance, timerShowIcon: show },
                      }))
                    }
                    onBadgeColor={(color) => setPaletteColor('badge', color)}
                  />
                ) : null}

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
        </Cell>

        <Cell span={6}>
          <div style={{ position: 'sticky', top: '16px' }}>
            <CornerWidgetPreview
              appearance={{ ...appearance, buttons, modal }}
              scenario={previewScenario}
              activeTarget={buttonTarget}
              previewMode={previewMode}
              showSuccess={activeTab === 'modal' && modalShowSuccess}
              showWhatsapp={Boolean(config?.modules?.manualWhatsapp !== false)}
            />
          </div>
        </Cell>
      </Layout>
    </Box>
  );
}
