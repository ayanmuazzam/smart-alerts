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
  SectionHelper,
  TextButton,
} from '@wix/design-system';
import { SettingsSmall, Email } from '@wix/wix-ui-icons-common';
import {
  buildAppUpgradeUrl,
  DEFAULT_QUOTA,
} from '../../../../../lib/smart-alerts/constants';
import { MonoIconBadge } from './MonoIconBadge';

export type PlanInfo = {
  isPro: boolean;
  isFree: boolean;
  productId: string;
  instanceId?: string;
  upgradeUrl?: string;
  canEditAccountSettings: boolean;
};

export interface SettingsWorkspaceProps {
  config: any;
  setConfig: (updater: any) => void;
  onSavePatch: (patch: Record<string, unknown>, msg: string) => Promise<void> | void;
  onResetSettings: () => Promise<void> | void;
  plan?: PlanInfo | null;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function SettingsWorkspace({
  config,
  setConfig,
  onSavePatch,
  onResetSettings,
  plan,
}: SettingsWorkspaceProps) {
  const [savingSection, setSavingSection] = useState<string | null>(null);

  if (!config) return null;

  // Until plan loads, treat as locked (Basic) so Free users never see editable fields briefly.
  const canEdit = plan != null && Boolean(plan.canEditAccountSettings);
  const upgradeUrl = plan?.upgradeUrl || buildAppUpgradeUrl(plan?.instanceId);
  const quotaValue = canEdit
    ? Number(config.monthlyAlertQuota ?? DEFAULT_QUOTA)
    : DEFAULT_QUOTA;

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
            Account &amp; Alert Routing
          </span>
          <span style={{ fontSize: '12.5px', color: '#64748B' }}>
            Define where seller inventory alerts are dispatched and set your monthly send quota.
          </span>
        </div>
      </div>

      {!canEdit ? (
        <SectionHelper appearance="warning" title={`Basic plan — ${DEFAULT_QUOTA} emails / month`}>
          Seller email and monthly quota are locked on Basic. Upgrade to Pro to edit these
          settings and raise your send limit.{' '}
          <TextButton
            size="small"
            as="a"
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Upgrade to Pro
          </TextButton>
        </SectionHelper>
      ) : (
        <SectionHelper appearance="success" title="Pro plan">
          You can edit seller notification email and set a custom monthly alert quota.
        </SectionHelper>
      )}

      <Card>
        <Card.Header
          title="Seller alerts &amp; quota"
          subtitle="Email used for manager inventory alerts and monthly outbound alert volume"
        />
        <Card.Divider />
        <Card.Content>
          <Layout gap="16px">
            <Cell span={6}>
              <FormField label="Seller notification email">
                <Input
                  prefix={<Email size="16" />}
                  type="email"
                  disabled={!canEdit}
                  value={config.sellerEmail || ''}
                  onChange={(e) =>
                    setConfig((c: any) => ({ ...c, sellerEmail: e.target.value }))
                  }
                  placeholder="seller@yourstore.com"
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField
                label="Monthly alert dispatch quota"
                infoContent={
                  canEdit
                    ? 'Maximum alerts this site can send per 30 days.'
                    : 'Fixed at 20 on Basic. Upgrade to Pro to customize.'
                }
              >
                <NumberInput
                  min={DEFAULT_QUOTA}
                  step={canEdit ? 10 : 1}
                  disabled={!canEdit}
                  value={quotaValue}
                  onChange={(value) =>
                    setConfig((c: any) => ({
                      ...c,
                      monthlyAlertQuota: Number(value ?? DEFAULT_QUOTA),
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
          disabled={!canEdit || savingSection === 'general'}
          onClick={() =>
            handleSave(
              'general',
              {
                sellerEmail: config.sellerEmail,
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
