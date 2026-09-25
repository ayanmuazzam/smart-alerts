import React, { useState } from 'react';
import { Card, Text } from '@wix/design-system';
import { DesktopSmall, MobileSmall } from '@wix/wix-ui-icons-common';
import { DEFAULT_APPEARANCE } from '../../../../../lib/smart-alerts/constants';

type ButtonStyle = (typeof DEFAULT_APPEARANCE.buttons)['notifyMe'];
type ModalStyle = typeof DEFAULT_APPEARANCE.modal;

export type WidgetPreviewAppearance = {
  timerStyle?: string;
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

function computeButtonStyle(btn: ButtonStyle, forceFullWidth = false): React.CSSProperties {
  const width =
    forceFullWidth || btn.widthMode === 'full'
      ? '100%'
      : btn.widthMode === 'custom' && btn.customWidth
        ? btn.customWidth
        : 'auto';
  return {
    backgroundColor: btn.backgroundColor,
    color: btn.textColor,
    border: `${Number(btn.borderWidth) || 0}px solid ${btn.borderColor || 'transparent'}`,
    borderRadius: Number(btn.borderRadius) || 0,
    padding: `${Number(btn.paddingY) || 12}px ${Number(btn.paddingX) || 24}px`,
    fontSize: Number(btn.fontSize) || 14,
    fontWeight: Number(btn.fontWeight) || 600,
    width,
    boxSizing: width === '100%' ? 'border-box' : undefined,
    cursor: 'default',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.25,
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  };
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function CornerWidgetPreview({
  appearance,
  showWhatsapp = true,
  scenario = 'out_of_stock',
  activeTarget = 'notifyMe',
}: {
  appearance: WidgetPreviewAppearance;
  showWhatsapp?: boolean;
  scenario?: Scenario;
  activeTarget?: 'notifyMe' | 'priceDrop' | 'modalSubmit' | 'shared';
  forceModal?: boolean;
}) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const colors = appearance?.colors || {};
  const primary = colors.primary || '#0F766E';
  const buttonTextColor = colors.buttonText || '#FFFFFF';
  const badge = colors.badge || '#F59E0B';
  const muted = colors.muted || '#64748B';
  const text = colors.text || '#0F172A';
  const background = colors.background || '#FFFFFF';
  const border = colors.secondary || '#E2E8F0';
  const labelColor = colors.label || muted;
  const inputBg = colors.inputBackground || '#FFFFFF';
  const inputText = colors.inputText || text;
  const inputBorder = colors.inputBorder || border;
  const timerStyle = appearance?.timerStyle || 'pill';
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
    if (timerStyle === 'blocks') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              backgroundColor: primary,
              color: buttonTextColor,
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {hours}h
          </span>
          <span style={{ fontWeight: 700, color: primary }}>:</span>
          <span
            style={{
              backgroundColor: primary,
              color: buttonTextColor,
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {mins}m
          </span>
          <span style={{ fontSize: '11px', color: muted, fontWeight: 500, marginLeft: '4px' }}>
            until restock
          </span>
        </div>
      );
    }
    if (timerStyle === 'banner') {
      return (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: `1px solid ${primary}`,
            color: primary,
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '8px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          ⏳ Back in stock in {hours}h {mins}m
        </div>
      );
    }
    // Pill
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          border: '1px solid #BBF7D0',
        }}
      >
        <span>⏳</span>
        <span>Back in {hours}h {mins}m</span>
      </span>
    );
  };

  return (
    <Card>
      <Card.Header
        title="Storefront Preview"
        subtitle={
          isOos
            ? 'Notify me button & subscription popup'
            : 'Price drop button & subscription popup'
        }
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
            padding: '24px 16px',
            display: 'flex',
            justifyContent: 'center',
            fontFamily: FONT_SANS,
            minHeight: '480px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: deviceMode === 'desktop' ? '380px' : '310px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* 1. PRODUCT PAGE BUTTON & URGENCY SECTION */}
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
                  Product Page Trigger
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

              {/* Urgency Badge */}
              <div style={{ fontWeight: 700, color: badge, fontSize: '13px' }}>
                {isOos ? `Only ${stockThreshold} left` : `🔥 Only ${stockThreshold} units remaining!`}
              </div>

              {/* Countdown Timer */}
              <div>{renderTimer()}</div>

              {/* The Button */}
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  style={computeButtonStyle(activeTriggerBtn)}
                >
                  {activeTriggerBtn.label}
                </button>
              </div>
            </div>

            {/* Subtle Connector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#94A3B8',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span>↓ Opens Popup Form On Click</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            {/* 2. SUBSCRIBER POPUP MODAL SECTION */}
            <div
              style={{
                padding: Number(modal.padding) || 20,
                border: `${Number(modal.borderWidth) || 1}px solid ${border}`,
                borderRadius: Number(modal.borderRadius) || 12,
                backgroundColor: background,
                color: text,
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: Number(modal.titleFontSize) || 16,
                      color: text,
                      lineHeight: 1.3,
                    }}
                  >
                    {isOos ? modal.notifyTitle : modal.priceTitle}
                  </h4>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: Number(modal.descriptionFontSize) || 13,
                      color: muted,
                      lineHeight: 1.4,
                    }}
                  >
                    {isOos ? modal.notifyDescription : modal.priceDescription}
                  </p>
                </div>
                <span
                  style={{
                    color: muted,
                    fontSize: '20px',
                    lineHeight: 1,
                    cursor: 'default',
                    userSelect: 'none',
                    padding: '2px',
                  }}
                >
                  ×
                </span>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: Number(modal.labelFontSize) || 12,
                      marginBottom: '4px',
                      color: labelColor,
                      fontWeight: 600,
                    }}
                  >
                    {modal.emailLabel || 'Email address'}
                  </label>
                  <input
                    type="email"
                    readOnly
                    placeholder={modal.emailPlaceholder || 'you@example.com'}
                    style={{
                      width: '100%',
                      padding: Number(modal.inputPadding) || 8,
                      border: `${Number(modal.inputBorderWidth) || 1}px solid ${inputBorder}`,
                      borderRadius: Number(modal.inputBorderRadius) || 6,
                      backgroundColor: inputBg,
                      color: inputText,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      fontFamily: FONT_SANS,
                    }}
                  />
                </div>

                {showWhatsapp && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: Number(modal.labelFontSize) || 12,
                        marginBottom: '4px',
                        color: labelColor,
                        fontWeight: 600,
                      }}
                    >
                      {modal.phoneLabel || 'WhatsApp / Phone (optional)'}
                    </label>
                    <input
                      type="tel"
                      readOnly
                      placeholder={modal.phonePlaceholder || '+1...'}
                      style={{
                        width: '100%',
                        padding: Number(modal.inputPadding) || 8,
                        border: `${Number(modal.inputBorderWidth) || 1}px solid ${inputBorder}`,
                        borderRadius: Number(modal.inputBorderRadius) || 6,
                        backgroundColor: inputBg,
                        color: inputText,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: FONT_SANS,
                      }}
                    />
                  </div>
                )}

                <label
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    fontSize: Number(modal.labelFontSize) || 12,
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

                <div style={{ marginTop: '4px' }}>
                  <button type="button" style={computeButtonStyle(submitBtn, true)}>
                    {submitBtn.label || (isOos ? notifyBtn.label : priceBtn.label)}
                  </button>
                </div>
              </div>
            </div>

            <Text size="tiny" secondary>
              Save Appearance, then open Site preview (apps-override) to verify on your live storefront.
            </Text>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
