import React from 'react';
import {
  Box,
  Button,
  CustomModalLayout,
  FormField,
  Input,
  Modal,
  NumberInput,
  SectionHelper,
  SegmentedToggle,
  Text,
} from '@wix/design-system';
import { EditSmall } from '@wix/wix-ui-icons-common';

type Props = {
  moduleKey: string | null;
  title: string;
  config: any;
  onClose: () => void;
  onChange: (patch: Record<string, unknown>) => void;
  onSave: () => void;
  isSaving?: boolean;
  onGoCustomization?: (target?: 'email' | 'storefront') => void;
};

export function ModuleRulesSidePanel({
  moduleKey,
  title,
  config,
  onClose,
  onChange,
  onSave,
  isSaving,
  onGoCustomization,
}: Props) {
  if (!moduleKey) return null;

  const triggers = config?.triggerRules || {};
  const appearance = config?.appearance || {};
  const limits = config?.notificationLimits || {};

  const currentBatchMode = limits.batchMode || 'immediate';
  const currentDigestFreq = config?.digestFrequency || 'weekly';

  const content = (
    <Box direction="vertical" gap="SP4">
      {moduleKey === 'backInStock' && (
        <>
          <SectionHelper appearance="standard" title="Trigger rule">
            Subscribers will be alerted when new stock is added to the store catalog.
          </SectionHelper>

          <FormField
            label="Minimum restock quantity to trigger"
            infoContent="Shoppers won't be notified if restocked amount is less than this value."
          >
            <NumberInput
              min={1}
              value={Number(triggers.backInStockMinQty ?? 1)}
              suffix={<Input.Affix>units</Input.Affix>}
              onChange={(val) =>
                onChange({
                  triggerRules: { ...triggers, backInStockMinQty: Number(val ?? 1) },
                })
              }
            />
          </FormField>

          <FormField
            label="Delivery dispatch mode"
            infoContent="Send emails instantly as soon as stock updates, or bundle into an hourly batch."
          >
            <SegmentedToggle
              fullWidth
              selected={currentBatchMode}
              onClick={(_, val) =>
                onChange({
                  notificationLimits: { ...limits, batchMode: String(val) },
                })
              }
            >
              <SegmentedToggle.Button value="immediate">
                Instant (Real-time)
              </SegmentedToggle.Button>
              <SegmentedToggle.Button value="hourly">Hourly batch</SegmentedToggle.Button>
            </SegmentedToggle>
          </FormField>
        </>
      )}

      {moduleKey === 'priceDrop' && (
        <>
          <SectionHelper appearance="standard" title="Trigger rule">
            Customers watching this product receive an email when the price drops.
          </SectionHelper>

          <FormField
            label="Minimum price drop percentage"
            infoContent="Discount percentage required to trigger alert."
          >
            <NumberInput
              min={0}
              max={100}
              value={Number(triggers.priceDropMinPercent ?? 0)}
              suffix={<Input.Affix>%</Input.Affix>}
              onChange={(val) =>
                onChange({
                  triggerRules: {
                    ...triggers,
                    priceDropMinPercent: Number(val ?? 0),
                  },
                })
              }
            />
          </FormField>

          <FormField
            label="Minimum price drop amount"
            infoContent="Minimum absolute currency discount required to trigger alert."
          >
            <NumberInput
              min={0}
              value={Number(triggers.priceDropMinAmount ?? 0)}
              suffix={<Input.Affix>amount</Input.Affix>}
              onChange={(val) =>
                onChange({
                  triggerRules: {
                    ...triggers,
                    priceDropMinAmount: Number(val ?? 0),
                  },
                })
              }
            />
          </FormField>

          <FormField
            label="Alert cooldown period"
            infoContent="Hours to wait before sending another price drop alert to the same recipient."
          >
            <NumberInput
              min={1}
              max={720}
              value={Number(config?.priceDropCooldownHours ?? 24)}
              suffix={<Input.Affix>hours</Input.Affix>}
              onChange={(val) => onChange({ priceDropCooldownHours: Number(val ?? 24) })}
            />
          </FormField>

          <FormField label="Delivery dispatch mode" infoContent="Send emails immediately or batch hourly.">
            <SegmentedToggle
              fullWidth
              selected={currentBatchMode}
              onClick={(_, val) =>
                onChange({
                  notificationLimits: { ...limits, batchMode: String(val) },
                })
              }
            >
              <SegmentedToggle.Button value="immediate">
                Instant (Real-time)
              </SegmentedToggle.Button>
              <SegmentedToggle.Button value="hourly">Hourly batch</SegmentedToggle.Button>
            </SegmentedToggle>
          </FormField>
        </>
      )}

      {moduleKey === 'manualWhatsapp' && (
        <SectionHelper appearance="standard" title="WhatsApp delivery queue">
          When items return to stock, waiting shoppers who opted in with phone numbers are queued
          in the WhatsApp tab. You can click to launch wa.me chats directly with pre-filled
          messages.
        </SectionHelper>
      )}

      {moduleKey === 'sellerLowStock' && (
        <>
          <SectionHelper appearance="standard" title="Store alert">
            Warn the store manager before items sell out completely.
          </SectionHelper>
          <FormField
            label="Global low-stock threshold"
            infoContent="When stock of any item falls to or below this number, you'll receive an email alert."
          >
            <NumberInput
              min={1}
              max={1000}
              value={Number(
                triggers.globalLowStockThreshold ?? config?.globalLowStockThreshold ?? 5,
              )}
              suffix={<Input.Affix>units</Input.Affix>}
              onChange={(val) =>
                onChange({
                  globalLowStockThreshold: Number(val ?? 5),
                  triggerRules: {
                    ...triggers,
                    globalLowStockThreshold: Number(val ?? 5),
                  },
                })
              }
            />
          </FormField>
        </>
      )}

      {moduleKey === 'sellerOutOfStock' && (
        <SectionHelper appearance="standard" title="Immediate restock alert">
          An instant notification is sent to your registered seller email whenever any product
          inventory reaches 0.
        </SectionHelper>
      )}

      {moduleKey === 'sellerNewOrder' && (
        <SectionHelper appearance="standard" title="Order alert">
          Sends an instant summary email upon new customer purchase to expedite packing and order
          fulfillment.
        </SectionHelper>
      )}

      {moduleKey === 'digest' && (
        <>
          <SectionHelper appearance="standard" title="Consolidated summary">
            Receive periodic executive summaries detailing inventory health, out-of-stock SKUs, and
            customer alert demand.
          </SectionHelper>
          <FormField label="Digest frequency">
            <SegmentedToggle
              fullWidth
              selected={currentDigestFreq}
              onClick={(_, val) => onChange({ digestFrequency: String(val) })}
            >
              <SegmentedToggle.Button value="weekly">Weekly</SegmentedToggle.Button>
              <SegmentedToggle.Button value="daily">Daily</SegmentedToggle.Button>
              <SegmentedToggle.Button value="off">Off</SegmentedToggle.Button>
            </SegmentedToggle>
          </FormField>
        </>
      )}

      {moduleKey === 'stockCounter' && (
        <>
          <SectionHelper appearance="standard" title="Storefront urgency">
            Display a dynamic &ldquo;Only X left!&rdquo; badge on the product page.
          </SectionHelper>
          <FormField
            label="Storefront display threshold"
            infoContent="The badge will appear on the storefront when remaining stock is at or below this count."
          >
            <NumberInput
              min={1}
              max={1000}
              value={Number(appearance.stockThreshold ?? 10)}
              suffix={<Input.Affix>units</Input.Affix>}
              onChange={(val) =>
                onChange({
                  appearance: { ...appearance, stockThreshold: Number(val ?? 10) },
                })
              }
            />
          </FormField>
        </>
      )}

      {moduleKey === 'restockCountdown' && (
        <SectionHelper appearance="standard" title="Countdown timer">
          Displays an animated timer on out-of-stock product pages. You can schedule exact restock
          dates individually for products in the Inventory tab.
        </SectionHelper>
      )}

      {onGoCustomization ? (
        <Box direction="vertical" gap="SP2">
          <Text weight="bold" size="small">
            Need to customize appearance?
          </Text>
          <Text size="tiny" secondary>
            {moduleKey === 'stockCounter' || moduleKey === 'restockCountdown'
              ? 'Adjust storefront badge styling, colors, and placement in Customization.'
              : 'Customize the email subject, logo, colors, and content in Customization.'}
          </Text>
          <Button
            size="small"
            priority="secondary"
            prefixIcon={<EditSmall />}
            onClick={() => {
              onClose();
              onGoCustomization(
                moduleKey === 'stockCounter' || moduleKey === 'restockCountdown'
                  ? 'storefront'
                  : 'email',
              );
            }}
          >
            {moduleKey === 'stockCounter' || moduleKey === 'restockCountdown'
              ? 'Customize storefront widget'
              : 'Customize email template'}
          </Button>
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Modal
      isOpen={Boolean(moduleKey)}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      screen="desktop"
    >
      <CustomModalLayout
        title={title}
        subtitle="Configure trigger thresholds and delivery rules for this module"
        primaryButtonText={isSaving ? 'Saving…' : 'Save rules'}
        primaryButtonOnClick={onSave}
        primaryButtonProps={{ disabled: Boolean(isSaving) }}
        secondaryButtonText="Cancel"
        secondaryButtonOnClick={onClose}
        secondaryButtonProps={{ disabled: Boolean(isSaving) }}
        onCloseButtonClick={onClose}
        width="560px"
        content={content}
      />
    </Modal>
  );
}
