import React from 'react';
import { Box, Button, EmptyState } from '@wix/design-system';

export function EmptyOnboarding({
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  subtitle: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <EmptyState title={title} subtitle={subtitle} skin="section">
      <Box gap="8px">
        {primaryLabel && onPrimary ? (
          <Button size="small" onClick={onPrimary}>
            {primaryLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Button size="small" priority="secondary" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </Box>
    </EmptyState>
  );
}
