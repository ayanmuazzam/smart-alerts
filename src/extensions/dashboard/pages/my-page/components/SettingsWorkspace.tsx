import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Cell,
  FormField,
  Input,
  Layout,
  NumberInput,
} from '@wix/design-system';
import { SettingsSmall, Email, Chat } from '@wix/wix-ui-icons-common';
import { MonoIconBadge } from './MonoIconBadge';

export interface SettingsWorkspaceProps {
  config: any;
  setConfig: (updater: any) => void;
  onSavePatch: (patch: Record<string, unknown>, msg: string) => Promise<void> | void;
  onResetSettings: () => Promise<void> | void;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function SettingsWorkspace({
  config,
  setConfig,
  onSavePatch,
  onResetSettings,
}: SettingsWorkspaceProps) {
  const [savingSection, setSavingSection] = useState<string | null>(null);

  if (!config) return null;

  const handleSave = async (section: string, patch: Record<string, unknown>, msg: string) => {
    setSavingSection(section);
    try {
      await onSavePatch(patch, msg);
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
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
        <MonoIconBadge tone="blue" size={42} radius={10}>
          <SettingsSmall size="20" />
        </MonoIconBadge>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Account &amp; Support Routing
          </span>
          <span style={{ fontSize: '12.5px', color: '#64748B' }}>
            Define where seller inventory alerts are dispatched and where customer reply inquiries are routed.
          </span>
        </div>
      </div>

      <Card>
        <Card.Header
          title="Communication & Support Channels"
          subtitle="Email addresses and WhatsApp numbers used for notification delivery and customer support"
        />
        <Card.Divider />
        <Card.Content>
          <Layout gap="16px">
            <Cell span={6}>
              <FormField label="Seller notification email">
                <Input
                  prefix={<Email size="16" />}
                  type="email"
                  value={config.sellerEmail || ''}
                  onChange={(e) =>
                    setConfig((c: any) => ({ ...c, sellerEmail: e.target.value }))
                  }
                  placeholder="seller@yourstore.com"
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Customer support email">
                <Input
                  prefix={<Email size="16" />}
                  type="email"
                  value={config.support?.supportEmail || ''}
                  onChange={(e) =>
                    setConfig((c: any) => ({
                      ...c,
                      support: { ...c.support, supportEmail: e.target.value },
                    }))
                  }
                  placeholder="support@yourstore.com"
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Support WhatsApp number (E.164 format)">
                <Input
                  prefix={<Chat size="16" />}
                  value={config.support?.supportWhatsapp || ''}
                  onChange={(e) =>
                    setConfig((c: any) => ({
                      ...c,
                      support: { ...c.support, supportWhatsapp: e.target.value },
                    }))
                  }
                  placeholder="+15551234567"
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Monthly alert dispatch quota">
                <NumberInput
                  min={100}
                  step={500}
                  value={config.monthlyAlertQuota ?? 5000}
                  onChange={(value) =>
                    setConfig((c: any) => ({
                      ...c,
                      monthlyAlertQuota: Number(value ?? 5000),
                    }))
                  }
                />
              </FormField>
            </Cell>
          </Layout>
        </Card.Content>
      </Card>

      <Box gap="SP3" verticalAlign="middle" align="space-between">
        <Button
          size="medium"
          disabled={savingSection === 'general'}
          onClick={() =>
            handleSave(
              'general',
              {
                sellerEmail: config.sellerEmail,
                support: config.support,
                monthlyAlertQuota: config.monthlyAlertQuota,
              },
              'Account settings saved',
            )
          }
        >
          {savingSection === 'general' ? 'Saving changes…' : 'Save Changes'}
        </Button>

        <Button
          size="medium"
          skin="destructive"
          priority="secondary"
          onClick={() => {
            if (
              !window.confirm(
                'Reset all Smart Alerts configuration to system defaults? This cannot be undone.',
              )
            )
              return;
            onResetSettings();
          }}
        >
          Reset to defaults
        </Button>
      </Box>
    </Box>
  );
}
