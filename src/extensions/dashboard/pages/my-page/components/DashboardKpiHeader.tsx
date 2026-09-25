import React from 'react';
import { Box, Button, Card, StatisticsWidget, Text } from '@wix/design-system';

export interface DashboardKpiHeaderProps {
  kpis: Record<string, number> | null;
  onSendTestAlert: () => void;
  onViewSubscribers: () => void;
  onCustomizeTemplates: () => void;
}

export function DashboardKpiHeader({
  kpis,
  onSendTestAlert,
  onViewSubscribers,
  onCustomizeTemplates,
}: DashboardKpiHeaderProps) {
  if (!kpis) return null;

  const activeSubscribers =
    kpis.activeSubscribers ?? (kpis.onHoldStock || 0) + (kpis.watchingPrice || 0);
  const pendingAlerts = kpis.pendingAlerts ?? kpis.whatsappPending ?? 0;
  const alertsSent = kpis.alertsSent ?? 0;
  const quota = kpis.quota || 5000;
  const remaining = kpis.remaining ?? quota;
  const used = Math.max(0, quota - remaining);

  return (
    <Box direction="vertical" gap="SP4">
      <Card>
        <Card.Header title="Overview" subtitle="Subscriber demand and alert usage" />
        <Card.Divider />
        <Card.Content>
          <StatisticsWidget
            items={[
              {
                value: String(activeSubscribers),
                description: 'Active subscribers',
                onClick: onViewSubscribers,
              },
              {
                value: String(kpis.onHoldStock || 0),
                description: 'On hold (stock)',
              },
              {
                value: String(kpis.watchingPrice || 0),
                description: 'Watching the price',
              },
              {
                value: String(pendingAlerts),
                description: 'Pending alerts',
              },
              {
                value: String(alertsSent),
                description: 'Alerts sent',
              },
              {
                value: `${used}/${quota}`,
                description: 'Quota used',
              },
              {
                value: String(remaining),
                description: 'Remaining',
              },
            ]}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <Box verticalAlign="middle" gap="SP2">
            <Text size="small" secondary>
              Quick actions
            </Text>
            <Button size="small" onClick={onSendTestAlert}>
              Send test alert
            </Button>
            <Button size="small" priority="secondary" onClick={onViewSubscribers}>
              View subscribers
            </Button>
            <Button size="small" priority="secondary" onClick={onCustomizeTemplates}>
              Edit templates
            </Button>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
