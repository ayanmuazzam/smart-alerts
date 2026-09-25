import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Cell,
  Checkbox,
  ColorInput,
  FormField,
  Input,
  InputArea,
  Layout,
  Text,
} from '@wix/design-system';
import {
  Email,
  Package,
  Tag,
  StatusAlert,
  Sparkles,
  DateAndTime,
  SettingsSmall,
  Check,
  Edit,
  MagicWandSmall,
} from '@wix/wix-ui-icons-common';
import { LiveEmailPreview } from '../components/LiveEmailPreview';
import { TEMPLATE_VARIABLES } from '../adminApi';
import { getDefaultEmailTemplate } from '../../../../../lib/smart-alerts/constants';

export type TemplateForm = {
  triggerType: string;
  layout: string;
  subject: string;
  preheader: string;
  headerStyle: 'dark' | 'brand' | 'white';
  headerText: string;
  showBadge: boolean;
  badgeText: string;
  headline: string;
  body: string;
  showProductImage: boolean;
  reviewQuote: string;
  buttonLabel: string;
  showFeatures: boolean;
  featuresTitle: string;
  featuresText: string;
  closingText: string;
  signoffText: string;
  footerDisclaimer: string;
};

type Props = {
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

const TRIGGER_TABS = [
  { id: 'back_in_stock', label: 'Back in Stock', audience: 'Shoppers', icon: <Package size="14" /> },
  { id: 'price_drop', label: 'Price Drop', audience: 'Shoppers', icon: <Tag size="14" /> },
  { id: 'seller_low_stock', label: 'Low Stock', audience: 'Store Owner', icon: <StatusAlert size="14" /> },
  { id: 'seller_oos', label: 'Out of Stock', audience: 'Store Owner', icon: <StatusAlert size="14" /> },
  { id: 'seller_new_order', label: 'New Order', audience: 'Store Owner', icon: <Sparkles size="14" /> },
  { id: 'digest', label: 'Weekly Digest', audience: 'Store Owner', icon: <DateAndTime size="14" /> },
];

const PRESET_COLORS = [
  { label: 'Wix Blue', hex: '#116DFF' },
  { label: 'Royal Blue', hex: '#2563EB' },
  { label: 'Indigo', hex: '#4F46E5' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Amber', hex: '#D97706' },
  { label: 'Rose', hex: '#E11D48' },
  { label: 'Midnight', hex: '#0F172A' },
];

const LAYOUT_OPTIONS = [
  { id: 'Centered', title: 'Centered (Hero)', desc: 'Recommended e-commerce layout' },
  { id: 'Classic', title: 'Classic (Left)', desc: 'Standard left-aligned message' },
  { id: 'Minimal', title: 'Minimal', desc: 'Compact notification text' },
];

function insertVariable(
  field: keyof TemplateForm,
  variable: string,
  form: TemplateForm,
  setForm: React.Dispatch<React.SetStateAction<TemplateForm>>,
) {
  const current = String(form[field] ?? '');
  const spacer = current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
  setForm((f) => ({ ...f, [field]: `${current}${spacer}${variable}` }));
}

export function EmailCustomizationScreen({
  config,
  setConfig,
  templateForm,
  setTemplateForm,
  onTemplateTriggerChange,
  onRun,
  adminPost,
  onReload,
}: Props) {
  const [editorSection, setEditorSection] = useState<'content' | 'brand'>('content');
  const [activeFormTab, setActiveFormTab] = useState<'header' | 'body' | 'product' | 'cta' | 'footer'>('body');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const brand = config?.brand || {};

  // One-click quick load of the high-converting reference template
  const loadHtmlReferenceTemplate = () => {
    setTemplateForm((prev) => ({
      ...prev,
      layout: 'Centered',
      subject: '{product_name} is back in stock 🎉',
      preheader: 'The wait is over — grab yours before it sells out again',
      headerStyle: 'dark',
      headerText: 'YOUR BRAND',
      showBadge: true,
      badgeText: 'Back in Stock 🎉',
      headline: "It's finally here!",
      body:
        'Hi {customer_name},\n\nGreat news—the item you were waiting for is officially restocked. Quantities are limited, so grab yours before it sells out again!',
      showProductImage: true,
      reviewQuote: '"Literally fits my entire life and goes with every outfit." — Sarah M.',
      buttonLabel: 'Shop Now Before It Sells Out',
      showFeatures: true,
      featuresTitle: "Why you'll love it:",
      featuresText:
        '100% Full-Grain Leather: Built to last a lifetime.\nPadded Sleeve: Fits laptops up to 15".\nFast Delivery: Free express shipping on this order.',
      closingText: 'Thanks for waiting patiently—happy shopping!',
      signoffText: 'The Your Brand Team',
      footerDisclaimer: 'You received this email because you signed up for back-in-stock alerts.',
    }));
  };

  return (
    <Box direction="vertical" gap="SP4">
      {/* 1. Full-Width Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
          border: '1px solid #DBEAFE',
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
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.28)',
              flexShrink: 0,
            }}
          >
            <Email size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Email Template Designer &amp; Brand Studio
            </span>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              Full control over header, badge, copy, product card, social proof quote, CTA, perks box, and footer.
            </span>
          </div>
        </div>

        {/* Quick Section Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#FFFFFF',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setEditorSection('content')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: editorSection === 'content' ? '#116DFF' : 'transparent',
                color: editorSection === 'content' ? '#FFFFFF' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: FONT_SANS,
              }}
            >
              <Edit size="14" />
              <span>Template Designer</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorSection('brand')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: editorSection === 'brand' ? '#116DFF' : 'transparent',
                color: editorSection === 'brand' ? '#FFFFFF' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: FONT_SANS,
              }}
            >
              <SettingsSmall size="14" />
              <span>Brand Theme &amp; Colors</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side 50/50 Split Layout */}
      <Layout gap="24px">
        {/* Left Column: Full Controls Editor */}
        <Cell span={6}>
          {editorSection === 'content' ? (
            <Card>
              <Card.Header
                title="Email Template Controls"
                subtitle="Fine-tune every visual component of your automated store alerts"
                suffix={
                  <Button
                    size="small"
                    priority="secondary"
                    prefixIcon={<MagicWandSmall />}
                    onClick={loadHtmlReferenceTemplate}
                  >
                    Load Reference Template
                  </Button>
                }
              />
              <Card.Divider />
              <Card.Content>
                <Box direction="vertical" gap="16px">
                  {/* Step 1: Trigger Event Selector Pills */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        Alert Trigger Event
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                        {TRIGGER_TABS.find((t) => t.id === templateForm.triggerType)?.audience === 'Shoppers'
                          ? 'Audience: Subscribed Shoppers'
                          : 'Audience: Store Manager'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {TRIGGER_TABS.map((item) => {
                        const isSelected = templateForm.triggerType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onTemplateTriggerChange(item.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #116DFF' : '1px solid #E2E8F0',
                              backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                              color: isSelected ? '#116DFF' : '#475569',
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 1px 3px rgba(17, 109, 255, 0.15)' : 'none',
                              fontFamily: FONT_SANS,
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Component Navigation Sub-tabs */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                      Customize Email Components:
                    </div>
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
                        { id: 'header', label: '1. Header & Badge' },
                        { id: 'body', label: '2. Headline & Copy' },
                        { id: 'product', label: '3. Product & Quote' },
                        { id: 'cta', label: '4. CTA & Highlights' },
                        { id: 'footer', label: '5. Sign-off & Footer' },
                      ].map((tab) => {
                        const isAct = activeFormTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveFormTab(tab.id as any)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: isAct ? '#FFFFFF' : 'transparent',
                              color: isAct ? '#116DFF' : '#475569',
                              fontWeight: isAct ? 700 : 500,
                              fontSize: '11.5px',
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
                  </div>

                  {/* TAB 1: Header & Announcement Badge */}
                  {activeFormTab === 'header' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <FormField label="Header Bar Theme Style">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { id: 'dark', label: 'Dark (#111827)', bg: '#111827', text: '#FFFFFF' },
                            { id: 'brand', label: 'Brand Primary', bg: brand.primaryColor || '#2563EB', text: '#FFFFFF' },
                            { id: 'white', label: 'Clean White', bg: '#FFFFFF', text: '#111827', border: '1px solid #CBD5E1' },
                          ].map((h) => {
                            const isSelected = (templateForm.headerStyle || 'dark') === h.id;
                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => setTemplateForm((f) => ({ ...f, headerStyle: h.id as any }))}
                                style={{
                                  padding: '10px 8px',
                                  borderRadius: '8px',
                                  border: isSelected ? '2px solid #116DFF' : h.border || '1px solid #E2E8F0',
                                  backgroundColor: h.bg,
                                  color: h.text,
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  boxShadow: isSelected ? '0 0 0 2px rgba(17, 109, 255, 0.2)' : 'none',
                                }}
                              >
                                {h.label}
                              </button>
                            );
                          })}
                        </div>
                      </FormField>

                      <FormField
                        label="Header Bar Brand Title / Text"
                        infoContent="Displayed in uppercase header if no logo image is uploaded."
                      >
                        <Input
                          value={templateForm.headerText || ''}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, headerText: e.target.value }))}
                          placeholder="e.g. YOUR BRAND or {store_name}"
                        />
                      </FormField>

                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                      >
                        <Checkbox
                          checked={templateForm.showBadge !== false}
                          onChange={() =>
                            setTemplateForm((f) => ({
                              ...f,
                              showBadge: f.showBadge === false,
                            }))
                          }
                        >
                          Display highlight badge pill above headline
                        </Checkbox>

                        {templateForm.showBadge !== false && (
                          <div style={{ marginTop: '10px' }}>
                            <FormField label="Badge Pill Copy">
                              <Input
                                value={templateForm.badgeText || ''}
                                onChange={(e) => setTemplateForm((f) => ({ ...f, badgeText: e.target.value }))}
                                placeholder="e.g. Back in Stock 🎉"
                              />
                            </FormField>
                          </div>
                        )}
                      </div>

                      <FormField label="Email Layout Style">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {LAYOUT_OPTIONS.map((l) => {
                            const isSel = (templateForm.layout || 'Centered').toLowerCase() === l.id.toLowerCase();
                            return (
                              <div
                                key={l.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setTemplateForm((f) => ({ ...f, layout: l.id }))}
                                style={{
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: isSel ? '2px solid #116DFF' : '1px solid #E2E8F0',
                                  backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s ease',
                                  fontFamily: FONT_SANS,
                                }}
                              >
                                <div style={{ fontSize: '12px', fontWeight: 600, color: isSel ? '#116DFF' : '#0F172A' }}>
                                  {l.title}
                                </div>
                                <div style={{ fontSize: '10.5px', color: isSel ? '#3B82F6' : '#64748B' }}>
                                  {l.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </FormField>
                    </div>
                  )}

                  {/* TAB 2: Headline & Message Body */}
                  {activeFormTab === 'body' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <FormField label="Subject line">
                        <Input
                          value={templateForm.subject}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
                          placeholder="e.g. {product_name} is back in stock 🎉"
                        />
                      </FormField>

                      <FormField label="Preheader snippet (Inbox summary snippet)">
                        <Input
                          value={templateForm.preheader}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, preheader: e.target.value }))}
                          placeholder="e.g. The wait is over — grab yours before it sells out"
                        />
                      </FormField>

                      <FormField label="Email main headline">
                        <Input
                          value={templateForm.headline}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, headline: e.target.value }))}
                          placeholder="e.g. It's finally here!"
                        />
                      </FormField>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                            Greeting &amp; Message Body
                          </span>
                        </div>

                        {/* Clickable Variable Tag Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, alignSelf: 'center', marginRight: '2px' }}>
                            Insert:
                          </span>
                          {TEMPLATE_VARIABLES.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => insertVariable('body', v, templateForm, setTemplateForm)}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '12px',
                                color: '#1D4ED8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontFamily: FONT_SANS,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#DBEAFE';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#EFF6FF';
                              }}
                            >
                              + {v}
                            </button>
                          ))}
                        </div>

                        <InputArea
                          value={templateForm.body}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                          rows={6}
                          placeholder="Hi {customer_name},\n\nGreat news—the item you were waiting for is officially restocked..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Product Card & Social Proof Quote */}
                  {activeFormTab === 'product' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <Checkbox
                        checked={templateForm.showProductImage}
                        onChange={() =>
                          setTemplateForm((f) => ({
                            ...f,
                            showProductImage: !f.showProductImage,
                          }))
                        }
                      >
                        Include product card (Photo, Title, Price, Status)
                      </Checkbox>

                      <FormField
                        label="Customer Review / Social Proof Quote"
                        infoContent="Adding genuine social proof in restock alerts gives customers the confidence to complete checkout immediately."
                      >
                        <Input
                          value={templateForm.reviewQuote || ''}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, reviewQuote: e.target.value }))}
                          placeholder='e.g. "Literally fits my entire life and goes with every outfit." — Sarah M.'
                        />
                      </FormField>

                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          color: '#64748B',
                          lineHeight: '1.5',
                        }}
                      >
                        💡 <strong>Dynamic Product Data:</strong> The actual product image, item name, and current pricing will automatically be populated from your store catalog when triggered.
                      </div>
                    </div>
                  )}

                  {/* TAB 4: CTA Button & Value Props / Highlights Box */}
                  {activeFormTab === 'cta' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <FormField label="Primary CTA Button Label">
                        <Input
                          value={templateForm.buttonLabel}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, buttonLabel: e.target.value }))}
                          placeholder="e.g. Shop Now Before It Sells Out"
                        />
                      </FormField>

                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                      >
                        <Checkbox
                          checked={templateForm.showFeatures ?? false}
                          onChange={() =>
                            setTemplateForm((f) => ({
                              ...f,
                              showFeatures: !f.showFeatures,
                            }))
                          }
                        >
                          Include "Why you'll love it" / Highlights List Box
                        </Checkbox>

                        {(templateForm.showFeatures ?? false) && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormField label="Highlights Box Header">
                              <Input
                                value={templateForm.featuresTitle || "Why you'll love it:"}
                                onChange={(e) => setTemplateForm((f) => ({ ...f, featuresTitle: e.target.value }))}
                                placeholder="Why you'll love it:"
                              />
                            </FormField>

                            <FormField
                              label="Bullet Points (One per line)"
                              infoContent="Enter 2-4 key features, guarantees, or shipping perks."
                            >
                              <InputArea
                                value={templateForm.featuresText || ''}
                                onChange={(e) => setTemplateForm((f) => ({ ...f, featuresText: e.target.value }))}
                                rows={4}
                                placeholder="100% Full-Grain Leather: Built to last a lifetime.&#10;Padded Sleeve: Fits laptops up to 15&#34;.&#10;Fast Delivery: Free express shipping on this order."
                              />
                            </FormField>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Closing, Sign-off & Footer Disclaimer */}
                  {activeFormTab === 'footer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <FormField label="Closing Sentences">
                        <Input
                          value={templateForm.closingText || ''}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, closingText: e.target.value }))}
                          placeholder="e.g. Thanks for waiting patiently—happy shopping!"
                        />
                      </FormField>

                      <FormField label="Team Sign-off / Signature">
                        <Input
                          value={templateForm.signoffText || ''}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, signoffText: e.target.value }))}
                          placeholder="e.g. The {store_name} Team"
                        />
                      </FormField>

                      <FormField label="Footer Compliance &amp; Disclaimer Text">
                        <InputArea
                          value={templateForm.footerDisclaimer || ''}
                          onChange={(e) => setTemplateForm((f) => ({ ...f, footerDisclaimer: e.target.value }))}
                          rows={2}
                          placeholder="You received this email because you signed up for back-in-stock alerts."
                        />
                      </FormField>
                    </div>
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
                      {isSavingTemplate ? 'Saving template…' : 'Save Template Changes'}
                    </Button>
                    <Button
                      priority="secondary"
                      size="medium"
                      onClick={() => {
                        const def = getDefaultEmailTemplate(templateForm.triggerType);
                        setTemplateForm((prev) => ({
                          ...prev,
                          layout: def.layout,
                          subject: def.subject,
                          preheader: def.preheader,
                          headerStyle: def.headerStyle || 'dark',
                          headerText: def.headerText || '{store_name}',
                          showBadge: def.showBadge ?? true,
                          badgeText: def.badgeText || 'Back in Stock 🎉',
                          headline: def.headline,
                          body: def.body,
                          buttonLabel: def.buttonLabel,
                          showProductImage: def.showProductImage,
                          reviewQuote: def.reviewQuote || '',
                          showFeatures: def.showFeatures ?? false,
                          featuresTitle: def.featuresTitle || "Why you'll love it:",
                          featuresText: def.featuresText || '',
                          closingText: def.closingText || '',
                          signoffText: def.signoffText || 'The {store_name} Team',
                          footerDisclaimer: def.footerDisclaimer || '',
                        }));
                      }}
                    >
                      Reset to Default Copy
                    </Button>
                  </div>
                </Box>
              </Card.Content>
            </Card>
          ) : (
            <Card>
              <Card.Header
                title="Brand Theme &amp; Accent Palette"
                subtitle="Configure store logo, primary brand accents, and compliance footer"
              />
              <Card.Divider />
              <Card.Content>
                <Box direction="vertical" gap="16px">
                  <FormField label="Primary brand color (CTA buttons &amp; accents)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map((color) => {
                          const isSel = (brand.primaryColor || '#2563EB').toLowerCase() === color.hex.toLowerCase();
                          return (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() =>
                                setConfig((c: any) => ({
                                  ...c,
                                  brand: { ...c.brand, primaryColor: color.hex },
                                }))
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: isSel ? '2px solid #116DFF' : '1px solid #CBD5E1',
                                backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#334155',
                                fontFamily: FONT_SANS,
                              }}
                            >
                              <span
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: color.hex,
                                  display: 'inline-block',
                                }}
                              />
                              <span>{color.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <ColorInput
                        value={brand.primaryColor || '#2563EB'}
                        onConfirm={(color) => {
                          const hex =
                            typeof color === 'string'
                              ? color
                              : (color as { hex?: string })?.hex || '#2563EB';
                          setConfig((c: any) => ({
                            ...c,
                            brand: { ...c.brand, primaryColor: hex },
                          }));
                        }}
                      />
                    </div>
                  </FormField>

                  <FormField label="Secondary brand accent color">
                    <ColorInput
                      value={brand.secondaryColor || '#1D4ED8'}
                      onConfirm={(color) => {
                        const hex =
                          typeof color === 'string'
                            ? color
                            : (color as { hex?: string })?.hex || '#1D4ED8';
                        setConfig((c: any) => ({
                          ...c,
                          brand: { ...c.brand, secondaryColor: hex },
                        }));
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Store logo image URL"
                    infoContent="Displayed in the header bar of all customer alert emails."
                  >
                    <Box direction="vertical" gap="8px">
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
                      {brand.logoUrl && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                          }}
                        >
                          <img
                            src={brand.logoUrl}
                            alt="Logo preview"
                            style={{ maxHeight: '32px', maxWidth: '120px', objectFit: 'contain' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748B' }}>Logo preview</span>
                          <button
                            type="button"
                            onClick={() =>
                              setConfig((c: any) => ({
                                ...c,
                                brand: { ...c.brand, logoUrl: '' },
                              }))
                            }
                            style={{
                              marginLeft: 'auto',
                              fontSize: '11px',
                              color: '#EF4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Clear logo
                          </button>
                        </div>
                      )}
                    </Box>
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
          )}
        </Cell>

        {/* Right Column: Sticky Live Desktop / Mobile Preview */}
        <Cell span={6}>
          <div style={{ position: 'sticky', top: '16px' }}>
            <LiveEmailPreview
              subject={templateForm.subject}
              preheader={templateForm.preheader}
              headerStyle={templateForm.headerStyle || 'dark'}
              headerText={templateForm.headerText || brand.name || 'YOUR BRAND'}
              showBadge={templateForm.showBadge !== false}
              badgeText={templateForm.badgeText || 'Back in Stock 🎉'}
              headline={templateForm.headline}
              body={templateForm.body}
              buttonLabel={templateForm.buttonLabel}
              showProductImage={templateForm.showProductImage}
              reviewQuote={templateForm.reviewQuote}
              showFeatures={templateForm.showFeatures}
              featuresTitle={templateForm.featuresTitle}
              featuresText={templateForm.featuresText}
              closingText={templateForm.closingText}
              signoffText={templateForm.signoffText}
              footerDisclaimer={templateForm.footerDisclaimer}
              primaryColor={brand.primaryColor || '#2563EB'}
              logoUrl={brand.logoUrl}
              layout={templateForm.layout || 'Centered'}
            />
          </div>
        </Cell>
      </Layout>
    </Box>
  );
}
