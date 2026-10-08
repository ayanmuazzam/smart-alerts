import type { FC } from 'react';
import { Box, Card, Text } from '@wix/design-system';
import { Email, Hint, Whatsapp } from '@wix/wix-ui-icons-common';

const SUPPORT_EMAIL = 'support@fmemodules.com';
const WHATSAPP_NUMBER = '923315986829';

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;
const EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`;

/** Colors matched to the support-widget screenshot. */
const COLORS = {
  blue: '#1d4ed8',
  tooltipBlue: '#1d4ed8',
  badgeBg: '#EBEBFF',
  badgeText: '#4E4EB2',
  iconBg: '#E8EAFF',
  icon: '#5B5BD6',
  whatsapp: '#16a34a',
  title: '#162D3D',
  body: '#6B7280',
};

const widgetCss = `
.cwp-support-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: #ffffff;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.cwp-support-btn:hover {
  filter: brightness(1.06);
}
.cwp-support-btn:active {
  transform: translateY(1px);
}
.cwp-support-btn--email {
  background: ${COLORS.blue};
}
.cwp-support-btn--whatsapp {
  background: ${COLORS.whatsapp};
}
.cwp-support-tooltip-wrap {
  position: relative;
  display: inline-flex;
}
.cwp-support-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  background: ${COLORS.tooltipBlue};
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.28);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s ease, visibility 0.12s ease;
  z-index: 2;
}
.cwp-support-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: ${COLORS.tooltipBlue};
}
.cwp-support-tooltip-wrap:hover .cwp-support-tooltip,
.cwp-support-tooltip-wrap:focus-within .cwp-support-tooltip {
  opacity: 1;
  visibility: visible;
}
.cwp-support-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${COLORS.badgeBg};
  color: ${COLORS.badgeText};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.4;
}
`;

/**
 * Support contact card with Email and WhatsApp channels.
 * Placed under the page subtitle (above tabs); scrolls away — tabs stay sticky.
 */
export const SupportWidget: FC = () => (
  <Card showShadow>
    <style>{widgetCss}</style>
    <Card.Content>
      <Box direction="vertical" gap="SP3">
        <Box direction="horizontal" gap="SP3" verticalAlign="middle">
          <Box
            width="36px"
            height="36px"
            backgroundColor={COLORS.iconBg}
            align="center"
            verticalAlign="middle"
            color={COLORS.icon}
            style={{ borderRadius: '50%' }}
          >
            <Hint />
          </Box>
          <Box direction="vertical" gap="SP1">
            <Box
              direction="horizontal"
              gap="SP2"
              verticalAlign="middle"
              align="left"
            >
              <Text weight="bold" size="medium">
                Need help?
              </Text>
              <span className="cwp-support-badge">Reply within 24h</span>
            </Box>
            <Text size="small" secondary>
              Questions about back-in-stock alerts, price drops, or setup —
              tap a channel below.
            </Text>
          </Box>
        </Box>

        <Box direction="horizontal" gap="SP2">
          <span className="cwp-support-tooltip-wrap">
            <span className="cwp-support-tooltip" role="tooltip">
              {SUPPORT_EMAIL}
            </span>
            <button
              type="button"
              className="cwp-support-btn cwp-support-btn--email"
              onClick={() => {
                window.location.href = EMAIL_HREF;
              }}
              aria-label={`Email ${SUPPORT_EMAIL}`}
            >
              <Email />
              Email
            </button>
          </span>

          <span className="cwp-support-tooltip-wrap">
            <span className="cwp-support-tooltip" role="tooltip">
              +{WHATSAPP_NUMBER}
            </span>
            <button
              type="button"
              className="cwp-support-btn cwp-support-btn--whatsapp"
              onClick={() => {
                window.open(WHATSAPP_HREF, '_blank', 'noopener,noreferrer');
              }}
              aria-label={`WhatsApp +${WHATSAPP_NUMBER}`}
            >
              <Whatsapp />
              WhatsApp
            </button>
          </span>
        </Box>
      </Box>
    </Card.Content>
  </Card>
);
