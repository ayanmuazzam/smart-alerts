import React from 'react';
import { Badge, Box, Button, Text, TextButton, ToggleSwitch } from '@wix/design-system';
import {
  Package,
  Tag,
  Chat,
  StatusAlert,
  AddReceipt,
  DateAndTime,
  Sparkles,
  Timer,
  SettingsSmall,
  EditSmall,
  InfoCircle,
} from '@wix/wix-ui-icons-common';

export interface AutomationRuleCardProps {
  id: string;
  title: string;
  description: string;
  group?: string;
  channel?: string;
  delivery?: string;
  iconName?: string;
  tag?: string;
  enabled: boolean;
  triggerSummary?: string;
  templateLabel?: string;
  onToggle: () => void;
  onConfigure?: () => void;
  onCustomizeTemplate?: () => void;
  // Backwards compatibility alias
  onCustomize?: () => void;
}

export function AutomationRuleCard({
  title,
  description,
  group,
  channel = 'Email',
  delivery = 'Instant',
  iconName = 'Package',
  enabled,
  triggerSummary,
  templateLabel,
  onToggle,
  onConfigure,
  onCustomizeTemplate,
  onCustomize,
}: AutomationRuleCardProps) {
  const handleConfigure = onConfigure || onCustomize || (() => {});

  const renderIcon = () => {
    switch (iconName) {
      case 'Package':
        return <Package size="20" />;
      case 'Tag':
        return <Tag size="20" />;
      case 'Chat':
        return <Chat size="20" />;
      case 'StatusAlert':
        return <StatusAlert size="20" />;
      case 'AddReceipt':
        return <AddReceipt size="20" />;
      case 'DateAndTime':
        return <DateAndTime size="20" />;
      case 'Sparkles':
        return <Sparkles size="20" />;
      case 'Timer':
        return <Timer size="20" />;
      default:
        return <Package size="20" />;
    }
  };

  const getIconContainerStyle = () => {
    if (channel === 'WhatsApp') {
      return { backgroundColor: '#E6F7ED', color: '#008535' };
    }
    if (channel === 'Storefront' || group === 'URGENCY') {
      return { backgroundColor: '#F3E8FF', color: '#7E22CE' };
    }
    if (group === 'SELLER') {
      return { backgroundColor: '#FFF4E5', color: '#C25E00' };
    }
    return { backgroundColor: '#EBF4FF', color: '#116DFF' };
  };

  const getChannelBadgeSkin = () => {
    if (channel === 'WhatsApp') return 'success';
    if (channel === 'Storefront') return 'premium';
    return 'standard';
  };

  const iconStyle = getIconContainerStyle();

  return (
    <Box
      direction="vertical"
      gap="SP2"
      padding="SP3"
      style={{
        borderRadius: '8px',
        border: enabled ? '1px solid #DFE5EB' : '1px solid #EDEFF2',
        backgroundColor: enabled ? '#FFFFFF' : '#FAFBFC',
        transition: 'all 0.15s ease-in-out',
        boxShadow: enabled ? '0 1px 3px rgba(0, 0, 0, 0.03)' : 'none',
      }}
    >
      <Box verticalAlign="middle" gap="SP3" width="100%">
        {/* Module Icon Container */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: enabled ? 1 : 0.65,
            ...iconStyle,
          }}
        >
          {renderIcon()}
        </div>

        {/* Title, Badges & Description */}
        <Box direction="vertical" gap="SP1" width="100%">
          <Box verticalAlign="middle" gap="SP2" style={{ flexWrap: 'wrap' }}>
            <Text weight="bold" size="medium" light={!enabled}>
              {title}
            </Text>
            <Badge size="tiny" skin={getChannelBadgeSkin()}>
              {channel}
            </Badge>
            <Badge size="tiny" skin="neutralLight">
              {delivery}
            </Badge>
          </Box>
          <Text size="small" secondary>
            {description}
          </Text>
        </Box>

        {/* Toggle Switch */}
        <Box verticalAlign="middle" gap="SP2" style={{ flexShrink: 0 }}>
          <ToggleSwitch checked={enabled} onChange={() => onToggle()} />
        </Box>
      </Box>

      {/* Footer bar: Inline trigger summary + Quick Actions */}
      <Box
        verticalAlign="middle"
        align="space-between"
        gap="SP2"
        style={{
          borderTop: '1px solid #F0F4F8',
          paddingTop: '8px',
          marginTop: '4px',
        }}
      >
        {/* Trigger summary */}
        {enabled && triggerSummary ? (
          <Box verticalAlign="middle" gap="SP1">
            <InfoCircle size="14" style={{ color: '#7A869A' }} />
            <Text size="tiny" secondary>
              {triggerSummary}
            </Text>
          </Box>
        ) : (
          <Text size="tiny" secondary>
            {enabled ? 'Active and monitoring' : 'Rule is currently paused'}
          </Text>
        )}

        {/* Action Buttons */}
        <Box verticalAlign="middle" gap="SP2">
          {enabled && onCustomizeTemplate ? (
            <TextButton
              size="small"
              prefixIcon={<EditSmall />}
              onClick={onCustomizeTemplate}
            >
              {templateLabel || 'Customize'}
            </TextButton>
          ) : null}
          <Button
            size="small"
            priority="secondary"
            prefixIcon={<SettingsSmall />}
            onClick={handleConfigure}
          >
            Configure
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

