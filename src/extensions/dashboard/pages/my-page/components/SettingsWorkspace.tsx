import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Cell,
  Dropdown,
  FormField,
  Input,
  Layout,
  NumberInput,
  SectionHelper,
  Text,
} from '@wix/design-system';
import {
  SettingsSmall,
  Email,
  Chat,
  Sparkles,
  DateAndTime,
  StatusAlert,
  Check,
  Package,
  Tag,
} from '@wix/wix-ui-icons-common';
import type { SettingsSub } from '../adminApi';

export interface SettingsWorkspaceProps {
  sub: SettingsSub;
  config: any;
  setConfig: (updater: any) => void;
  onSavePatch: (patch: Record<string, unknown>, msg: string) => Promise<void> | void;
  onResetSettings: () => Promise<void> | void;
  onTestWhatsapp: () => Promise<void> | void;
  onResyncCatalog: () => Promise<void> | void;
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function SettingsWorkspace({
  sub,
  config,
  setConfig,
  onSavePatch,
  onResetSettings,
  onTestWhatsapp,
  onResyncCatalog,
}: SettingsWorkspaceProps) {
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  if (!config) return null;

  const limits = config.notificationLimits || {};
  const triggers = config.triggerRules || {};
  const wa = config.whatsappSetup || {};
  const sync = config.syncSettings || {};

  const handleSave = async (section: string, patch: Record<string, unknown>, msg: string) => {
    setSavingSection(section);
    try {
      await onSavePatch(patch, msg);
    } finally {
      setSavingSection(null);
    }
  };

  // 1. GENERAL & ACCOUNT
  if (sub === 'general') {
    return (
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
            <SettingsSmall size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Account &amp; Support Routing
            </span>
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              Define where seller inventory alerts are dispatched and where customer reply inquiries are routed.
            </span>
          </div>
        </div>

        {/* Card 1: Alert & Customer Inquiries */}
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

        {/* Save Bar */}
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
              if (!window.confirm('Reset all Smart Alerts configuration to system defaults? This cannot be undone.'))
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

  // 2. NOTIFICATIONS & CAPS
  if (sub === 'notifications') {
    return (
      <Box direction="vertical" gap="SP4">
        {/* Hero Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
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
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.28)',
              flexShrink: 0,
            }}
          >
            <Email size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#92400E' }}>
              Notification Throttling &amp; Caps
            </span>
            <span style={{ fontSize: '12.5px', color: '#B45309' }}>
              Protect customer relationships by limiting how often individual buyers can receive alerts.
            </span>
          </div>
        </div>

        {/* Card 1: Rate Limits */}
        <Card>
          <Card.Header
            title="Per-Customer Rate Limits"
            subtitle="Maximum notification limits enforced per shopper across email and WhatsApp"
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={4}>
                <FormField label="Max emails / buyer / day">
                  <NumberInput
                    min={1}
                    max={20}
                    value={limits.maxEmailPerCustomerPerDay ?? 3}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        notificationLimits: {
                          ...c.notificationLimits,
                          maxEmailPerCustomerPerDay: Number(value ?? 3),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={4}>
                <FormField label="Max emails / buyer / week">
                  <NumberInput
                    min={1}
                    max={50}
                    value={limits.maxEmailPerCustomerPerWeek ?? 10}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        notificationLimits: {
                          ...c.notificationLimits,
                          maxEmailPerCustomerPerWeek: Number(value ?? 10),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={4}>
                <FormField label="Max WhatsApp / buyer / day">
                  <NumberInput
                    min={1}
                    max={10}
                    value={limits.maxWhatsappPerCustomerPerDay ?? 2}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        notificationLimits: {
                          ...c.notificationLimits,
                          maxWhatsappPerCustomerPerDay: Number(value ?? 2),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>

        {/* Card 2: Dispatch Cadence */}
        <Card>
          <Card.Header
            title="Dispatch Cadence Strategy"
            subtitle="Control whether notifications fire instantaneously or accumulate into hourly digest batches"
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={6}>
                <FormField label="Dispatch timing">
                  <Dropdown
                    selectedId={limits.batchMode || 'immediate'}
                    options={[
                      { id: 'immediate', value: 'Immediate (Instant dispatch on restock)' },
                      { id: 'hourly', value: 'Hourly batch (Consolidated dispatch window)' },
                    ]}
                    onSelect={(option) =>
                      setConfig((c: any) => ({
                        ...c,
                        notificationLimits: {
                          ...c.notificationLimits,
                          batchMode: String(option.id),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>

        <Box gap="SP3">
          <Button
            size="medium"
            disabled={savingSection === 'notifications'}
            onClick={() =>
              handleSave(
                'notifications',
                { notificationLimits: config.notificationLimits },
                'Notification limits saved',
              )
            }
          >
            {savingSection === 'notifications' ? 'Saving changes…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    );
  }

  // 3. TRIGGERS & RULES
  if (sub === 'triggers') {
    return (
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
            <Sparkles size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#5B21B6' }}>
              Trigger Sensitivity &amp; Rules
            </span>
            <span style={{ fontSize: '12.5px', color: '#6D28D9' }}>
              Fine-tune catalog conditions that trigger automatic customer alerts and restock queues.
            </span>
          </div>
        </div>

        {/* Card 1: Stock & Price Sensitivity */}
        <Card>
          <Card.Header
            title="Stock & Price Drop Sensitivity"
            subtitle="Thresholds that catalog events must meet before alerts are generated"
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={4}>
                <FormField
                  label="Restock minimum qty"
                  infoContent="Units required in stock before waiting customers are notified."
                >
                  <NumberInput
                    min={1}
                    value={triggers.backInStockMinQty ?? 1}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        triggerRules: {
                          ...c.triggerRules,
                          backInStockMinQty: Number(value ?? 1),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={4}>
                <FormField
                  label="Price drop minimum %"
                  infoContent="Minimum price reduction needed to trigger a price drop notification."
                >
                  <NumberInput
                    min={0}
                    max={100}
                    value={triggers.priceDropMinPercent ?? 0}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        triggerRules: {
                          ...c.triggerRules,
                          priceDropMinPercent: Number(value ?? 0),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={4}>
                <FormField
                  label="Price-drop cooldown (hours)"
                  infoContent="Prevents sending another price alert for the same product within this window."
                >
                  <NumberInput
                    min={1}
                    value={config.priceDropCooldownHours ?? 24}
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        priceDropCooldownHours: Number(value ?? 24),
                      }))
                    }
                  />
                </FormField>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>

        {/* Card 2: Catalog Defaults & Digest */}
        <Card>
          <Card.Header
            title="Catalog Defaults & Merchant Digest"
            subtitle="Default thresholds for out-of-stock monitoring and weekly merchant summary"
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={6}>
                <FormField
                  label="Default low-stock warning threshold"
                  infoContent="Global fallback quantity threshold for low stock alerts when not set per item."
                >
                  <NumberInput
                    min={1}
                    value={
                      triggers.globalLowStockThreshold ?? config.globalLowStockThreshold ?? 5
                    }
                    onChange={(value) =>
                      setConfig((c: any) => ({
                        ...c,
                        globalLowStockThreshold: Number(value ?? 5),
                        triggerRules: {
                          ...c.triggerRules,
                          globalLowStockThreshold: Number(value ?? 5),
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Merchant digest summary frequency">
                  <Dropdown
                    selectedId={config.digestFrequency || 'weekly'}
                    options={[
                      { id: 'daily', value: 'Daily summary' },
                      { id: 'weekly', value: 'Weekly digest' },
                    ]}
                    onSelect={(option) =>
                      setConfig((c: any) => ({
                        ...c,
                        digestFrequency: String(option.id),
                      }))
                    }
                  />
                </FormField>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>

        <Box gap="SP3">
          <Button
            size="medium"
            disabled={savingSection === 'triggers'}
            onClick={() =>
              handleSave(
                'triggers',
                {
                  triggerRules: config.triggerRules,
                  priceDropCooldownHours: config.priceDropCooldownHours,
                  globalLowStockThreshold: config.globalLowStockThreshold,
                  digestFrequency: config.digestFrequency,
                },
                'Trigger rules saved',
              )
            }
          >
            {savingSection === 'triggers' ? 'Saving changes…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    );
  }

  // 4. WHATSAPP
  if (sub === 'whatsapp') {
    const isWaApi = wa.mode === 'api';
    const isConnected = wa.connectionStatus === 'connected';

    return (
      <Box direction="vertical" gap="SP4">
        {/* Hero Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1px solid #A7F3D0',
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
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.28)',
              flexShrink: 0,
            }}
          >
            <Chat size="20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#065F46' }}>
              WhatsApp Channel Configuration
            </span>
            <span style={{ fontSize: '12.5px', color: '#047857' }}>
              Choose between free manual click-to-chat links or automated background dispatch via Twilio API.
            </span>
          </div>
        </div>

        {/* Card 1: Channel Mode & Sender */}
        <Card>
          <Card.Header
            title="Delivery Mode & Phone Number"
            subtitle="Configure whether alerts are queued for click-to-chat or sent automatically via API"
          />
          <Card.Divider />
          <Card.Content>
            <Layout gap="16px">
              <Cell span={6}>
                <FormField label="WhatsApp delivery mode">
                  <Dropdown
                    selectedId={wa.mode || 'manual'}
                    options={[
                      { id: 'manual', value: 'Manual (Queue with wa.me click-to-chat links)' },
                      { id: 'api', value: 'Automated API (Twilio Messaging)' },
                    ]}
                    onSelect={(option) =>
                      setConfig((c: any) => ({
                        ...c,
                        whatsappSetup: {
                          ...c.whatsappSetup,
                          mode: String(option.id),
                          provider: option.id === 'api' ? 'twilio' : 'none',
                        },
                      }))
                    }
                  />
                </FormField>
              </Cell>
              <Cell span={6}>
                <FormField label="Sender WhatsApp number (E.164)">
                  <Input
                    prefix={<Chat size="16" />}
                    value={wa.senderPhone || ''}
                    onChange={(e) =>
                      setConfig((c: any) => ({
                        ...c,
                        whatsappSetup: {
                          ...c.whatsappSetup,
                          senderPhone: e.target.value,
                        },
                      }))
                    }
                    placeholder="+15551234567"
                  />
                </FormField>
              </Cell>
            </Layout>
          </Card.Content>
        </Card>

        {/* Card 2: Connection Status & Diagnostic */}
        <Card>
          <Card.Header
            title="Connection Status & Authentication"
            subtitle="Verify credentials stored in Wix Secrets Manager"
          />
          <Card.Divider />
          <Card.Content>
            <Box direction="vertical" gap="SP3">
              <SectionHelper appearance="standard" title="Twilio API Secrets">
                For automated API dispatch, ensure your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are securely stored in your Wix site Secrets Manager.
              </SectionHelper>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontFamily: FONT_SANS,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                    Integration Status:
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      backgroundColor: isConnected ? '#DCFCE7' : '#F1F5F9',
                      color: isConnected ? '#15803D' : '#475569',
                      border: isConnected ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isConnected ? '#10B981' : '#94A3B8',
                      }}
                    />
                    <span>{wa.connectionStatus || (isWaApi ? 'API Disconnected' : 'Ready (Manual Queue)')}</span>
                  </div>
                </div>

                <Button
                  size="small"
                  priority="secondary"
                  disabled={isTestingWa}
                  onClick={async () => {
                    setIsTestingWa(true);
                    try {
                      await onTestWhatsapp();
                    } finally {
                      setIsTestingWa(false);
                    }
                  }}
                >
                  {isTestingWa ? 'Testing connection…' : 'Test Connection'}
                </Button>
              </div>
            </Box>
          </Card.Content>
        </Card>

        <Box gap="SP3">
          <Button
            size="medium"
            disabled={savingSection === 'whatsapp'}
            onClick={() =>
              handleSave(
                'whatsapp',
                { whatsappSetup: config.whatsappSetup },
                'WhatsApp settings saved',
              )
            }
          >
            {savingSection === 'whatsapp' ? 'Saving changes…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    );
  }

  // 5. STORE SYNC
  return (
    <Box direction="vertical" gap="SP4">
      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
          border: '1px solid #CBD5E1',
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
            background: 'linear-gradient(135deg, #64748B 0%, #334155 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(100, 116, 139, 0.28)',
            flexShrink: 0,
          }}
        >
          <DateAndTime size="20" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Store Catalog &amp; Webhook Synchronization
          </span>
          <span style={{ fontSize: '12.5px', color: '#475569' }}>
            Live status of Wix Stores catalog events, automated inventory listeners, and cache sync.
          </span>
        </div>
      </div>

      {/* Card 1: Webhook Status */}
      <Card>
        <Card.Header
          title="Catalog Listener Health"
          subtitle="Real-time webhooks tracking product price changes and stock availability"
        />
        <Card.Divider />
        <Card.Content>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              fontFamily: FONT_SANS,
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                Webhook Listener Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#15803D' }}>
                  Active &amp; Connected
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                Last Catalog Event
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                {sync.lastEventAt ? new Date(sync.lastEventAt).toLocaleString() : 'Waiting for event'}
              </span>
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                Last Event Type
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                {sync.lastEventType || 'None recorded'}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Card 2: Cache Refresh & Actions */}
      <Card>
        <Card.Header
          title="Catalog Cache & Maintenance"
          subtitle="Configure cache retention strategy or trigger an immediate catalog refresh"
        />
        <Card.Divider />
        <Card.Content>
          <Layout gap="16px">
            <Cell span={6}>
              <FormField label="Catalog cache refresh cadence">
                <Dropdown
                  selectedId={sync.cacheRefresh || 'realtime'}
                  options={[
                    { id: 'realtime', value: 'Real-time (Immediate sync on webhook)' },
                    { id: 'hourly', value: 'Hourly cache check' },
                    { id: 'daily', value: 'Daily background refresh' },
                  ]}
                  onSelect={(option) =>
                    setConfig((c: any) => ({
                      ...c,
                      syncSettings: {
                        ...c.syncSettings,
                        cacheRefresh: String(option.id),
                      },
                    }))
                  }
                />
              </FormField>
            </Cell>
          </Layout>
        </Card.Content>
      </Card>

      {/* Actions */}
      <Box gap="SP3" verticalAlign="middle">
        <Button
          size="medium"
          disabled={savingSection === 'sync'}
          onClick={() =>
            handleSave(
              'sync',
              { syncSettings: config.syncSettings },
              'Sync settings saved',
            )
          }
        >
          {savingSection === 'sync' ? 'Saving changes…' : 'Save Changes'}
        </Button>

        <Button
          size="medium"
          priority="secondary"
          disabled={isResyncing}
          onClick={async () => {
            setIsResyncing(true);
            try {
              await onResyncCatalog();
            } finally {
              setIsResyncing(false);
            }
          }}
        >
          {isResyncing ? 'Re-syncing catalog…' : 'Force Catalog Re-sync'}
        </Button>
      </Box>
    </Box>
  );
}
