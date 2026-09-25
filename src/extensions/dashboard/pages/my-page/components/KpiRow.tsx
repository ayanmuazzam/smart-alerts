import React from 'react';
import { Box, StatisticsWidget } from '@wix/design-system';

export function KpiRow({
  items,
}: {
  items: {
    description: string;
    value: string;
    onClick?: () => void;
  }[];
}) {
  return (
    <Box direction="vertical" gap="24px">
      <StatisticsWidget items={items} />
    </Box>
  );
}
