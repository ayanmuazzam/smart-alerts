import React from 'react';
import { Box, Text } from '@wix/design-system';
import {
  SettingsSmall,
  Email,
  Sparkles,
  Chat,
  DateAndTime,
  Check,
} from '@wix/wix-ui-icons-common';
import type { SettingsSub } from '../adminApi';
import { SettingsWorkspace } from '../components/SettingsWorkspace';

type Props = {
  sub: SettingsSub;
  onSubChange: (sub: SettingsSub) => void;
  config: any;
  setConfig: (updater: any) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
};

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const SETTINGS_SIDEBAR_ITEMS: {
  id: SettingsSub;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'general',
    title: 'General & Support',
    subtitle: 'Store routing & quota',
    icon: <SettingsSmall size="18" />,
  },
  {
    id: 'notifications',
    title: 'Notification Caps',
    subtitle: 'Cadence & throttling',
    icon: <Email size="18" />,
  },
  {
    id: 'triggers',
    title: 'Trigger Rules',
    subtitle: 'Sensitivity & cooldowns',
    icon: <Sparkles size="18" />,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Setup',
    subtitle: 'API & click-to-chat',
    icon: <Chat size="18" />,
  },
  {
    id: 'sync',
    title: 'Store Sync',
    subtitle: 'Catalog & listeners',
    icon: <DateAndTime size="18" />,
  },
];

export function SettingsScreen({
  sub,
  onSubChange,
  config,
  setConfig,
  onRun,
  adminPost,
}: Props) {
  if (!config) return null;

  const savePatch = (patch: Record<string, unknown>, msg: string) =>
    onRun(async () => {
      const data = await adminPost({ action: 'saveConfig', patch });
      if (data.config) setConfig(() => data.config);
    }, msg);

  const handleResetSettings = () =>
    onRun(async () => {
      const data = await adminPost({ action: 'resetSettings' });
      if (data.config) setConfig(() => data.config);
    }, 'Settings reset to defaults');

  const handleTestWhatsapp = () =>
    onRun(async () => {
      const data = await adminPost({ action: 'testWhatsappConnection' });
      if (data.config) setConfig(() => data.config);
      if (!data.ok) throw new Error(data.message || 'Connection failed');
    }, 'WhatsApp connected');

  const handleResyncCatalog = () =>
    onRun(async () => {
      const data = await adminPost({ action: 'resyncCatalog' });
      if (data.config) setConfig(() => data.config);
    }, 'Catalog re-synced');

  const wa = config?.whatsappSetup || {};

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
              Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {SETTINGS_SIDEBAR_ITEMS.map((item) => {
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

          {/* Bottom: Quick Status Widget */}
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
              <span>System Configuration</span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748B',
                lineHeight: '1.4',
              }}
            >
              Changes made here apply globally across your store notification pipeline.
            </div>
          </div>
        </div>
      </Box>

      {/* 2. Main Subtab Content */}
      <Box direction="vertical" style={{ flex: 1, minWidth: 0 }}>
        <SettingsWorkspace
          sub={sub}
          config={config}
          setConfig={setConfig}
          onSavePatch={savePatch}
          onResetSettings={handleResetSettings}
          onTestWhatsapp={handleTestWhatsapp}
          onResyncCatalog={handleResyncCatalog}
        />
      </Box>
    </Box>
  );
}
