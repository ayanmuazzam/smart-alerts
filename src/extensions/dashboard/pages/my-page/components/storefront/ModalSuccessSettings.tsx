import React from 'react';
import { Box, FormField, Input, NumberInput } from '@wix/design-system';
import { Package, Tag } from '@wix/wix-ui-icons-common';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

type Props = {
  modal: Record<string, any>;
  modalScenario: 'out_of_stock' | 'in_stock';
  setModalScenario: (s: 'out_of_stock' | 'in_stock') => void;
  patchModal: (patch: Record<string, unknown>) => void;
};

export function ModalSuccessSettings({
  modal,
  modalScenario,
  setModalScenario,
  patchModal,
}: Props) {
  const autoCloseSec = Math.max(
    1,
    Math.round(Number(modal.successAutoCloseMs ?? 2500) / 1000) || 2,
  );

  return (
    <Box direction="vertical" gap="14px">
      <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
        After subscribe, the form hides and a success icon + message appear. The popup then closes
        automatically.
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(
          [
            {
              id: 'out_of_stock' as const,
              label: 'Notify Me success',
              icon: <Package size="14" />,
            },
            {
              id: 'in_stock' as const,
              label: 'Watch Price success',
              icon: <Tag size="14" />,
            },
          ] as const
        ).map((t) => {
          const isSel = modalScenario === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setModalScenario(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: isSel ? '1.5px solid #116DFF' : '1px solid #E2E8F0',
                backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                color: isSel ? '#116DFF' : '#475569',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: FONT_SANS,
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {modalScenario === 'out_of_stock' ? (
        <>
          <FormField label="Success Headline">
            <Input
              value={String(modal.notifySuccessTitle || '')}
              onChange={(e) => patchModal({ notifySuccessTitle: e.target.value })}
              placeholder="You're subscribed!"
            />
          </FormField>
          <FormField label="Success Message">
            <Input
              value={String(modal.notifySuccessDescription || '')}
              onChange={(e) => patchModal({ notifySuccessDescription: e.target.value })}
              placeholder="We'll email you when it's back in stock."
            />
          </FormField>
        </>
      ) : (
        <>
          <FormField label="Success Headline">
            <Input
              value={String(modal.priceSuccessTitle || '')}
              onChange={(e) => patchModal({ priceSuccessTitle: e.target.value })}
              placeholder="You're watching this price!"
            />
          </FormField>
          <FormField label="Success Message">
            <Input
              value={String(modal.priceSuccessDescription || '')}
              onChange={(e) => patchModal({ priceSuccessDescription: e.target.value })}
              placeholder="We'll email you if the price drops."
            />
          </FormField>
        </>
      )}

      <FormField label="Auto-close after (seconds)">
        <NumberInput
          value={autoCloseSec}
          min={1}
          max={15}
          onChange={(v) =>
            patchModal({ successAutoCloseMs: Math.max(1, Number(v ?? 2)) * 1000 })
          }
        />
      </FormField>
    </Box>
  );
}
