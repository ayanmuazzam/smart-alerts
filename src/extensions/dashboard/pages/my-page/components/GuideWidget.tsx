import { useState, type FC } from 'react';
import { Accordion, Box, Card, IconButton, Text } from '@wix/design-system';
import { Article, Dismiss } from '@wix/wix-ui-icons-common';

const STORAGE_KEY = 'smart-alerts-guide-dismissed-v3';

const COLORS = {
  badgeBg: '#EBEBFF',
  badgeText: '#4E4EB2',
  iconBg: '#E8EAFF',
  icon: '#5B5BD6',
  stepBg: '#E8EAFF',
  stepText: '#5B5BD6',
};

const SETUP_STEPS = [
  'Open Automation and turn on the alert modules you need (back-in-stock, price drop, seller alerts).',
  'In Email & Branding, set your brand colors and review each alert email template.',
  'Open Storefront Widget, style the Notify Me / Watch Price buttons, then add the site plugin on your product pages in the Editor.',
  'In Automation → Inventory Tracker, track products for low-stock badges and restock countdowns.',
  'Use Dashboard and Logs & Quota to confirm subscribers and that alerts are sending.',
];

const widgetCss = `
.cwp-guide-badge {
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
.cwp-guide-step-num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${COLORS.stepBg};
  color: ${COLORS.stepText};
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
`;

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Collapsible app guide. Header holds the dismiss (X); accordion only toggles steps.
 */
export const GuideWidget: FC = () => {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore quota / private mode */
    }
    setDismissed(true);
  };

  return (
    <Card showShadow hideOverflow>
      <style>{widgetCss}</style>
      <Card.Content>
        <Box
          direction="horizontal"
          verticalAlign="middle"
          align="space-between"
          marginBottom="SP2"
        >
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
              <Article />
            </Box>
            <Box direction="vertical" gap="SP1">
              <Box
                direction="horizontal"
                gap="SP2"
                verticalAlign="middle"
                align="left"
              >
                <Text weight="bold" size="medium">
                  App Guide
                </Text>
                <span className="cwp-guide-badge">Setup walkthrough</span>
              </Box>
              <Text size="small" secondary>
                Steps to configure this app
              </Text>
            </Box>
          </Box>

          <IconButton
            size="small"
            skin="dark"
            priority="secondary"
            onClick={dismiss}
            ariaLabel="Dismiss app guide"
          >
            <Dismiss />
          </IconButton>
        </Box>
      </Card.Content>

      <Accordion
        size="tiny"
        skin="light"
        hideShadow
        items={[
          {
            title: (
              <Text size="small" weight="bold">
                Configuration steps
              </Text>
            ),
            initiallyOpen: true,
            children: (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <Box direction="vertical" gap="SP2">
                  {SETUP_STEPS.map((step, index) => (
                    <li key={step} style={{ listStyle: 'none' }}>
                      <Box direction="horizontal" gap="SP2" verticalAlign="top">
                        <span className="cwp-guide-step-num" aria-hidden>
                          {index + 1}
                        </span>
                        <Text size="small">{step}</Text>
                      </Box>
                    </li>
                  ))}
                </Box>
              </ol>
            ),
          },
        ]}
      />
    </Card>
  );
};
