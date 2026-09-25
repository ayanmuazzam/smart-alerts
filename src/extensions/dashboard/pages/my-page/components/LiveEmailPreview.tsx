import React, { useState } from 'react';
import { Box, Card, Text } from '@wix/design-system';
import { DesktopSmall, MobileSmall, Package } from '@wix/wix-ui-icons-common';
import { renderPreviewTokens } from '../../../../../lib/smart-alerts/constants';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function LiveEmailPreview({
  subject,
  preheader,
  headerStyle = 'dark',
  headerText,
  showBadge = true,
  badgeText = 'Back in Stock 🎉',
  headline,
  body,
  buttonLabel,
  showProductImage = true,
  reviewQuote,
  showFeatures = false,
  featuresTitle = "Why you'll love it:",
  featuresText = '',
  closingText,
  signoffText,
  footerDisclaimer,
  primaryColor = '#2563eb',
  logoUrl,
  layout = 'Centered',
}: {
  subject: string;
  preheader: string;
  headerStyle?: 'dark' | 'brand' | 'white';
  headerText?: string;
  showBadge?: boolean;
  badgeText?: string;
  headline: string;
  body: string;
  buttonLabel: string;
  showProductImage?: boolean;
  reviewQuote?: string;
  showFeatures?: boolean;
  featuresTitle?: string;
  featuresText?: string;
  closingText?: string;
  signoffText?: string;
  footerDisclaimer?: string;
  primaryColor?: string;
  logoUrl?: string;
  layout?: string;
}) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const previewSubject = renderPreviewTokens(subject || 'Product is back in stock 🎉');
  const previewPreheader = renderPreviewTokens(preheader || 'The wait is over — grab yours today');
  const previewHeadline = renderPreviewTokens(headline || "It's finally here!");
  const previewBody = renderPreviewTokens(
    body ||
      'Hi {customer_name},\n\nGreat news—the item you were waiting for is officially restocked. Quantities are limited, so grab yours before it sells out again!',
  );
  const previewButton = renderPreviewTokens(buttonLabel || 'Shop Now Before It Sells Out');
  const previewHeaderText = renderPreviewTokens(headerText || 'YOUR BRAND');

  const isCentered = layout.toLowerCase() === 'centered';
  const isMinimal = layout.toLowerCase() === 'minimal';

  // Header background & text color
  let headerBg = '#111827';
  let headerTextColor = '#FFFFFF';
  let headerBorder = 'none';
  if (headerStyle === 'brand') {
    headerBg = primaryColor;
    headerTextColor = '#FFFFFF';
  } else if (headerStyle === 'white') {
    headerBg = '#FFFFFF';
    headerTextColor = '#111827';
    headerBorder = '1px solid #E5E7EB';
  }

  return (
    <Card>
      <Card.Header
        title="Live Email Preview"
        subtitle="Real-time template preview"
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
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: deviceMode === 'desktop' ? '#FFFFFF' : 'transparent',
                color: deviceMode === 'desktop' ? '#116DFF' : '#64748B',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deviceMode === 'desktop' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
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
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: deviceMode === 'mobile' ? '#FFFFFF' : 'transparent',
                color: deviceMode === 'mobile' ? '#116DFF' : '#64748B',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deviceMode === 'mobile' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
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
        {/* Email Simulation Canvas */}
        <div
          style={{
            backgroundColor: '#F4F4F7',
            borderRadius: '10px',
            padding: deviceMode === 'desktop' ? '20px' : '20px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '520px',
            fontFamily: FONT_SANS,
          }}
        >
          {/* Simulated Email Envelope */}
          <div
            style={{
              width: '100%',
              maxWidth: deviceMode === 'desktop' ? '560px' : '340px',
              backgroundColor: '#FFFFFF',
              borderRadius: deviceMode === 'desktop' ? '8px' : '24px',
              border: deviceMode === 'desktop' ? '1px solid #E2E8F0' : '8px solid #1E293B',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Desktop simulated browser chrome bar */}
            {deviceMode === 'desktop' && (
              <div
                style={{
                  padding: '9px 14px',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '5px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: '#64748B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  mail.google.com · Inbox
                </div>
              </div>
            )}

            {/* Mobile Status Bar & Notch */}
            {deviceMode === 'mobile' && (
              <div
                style={{
                  backgroundColor: '#0F172A',
                  padding: '6px 14px 4px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#94A3B8',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <span>9:41</span>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#334155' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                  <span>5G</span>
                  <div style={{ width: '16px', height: '8px', border: '1px solid #94A3B8', borderRadius: '2px', padding: '1px' }}>
                    <div style={{ width: '70%', height: '100%', backgroundColor: '#10B981', borderRadius: '1px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL TEMPLATE CONTAINER */}
            <div>
              {/* 1. Brand Header */}
              <div
                style={{
                  padding: '22px 20px',
                  textAlign: 'center',
                  backgroundColor: headerBg,
                  borderBottom: headerBorder,
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={previewHeaderText}
                    style={{
                      maxHeight: '40px',
                      maxWidth: '180px',
                      objectFit: 'contain',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  />
                ) : (
                  <h1
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: headerTextColor,
                      fontWeight: 800,
                    }}
                  >
                    {previewHeaderText}
                  </h1>
                )}
              </div>

              {/* 2. Main Content */}
              <div
                style={{
                  padding: deviceMode === 'desktop' ? '28px 24px' : '20px 16px',
                  textAlign: isCentered ? 'center' : 'left',
                }}
              >
                {/* Badge */}
                {showBadge && badgeText && (
                  <div style={{ marginBottom: '12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {renderPreviewTokens(badgeText)}
                    </span>
                  </div>
                )}

                {/* Headline */}
                <h2
                  style={{
                    fontSize: isMinimal ? '18px' : '23px',
                    fontWeight: 800,
                    margin: '0 0 12px 0',
                    color: '#111827',
                    lineHeight: 1.3,
                  }}
                >
                  {previewHeadline}
                </h2>

                {/* Body Text */}
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#4B5563',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '22px',
                  }}
                >
                  {previewBody}
                </div>

                {/* 3. Product Card */}
                {showProductImage && !isMinimal && (
                  <div
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '16px',
                      margin: '0 0 22px 0',
                      backgroundColor: '#FAFAFA',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '260px',
                        height: '130px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                        border: '1px solid #CBD5E1',
                        margin: '0 auto 12px auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#475569',
                      }}
                    >
                      <Package size="28" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                        Product Preview Image
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
                      The Minimalist Leather Tote
                    </h3>
                    <p style={{ fontSize: '15px', color: '#059669', fontWeight: 700, margin: '0 0 8px 0' }}>
                      $140.00
                    </p>
                    {reviewQuote && (
                      <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                        {renderPreviewTokens(reviewQuote)}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. CTA Button */}
                <div style={{ marginBottom: '22px' }}>
                  <a
                    href="#preview"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      display: 'inline-block',
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '14.5px',
                      textDecoration: 'none',
                      padding: '13px 28px',
                      borderRadius: '6px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    {previewButton}
                  </a>
                </div>

                {/* 5. Product Highlights / Features List */}
                {showFeatures && featuresText && !isMinimal && (
                  <div
                    style={{
                      textAlign: 'left',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #F1F5F9',
                      padding: '14px 18px',
                      borderRadius: '6px',
                      marginBottom: '22px',
                    }}
                  >
                    <strong style={{ color: '#111827', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                      {renderPreviewTokens(featuresTitle || "Why you'll love it:")}
                    </strong>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '18px',
                        color: '#4B5563',
                        fontSize: '12.5px',
                        lineHeight: 1.6,
                      }}
                    >
                      {featuresText
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {renderPreviewTokens(item.replace(/^[•\-\*]\s*/, ''))}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* 6. Closing & Sign-off */}
                {(closingText || signoffText) && (
                  <div
                    style={{
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      color: '#4B5563',
                      marginBottom: '10px',
                      textAlign: isCentered ? 'center' : 'left',
                    }}
                  >
                    {closingText && <div>{renderPreviewTokens(closingText)}</div>}
                    {signoffText && (
                      <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                        {renderPreviewTokens(signoffText)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 7. Footer */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#9CA3AF',
                  borderTop: '1px solid #E5E7EB',
                  lineHeight: '1.5',
                }}
              >
                <p style={{ margin: '0 0 6px 0' }}>
                  {renderPreviewTokens(
                    footerDisclaimer || 'You received this email because you signed up for alerts.',
                  )}
                </p>
                <p style={{ margin: 0 }}>
                  <a href="#unsub" onClick={(e) => e.preventDefault()} style={{ color: '#6B7280', textDecoration: 'underline' }}>
                    Unsubscribe
                  </a>
                  {' • '}
                  <a href="#pref" onClick={(e) => e.preventDefault()} style={{ color: '#6B7280', textDecoration: 'underline' }}>
                    Manage Preferences
                  </a>
                  {' • '}
                  <a href="#browser" onClick={(e) => e.preventDefault()} style={{ color: '#6B7280', textDecoration: 'underline' }}>
                    View in Browser
                  </a>
                </p>
              </div>
            </div>

            {/* Mobile Bottom Home Bar */}
            {deviceMode === 'mobile' && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '8px 0 10px 0',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '90px', height: '3.5px', borderRadius: '2px', backgroundColor: '#94A3B8' }} />
              </div>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
