import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Cell,
  Checkbox,
  ColorInput,
  Dropdown,
  FormField,
  Input,
  InputArea,
  Layout,
  Text,
} from '@wix/design-system';
import {
  Email,
  Package,
  Sparkles,
  SettingsSmall,
  Check,
  Tag,
  Chat,
} from '@wix/wix-ui-icons-common';
import { LiveEmailPreview } from '../components/LiveEmailPreview';
import { CornerWidgetPreview } from '../components/CornerWidgetPreview';
import { TEMPLATE_VARIABLES, type CustomizationSub } from '../adminApi';

type TemplateForm = {
  triggerType: string;
  layout: string;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  buttonLabel: string;
  showProductImage: boolean;
};

type Props = {
  sub: CustomizationSub;
  onSubChange: (sub: CustomizationSub) => void;
  config: any;
  setConfig: (updater: any) => void;
  templateForm: TemplateForm;
  setTemplateForm: React.Dispatch<React.SetStateAction<TemplateForm>>;
  onTemplateTriggerChange: (triggerType: string) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
  onReload: () => void;
};

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const CUSTOMIZATION_SIDEBAR_ITEMS: {
  id: CustomizationSub;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'email',
    title: 'Email & Branding',
    subtitle: 'Templates, copy & logo',
    icon: <Email size="18" />,
  },
  {
    id: 'storefront',
    title: 'Storefront & Widget',
    subtitle: 'PDP notify theme',
    icon: <Package size="18" />,
  },
];

function insertVariable(
  field: keyof TemplateForm,
  variable: string,
  form: TemplateForm,
  setForm: React.Dispatch<React.SetStateAction<TemplateForm>>,
) {
  const current = String(form[field] ?? '');
  setForm((f) => ({ ...f, [field]: `${current}${variable}` }));
}

export function CustomizationScreen({
  sub,
  onSubChange,
  config,
  setConfig,
  templateForm,
  setTemplateForm,
  onTemplateTriggerChange,
  onRun,
  adminPost,
  onReload,
}: Props) {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  const brand = config?.brand || {};
  const appearance = config?.appearance || {};
  const colors = appearance.colors || {};

  return (
    <Box direction="horizontal" gap="SP4" align="space-between">
      {/* 1. Left Sidebar Navigation */}
      <Box
        direction="vertical"
        style={{
          width: '215px',
          flexShrink: 0,
          position: 'sticky',
          top: '16px',
        }}
        gap="SP3"
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '14px 10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
            fontFamily: FONT_SANS,
          }}
        >
          {/* Menu Items */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 10px 10px 10px',
              }}
            >
              Customization
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {CUSTOMIZATION_SIDEBAR_ITEMS.map((item) => {
                const isActive = sub === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSubChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      color: isActive ? '#116DFF' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? 'inset 3px 0 0 #116DFF' : 'none',
                      fontFamily: FONT_SANS,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div
                      style={{
                        color: isActive ? '#116DFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: isActive ? '#3B82F6' : '#94A3B8', whiteSpace: 'nowrap' }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom: Live Preview Indicator Card */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #EDEFF2',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '3px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
              <span>Live Visual Engine</span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748B',
                lineHeight: '1.4',
              }}
            >
              Changes to copy and colors render instantly in the preview.
            </div>
          </div>
        </div>
      </Box>

      {/* 2. Main Customization Workspace */}
      <Box direction="vertical" style={{ flex: 1, minWidth: 0 }} gap="SP4">
        {/* SUBTAB 1: EMAIL & BRANDING */}
        {sub === 'email' ? (
          <Box direction="vertical" gap="SP4">
            {/* Hero Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
                border: '1px solid #DBEAFE',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                fontFamily: FONT_SANS,
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.28)',
                  flexShrink: 0,
                }}
              >
                <Email size="20" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Email Template Designer &amp; Brand Theme
                </span>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Customize automated notification copy, CTA buttons, and brand color palette with real-time desktop preview.
                </span>
              </div>
            </div>

            {/* Split Screen Layout: Left Form + Right Sticky Preview */}
            <Layout gap="24px">
              {/* Left Column: Form Controls */}
              <Cell span={5}>
                <Box direction="vertical" gap="SP4">
                  {/* Card 1: Template Content */}
                  <Card>
                    <Card.Header
                      title="Template Copy &amp; Structure"
                      subtitle="Select an alert trigger and adjust the outgoing message copy"
                    />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="14px">
                        <FormField label="Alert trigger event">
                          <Dropdown
                            selectedId={templateForm.triggerType}
                            options={[
                              { id: 'back_in_stock', value: 'Back in stock' },
                              { id: 'price_drop', value: 'Price drop' },
                              { id: 'seller_oos', value: 'Seller out of stock' },
                              { id: 'seller_low_stock', value: 'Seller low stock' },
                              { id: 'seller_new_order', value: 'Seller new order' },
                              { id: 'digest', value: 'Weekly digest' },
                            ]}
                            onSelect={(opt) => {
                              if (opt?.id != null) onTemplateTriggerChange(String(opt.id));
                            }}
                          />
                        </FormField>

                        <FormField label="Email layout style">
                          <Dropdown
                            selectedId={templateForm.layout}
                            options={['Classic', 'Centered', 'Minimal'].map((id) => ({
                              id,
                              value: id,
                            }))}
                            onSelect={(opt) =>
                              setTemplateForm((f) => ({ ...f, layout: String(opt?.id) }))
                            }
                          />
                        </FormField>

                        <FormField
                          label="Insert dynamic variable"
                          infoContent="Click any variable tag to insert it at the cursor position in the body text."
                        >
                          <Dropdown
                            placeholder="Select variable to insert…"
                            options={TEMPLATE_VARIABLES.map((v) => ({ id: v, value: v }))}
                            onSelect={(opt) => {
                              if (opt?.id) {
                                insertVariable(
                                  'body',
                                  String(opt.id),
                                  templateForm,
                                  setTemplateForm,
                                );
                              }
                            }}
                          />
                        </FormField>

                        <FormField label="Subject line">
                          <Input
                            value={templateForm.subject}
                            onChange={(e) =>
                              setTemplateForm((f) => ({ ...f, subject: e.target.value }))
                            }
                            placeholder="e.g. {product_name} is back in stock ✨"
                          />
                        </FormField>

                        <FormField label="Preheader text (Inbox snippet)">
                          <Input
                            value={templateForm.preheader}
                            onChange={(e) =>
                              setTemplateForm((f) => ({ ...f, preheader: e.target.value }))
                            }
                            placeholder="e.g. The wait is over — grab it before it sells out"
                          />
                        </FormField>

                        <FormField label="Main headline">
                          <Input
                            value={templateForm.headline}
                            onChange={(e) =>
                              setTemplateForm((f) => ({ ...f, headline: e.target.value }))
                            }
                            placeholder="e.g. Good news: {product_name} is available again"
                          />
                        </FormField>

                        <FormField label="Message body">
                          <InputArea
                            value={templateForm.body}
                            onChange={(e) =>
                              setTemplateForm((f) => ({ ...f, body: e.target.value }))
                            }
                            rows={5}
                            placeholder="Hi {customer_name}, you asked us to let you know..."
                          />
                        </FormField>

                        <FormField label="Primary button CTA label">
                          <Input
                            value={templateForm.buttonLabel}
                            onChange={(e) =>
                              setTemplateForm((f) => ({ ...f, buttonLabel: e.target.value }))
                            }
                            placeholder="Shop now"
                          />
                        </FormField>

                        <Checkbox
                          checked={templateForm.showProductImage}
                          onChange={() =>
                            setTemplateForm((f) => ({
                              ...f,
                              showProductImage: !f.showProductImage,
                            }))
                          }
                        >
                          Display product thumbnail &amp; name
                        </Checkbox>

                        <Button
                          size="medium"
                          disabled={isSavingTemplate}
                          onClick={async () => {
                            setIsSavingTemplate(true);
                            try {
                              await onRun(async () => {
                                await adminPost({ action: 'saveTemplate', ...templateForm });
                                onReload();
                              }, 'Template saved');
                            } finally {
                              setIsSavingTemplate(false);
                            }
                          }}
                        >
                          {isSavingTemplate ? 'Saving template…' : 'Save Template'}
                        </Button>
                      </Box>
                    </Card.Content>
                  </Card>

                  {/* Card 2: Brand Identity */}
                  <Card>
                    <Card.Header
                      title="Store Brand &amp; Colors"
                      subtitle="Logo image, color palette, and compliance footer"
                    />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="14px">
                        <FormField label="Primary brand color">
                          <ColorInput
                            value={brand.primaryColor || '#0F766E'}
                            onConfirm={(color) => {
                              const hex =
                                typeof color === 'string'
                                  ? color
                                  : (color as { hex?: string })?.hex || '#0F766E';
                              setConfig((c: any) => ({
                                ...c,
                                brand: { ...c.brand, primaryColor: hex },
                              }));
                            }}
                          />
                        </FormField>

                        <FormField label="Secondary brand color">
                          <ColorInput
                            value={brand.secondaryColor || '#134E4A'}
                            onConfirm={(color) => {
                              const hex =
                                typeof color === 'string'
                                  ? color
                                  : (color as { hex?: string })?.hex || '#134E4A';
                              setConfig((c: any) => ({
                                ...c,
                                brand: { ...c.brand, secondaryColor: hex },
                              }));
                            }}
                          />
                        </FormField>

                        <FormField label="Store logo image URL">
                          <Input
                            value={brand.logoUrl || ''}
                            onChange={(e) =>
                              setConfig((c: any) => ({
                                ...c,
                                brand: { ...c.brand, logoUrl: e.target.value },
                              }))
                            }
                            placeholder="https://yourstore.com/logo.png"
                          />
                        </FormField>

                        <FormField label="Compliance &amp; footer text">
                          <InputArea
                            value={brand.footerText || ''}
                            onChange={(e) =>
                              setConfig((c: any) => ({
                                ...c,
                                brand: { ...c.brand, footerText: e.target.value },
                              }))
                            }
                            rows={3}
                            placeholder="You received this email because you subscribed to alerts at Your Store."
                          />
                        </FormField>

                        <Button
                          size="medium"
                          priority="secondary"
                          disabled={isSavingBrand}
                          onClick={async () => {
                            setIsSavingBrand(true);
                            try {
                              await onRun(async () => {
                                await adminPost({
                                  action: 'saveConfig',
                                  patch: { brand: config.brand },
                                });
                              }, 'Brand settings saved');
                            } finally {
                              setIsSavingBrand(false);
                            }
                          }}
                        >
                          {isSavingBrand ? 'Saving brand…' : 'Save Brand Settings'}
                        </Button>
                      </Box>
                    </Card.Content>
                  </Card>
                </Box>
              </Cell>

              {/* Right Column: Live Sticky Desktop Preview */}
              <Cell span={7}>
                <div style={{ position: 'sticky', top: '16px' }}>
                  <LiveEmailPreview
                    subject={templateForm.subject}
                    preheader={templateForm.preheader}
                    headline={templateForm.headline}
                    body={templateForm.body}
                    buttonLabel={templateForm.buttonLabel}
                    primaryColor={brand.primaryColor || '#0F766E'}
                    logoUrl={brand.logoUrl}
                    showProductImage={templateForm.showProductImage}
                  />
                </div>
              </Cell>
            </Layout>
          </Box>
        ) : null}

        {/* SUBTAB 2: STOREFRONT & CORNER WIDGET */}
        {sub === 'storefront' && config ? (
          <Box direction="vertical" gap="SP4">
            {/* Hero Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: '1px solid #DDD6FE',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                fontFamily: FONT_SANS,
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(139, 92, 246, 0.28)',
                  flexShrink: 0,
                }}
              >
                <Package size="20" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#5B21B6' }}>
                  Storefront Notify Widget &amp; Styling
                </span>
                <span style={{ fontSize: '12.5px', color: '#6D28D9' }}>
                  Design the product-page notify form and storefront restock notification badges.
                </span>
              </div>
            </div>

            {/* Split Screen Layout: Left Form + Right Sticky Preview */}
            <Layout gap="24px">
              {/* Left Column: Form Controls */}
              <Cell span={5}>
                <Box direction="vertical" gap="SP4">
                  {/* Card 1: Widget Position & Urgency */}
                  <Card>
                    <Card.Header
                      title="Restock Timer &amp; Urgency"
                      subtitle="Style of customer-facing storefront triggers"
                    />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="14px">
                        <FormField label="Restock countdown timer style">
                          <Dropdown
                            selectedId={appearance.timerStyle || 'pill'}
                            options={[
                              { id: 'pill', value: 'Pill badge (Compact)' },
                              { id: 'blocks', value: 'Blocks (Bold digital counter)' },
                              { id: 'banner', value: 'Banner (Full-width bar)' },
                            ]}
                            onSelect={(opt) =>
                              setConfig((c: any) => ({
                                ...c,
                                appearance: { ...c.appearance, timerStyle: opt?.id },
                              }))
                            }
                          />
                        </FormField>

                        <FormField
                          label="Storefront “Only X left” urgency threshold"
                          infoContent="Displays a low stock warning badge when inventory drops to or below this amount."
                        >
                          <Input
                            type="number"
                            value={String(appearance.stockThreshold ?? 10)}
                            onChange={(e) =>
                              setConfig((c: any) => ({
                                ...c,
                                appearance: {
                                  ...c.appearance,
                                  stockThreshold: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </FormField>
                      </Box>
                    </Card.Content>
                  </Card>

                  {/* Card 2: Theme Colors */}
                  <Card>
                    <Card.Header
                      title="Widget Color Palette"
                      subtitle="Match the notify form to your store theme"
                    />
                    <Card.Divider />
                    <Card.Content>
                      <Layout gap="12px">
                        {(
                          [
                            ['primary', 'Primary accent'],
                            ['secondary', 'Secondary tone'],
                            ['accent', 'Highlight accent'],
                            ['text', 'Main text'],
                            ['background', 'Card background'],
                            ['buttonText', 'Button text'],
                            ['badge', 'Badge color'],
                            ['muted', 'Muted border'],
                          ] as const
                        ).map(([key, label]) => (
                          <Cell key={key} span={6}>
                            <FormField label={label}>
                              <ColorInput
                                value={colors[key] || '#0F766E'}
                                onConfirm={(color) => {
                                  const hex =
                                    typeof color === 'string'
                                      ? color
                                      : (color as { hex?: string })?.hex || '#0F766E';
                                  setConfig((c: any) => ({
                                    ...c,
                                    appearance: {
                                      ...c.appearance,
                                      colors: { ...c.appearance.colors, [key]: hex },
                                    },
                                  }));
                                }}
                              />
                            </FormField>
                          </Cell>
                        ))}
                      </Layout>
                    </Card.Content>
                  </Card>

                  {/* Save Button & Status */}
                  <Box direction="vertical" gap="SP2">
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
                          }, 'Appearance saved');
                        } finally {
                          setIsSavingAppearance(false);
                        }
                      }}
                    >
                      {isSavingAppearance ? 'Saving…' : 'Save Appearance'}
                    </Button>
                  </Box>
                </Box>
              </Cell>

              {/* Right Column: Live Sticky Mobile Preview */}
              <Cell span={7}>
                <div style={{ position: 'sticky', top: '16px' }}>
                  <CornerWidgetPreview
                    appearance={appearance}
                    showWhatsapp={Boolean(config?.modules?.manualWhatsapp !== false)}
                  />
                </div>
              </Cell>
            </Layout>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
