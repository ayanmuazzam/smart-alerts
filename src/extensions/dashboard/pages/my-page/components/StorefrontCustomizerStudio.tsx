import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Cell,
  ColorInput,
  Dropdown,
  FormField,
  Layout,
  NumberInput,
  Text,
} from '@wix/design-system';
import { CornerWidgetPreview } from './CornerWidgetPreview';

export interface StorefrontCustomizerStudioProps {
  config: any;
  setConfig: (updater: any) => void;
  onSave: (patch: { appearance: any; brand: any }) => Promise<void>;
}

const TIMER_OPTIONS = [
  { id: 'pill', value: 'Pill' },
  { id: 'blocks', value: 'Blocks' },
  { id: 'banner', value: 'Banner' },
];

export function StorefrontCustomizerStudio({
  config,
  setConfig,
  onSave,
}: StorefrontCustomizerStudioProps) {
  const appearance = config?.appearance || {};
  const brand = config?.brand || {};
  const timerStyle: string = appearance.timerStyle || 'pill';
  const primaryColor: string = brand.primaryColor || '#0F766E';
  const stockThreshold: number = appearance.stockThreshold ?? 5;
  const [isSaving, setIsSaving] = useState(false);

  const updateAppearance = (patch: Record<string, unknown>) => {
    setConfig((c: any) => ({
      ...c,
      appearance: { ...(c?.appearance || {}), ...patch },
    }));
  };

  const updateBrand = (patch: Record<string, unknown>) => {
    setConfig((c: any) => ({
      ...c,
      brand: { ...(c?.brand || {}), ...patch },
    }));
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onSave({
        appearance: config.appearance,
        brand: config.brand,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <Cell span={6}>
        <Card>
          <Card.Header
            title="Storefront widget"
            subtitle="Timer style and urgency threshold"
            suffix={
              <Button size="small" disabled={isSaving} onClick={handlePublish}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            }
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={12}>
                <FormField label="Timer style">
                  <Dropdown
                    selectedId={timerStyle}
                    options={TIMER_OPTIONS}
                    onSelect={(option) =>
                      updateAppearance({ timerStyle: String(option.id) })
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Widget color">
                  <ColorInput
                    value={primaryColor}
                    onConfirm={(color) => {
                      if (typeof color === 'string') updateBrand({ primaryColor: color });
                    }}
                    onChange={(color) => {
                      if (typeof color === 'string') updateBrand({ primaryColor: color });
                    }}
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Stock counter threshold">
                  <NumberInput
                    value={stockThreshold}
                    min={1}
                    max={99}
                    onChange={(value) =>
                      updateAppearance({ stockThreshold: Number(value ?? 5) })
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={12}>
                <Text size="small" secondary>
                  Saving publishes appearance settings for the product-page notify widget.
                </Text>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>
      </Cell>
      <Cell span={6}>
        <CornerWidgetPreview
          appearance={appearance}
          showWhatsapp={Boolean(config?.modules?.manualWhatsapp !== false)}
        />
      </Cell>
    </Layout>
  );
}
