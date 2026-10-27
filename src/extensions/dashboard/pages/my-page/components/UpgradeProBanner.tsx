import React from 'react';
import { PremiumFilled } from '@wix/wix-ui-icons-common';
import {
  buildAppUpgradeUrl,
  DEFAULT_QUOTA,
} from '../../../../../lib/smart-alerts/constants';
import type { PlanInfo } from './SettingsWorkspace';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

type Props = {
  plan?: PlanInfo | null;
};

/**
 * Purple upgrade CTA with crown — shown on Basic / free installs only.
 * Opens the official Wix pricing page: /apps/upgrade/{appId}?appInstanceId=...
 */
export function UpgradeProBanner({ plan }: Props) {
  if (plan?.isPro) return null;

  const upgradeUrl = plan?.upgradeUrl || buildAppUpgradeUrl(plan?.instanceId);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #9333EA 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 14px rgba(91, 33, 182, 0.28)',
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FDE68A',
          }}
        >
          <PremiumFilled size="22" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
            Upgrade to Pro
          </span>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>
            Basic is capped at {DEFAULT_QUOTA} emails / month. Unlock custom quota and account
            settings with Pro.
          </span>
        </div>
      </div>

      <a
        href={upgradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 8,
          background: '#FFFFFF',
          color: '#6D28D9',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          fontFamily: FONT_SANS,
        }}
      >
        <PremiumFilled size="16" />
        Upgrade now
      </a>
    </div>
  );
}
