import React, { useState } from 'react';
import {
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
  TextButton,
} from '@wix/design-system';
import { TEMPLATE_VARIABLES } from '../adminApi';
import { LiveEmailPreview } from './LiveEmailPreview';

export interface TemplateFormData {
  triggerType: string;
  layout: string;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  buttonLabel: string;
  showProductImage: boolean;
}

export interface EmailTemplateStudioProps {
  templateForm: TemplateFormData;
  setTemplateForm: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  onTemplateTriggerChange: (triggerType: string) => void;
  config: any;
  setConfig: (updater: any) => void;
  onSaveTemplate: () => Promise<void>;
  onSaveBrand: () => Promise<void>;
}

const TRIGGER_OPTIONS = [
  { id: 'back_in_stock', value: 'Back in stock' },
  { id: 'price_drop', value: 'Price drop' },
  { id: 'seller_oos', value: 'Seller out of stock' },
  { id: 'seller_low_stock', value: 'Seller low stock' },
  { id: 'seller_new_order', value: 'Seller new order' },
  { id: 'digest', value: 'Weekly digest' },
];

const LAYOUT_OPTIONS = [
  { id: 'Classic', value: 'Classic' },
  { id: 'Centered', value: 'Centered' },
  { id: 'Minimal', value: 'Minimal' },
];

export function EmailTemplateStudio({
  templateForm,
  setTemplateForm,
  onTemplateTriggerChange,
  config,
  setConfig,
  onSaveTemplate,
  onSaveBrand,
}: EmailTemplateStudioProps) {
  const brand = config?.brand || {};
  const primaryColor = brand.primaryColor || '#0F766E';
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  const insertVariable = (variable: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      body: `${prev.body || ''}${variable}`,
    }));
  };

  return (
    <Layout>
      <Cell span={6}>
        <Box direction="vertical" gap="SP4">
          <Card>
            <Card.Header
              title="Email template"
              subtitle="Copy, layout, and variables for store alerts"
              suffix={
                <Button
                  size="small"
                  disabled={savingTemplate}
                  onClick={async () => {
                    setSavingTemplate(true);
                    try {
                      await onSaveTemplate();
                    } finally {
                      setSavingTemplate(false);
                    }
                  }}
                >
                  {savingTemplate ? 'Saving…' : 'Save template'}
                </Button>
              }
            />
            <Card.Divider />
            <Card.Content>
              <Layout gap="12px">
                <Cell span={6}>
                  <FormField label="Alert type">
                    <Dropdown
                      selectedId={templateForm.triggerType}
                      options={TRIGGER_OPTIONS}
                      onSelect={(option) =>
                        onTemplateTriggerChange(String(option.id))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={6}>
                  <FormField label="Layout">
                    <Dropdown
                      selectedId={templateForm.layout || 'Classic'}
                      options={LAYOUT_OPTIONS}
                      onSelect={(option) =>
                        setTemplateForm((f) => ({ ...f, layout: String(option.id) }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Subject">
                    <Input
                      value={templateForm.subject}
                      onChange={(e) =>
                        setTemplateForm((f) => ({ ...f, subject: e.target.value }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Preheader">
                    <Input
                      value={templateForm.preheader}
                      onChange={(e) =>
                        setTemplateForm((f) => ({ ...f, preheader: e.target.value }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Headline">
                    <Input
                      value={templateForm.headline}
                      onChange={(e) =>
                        setTemplateForm((f) => ({ ...f, headline: e.target.value }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Body">
                    <InputArea
                      rows={4}
                      resizable
                      value={templateForm.body}
                      onChange={(e) =>
                        setTemplateForm((f) => ({ ...f, body: e.target.value }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <Box gap="SP1" marginBottom="SP2">
                    <Text size="tiny" secondary>
                      Insert variable:
                    </Text>
                    {TEMPLATE_VARIABLES.map((v) => (
                      <TextButton key={v} size="tiny" onClick={() => insertVariable(v)}>
                        {v}
                      </TextButton>
                    ))}
                  </Box>
                </Cell>
                <Cell span={6}>
                  <FormField label="Button label">
                    <Input
                      value={templateForm.buttonLabel}
                      onChange={(e) =>
                        setTemplateForm((f) => ({ ...f, buttonLabel: e.target.value }))
                      }
                    />
                  </FormField>
                </Cell>
                <Cell span={6}>
                  <FormField label=" ">
                    <Checkbox
                      checked={templateForm.showProductImage}
                      onChange={() =>
                        setTemplateForm((f) => ({
                          ...f,
                          showProductImage: !f.showProductImage,
                        }))
                      }
                    >
                      Show product image
                    </Checkbox>
                  </FormField>
                </Cell>
              </Layout>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header
              title="Email brand"
              subtitle="Applies to all store alert emails"
              suffix={
                <Button
                  size="small"
                  priority="secondary"
                  disabled={savingBrand}
                  onClick={async () => {
                    setSavingBrand(true);
                    try {
                      await onSaveBrand();
                    } finally {
                      setSavingBrand(false);
                    }
                  }}
                >
                  {savingBrand ? 'Saving…' : 'Save brand'}
                </Button>
              }
            />
            <Card.Divider />
            <Card.Content>
              <Layout gap="12px">
                <Cell span={6}>
                  <FormField label="Primary color">
                    <ColorInput
                      value={primaryColor}
                      onConfirm={(color) =>
                        setConfig((c: any) => ({
                          ...c,
                          brand: {
                            ...(c?.brand || {}),
                            primaryColor: typeof color === 'string' ? color : primaryColor,
                          },
                        }))
                      }
                      onChange={(color) => {
                        if (typeof color === 'string') {
                          setConfig((c: any) => ({
                            ...c,
                            brand: { ...(c?.brand || {}), primaryColor: color },
                          }));
                        }
                      }}
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Logo URL">
                    <Input
                      value={brand.logoUrl || ''}
                      onChange={(e) =>
                        setConfig((c: any) => ({
                          ...c,
                          brand: { ...(c?.brand || {}), logoUrl: e.target.value },
                        }))
                      }
                      placeholder="https://"
                    />
                  </FormField>
                </Cell>
                <Cell span={12}>
                  <FormField label="Footer text">
                    <Input
                      value={brand.footerText || ''}
                      onChange={(e) =>
                        setConfig((c: any) => ({
                          ...c,
                          brand: { ...(c?.brand || {}), footerText: e.target.value },
                        }))
                      }
                      placeholder="{store_name} · Manage alerts"
                    />
                  </FormField>
                </Cell>
              </Layout>
            </Card.Content>
          </Card>
        </Box>
      </Cell>

      <Cell span={6}>
        <LiveEmailPreview
          subject={templateForm.subject}
          preheader={templateForm.preheader}
          headline={templateForm.headline}
          body={templateForm.body}
          buttonLabel={templateForm.buttonLabel}
          primaryColor={primaryColor}
          logoUrl={brand.logoUrl}
          showProductImage={templateForm.showProductImage}
        />
      </Cell>
    </Layout>
  );
}
