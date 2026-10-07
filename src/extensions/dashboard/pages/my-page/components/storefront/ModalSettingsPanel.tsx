import React, { useState } from 'react';
import { Box, Cell, ColorInput, FormField, Input, Layout, NumberInput } from '@wix/design-system';
import { Confirm, Design, Package, Tag } from '@wix/wix-ui-icons-common';
import { ButtonStyleEditor } from './ButtonStyleEditor';
import { ModalSuccessSettings } from './ModalSuccessSettings';
import { DEFAULT_APPEARANCE } from '../../../../../../lib/smart-alerts/constants';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

type ModalSubTab = 'notify' | 'price' | 'layout' | 'success';

type Props = {
  modal: Record<string, any>;
  colors: Record<string, string>;
  modalSubmit: Record<string, any>;
  modalScenario: 'out_of_stock' | 'in_stock';
  setModalScenario: (s: 'out_of_stock' | 'in_stock') => void;
  setShowSuccessPreview: (v: boolean) => void;
  patchModal: (patch: Record<string, unknown>) => void;
  patchModalSubmit: (patch: Record<string, unknown>) => void;
  setPaletteColor: (key: string, color: unknown) => void;
};

const SUB_TABS: { id: ModalSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'notify', label: 'Notify Me labels', icon: <Package size="14" /> },
  { id: 'price', label: 'Watch Price labels', icon: <Tag size="14" /> },
  { id: 'layout', label: 'Look & layout', icon: <Design size="14" /> },
  { id: 'success', label: 'Success', icon: <Confirm size="14" /> },
];

export function ModalSettingsPanel({
  modal,
  colors,
  modalSubmit,
  modalScenario,
  setModalScenario,
  setShowSuccessPreview,
  patchModal,
  patchModalSubmit,
  setPaletteColor,
}: Props) {
  const [subTab, setSubTab] = useState<ModalSubTab>(
    modalScenario === 'in_stock' ? 'price' : 'notify',
  );

  const selectSubTab = (id: ModalSubTab) => {
    setSubTab(id);
    setShowSuccessPreview(id === 'success');
    if (id === 'notify') setModalScenario('out_of_stock');
    if (id === 'price') setModalScenario('in_stock');
  };

  return (
    <Box direction="vertical" gap="14px">
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '6px',
          }}
        >
          Modal copy &amp; layout
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUB_TABS.map((tab) => {
            const isSel = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectSubTab(tab.id)}
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
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {subTab === 'notify' ? (
        <Box direction="vertical" gap="14px">
          <FormField label="Modal Headline">
            <Input
              value={String(modal.notifyTitle || '')}
              onChange={(e) => patchModal({ notifyTitle: e.target.value })}
              placeholder="Notify me when back in stock"
            />
          </FormField>
          <FormField label="Modal Description">
            <Input
              value={String(modal.notifyDescription || '')}
              onChange={(e) => patchModal({ notifyDescription: e.target.value })}
              placeholder="We'll email you when this product is available again."
            />
          </FormField>
          <FormField label="Consent Checkbox Text">
            <Input
              value={String(modal.notifyConsentLabel || '')}
              onChange={(e) => patchModal({ notifyConsentLabel: e.target.value })}
              placeholder="I agree to receive stock alerts for this product."
            />
          </FormField>
        </Box>
      ) : null}

      {subTab === 'price' ? (
        <Box direction="vertical" gap="14px">
          <FormField label="Modal Headline">
            <Input
              value={String(modal.priceTitle || '')}
              onChange={(e) => patchModal({ priceTitle: e.target.value })}
              placeholder="Watch for price drop"
            />
          </FormField>
          <FormField label="Modal Description">
            <Input
              value={String(modal.priceDescription || '')}
              onChange={(e) => patchModal({ priceDescription: e.target.value })}
              placeholder="Get an email when the price of this product drops."
            />
          </FormField>
          <FormField label="Consent Checkbox Text">
            <Input
              value={String(modal.priceConsentLabel || '')}
              onChange={(e) => patchModal({ priceConsentLabel: e.target.value })}
              placeholder="Send me a price-drop alert."
            />
          </FormField>
        </Box>
      ) : null}

      {subTab === 'layout' ? (
        <Box direction="vertical" gap="14px">
          <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
            These controls apply to both Notify Me and Watch Price popups.
          </div>

          <Layout gap="12px">
            <Cell span={6}>
              <FormField label="Email Label">
                <Input
                  value={String(modal.emailLabel || '')}
                  onChange={(e) => patchModal({ emailLabel: e.target.value })}
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Email Placeholder">
                <Input
                  value={String(modal.emailPlaceholder || '')}
                  onChange={(e) => patchModal({ emailPlaceholder: e.target.value })}
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Phone Label">
                <Input
                  value={String(modal.phoneLabel || '')}
                  onChange={(e) => patchModal({ phoneLabel: e.target.value })}
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Phone Placeholder">
                <Input
                  value={String(modal.phonePlaceholder || '')}
                  onChange={(e) => patchModal({ phonePlaceholder: e.target.value })}
                />
              </FormField>
            </Cell>
          </Layout>

          <Layout gap="12px">
            <Cell span={6}>
              <FormField label="Modal Corner Radius">
                <NumberInput
                  value={Number(modal.borderRadius ?? DEFAULT_APPEARANCE.modal.borderRadius)}
                  min={0}
                  max={32}
                  onChange={(v) =>
                    patchModal({
                      borderRadius: Number(v ?? DEFAULT_APPEARANCE.modal.borderRadius),
                    })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Modal Border Width">
                <NumberInput
                  value={Number(modal.borderWidth ?? DEFAULT_APPEARANCE.modal.borderWidth)}
                  min={0}
                  max={8}
                  onChange={(v) =>
                    patchModal({
                      borderWidth: Number(v ?? DEFAULT_APPEARANCE.modal.borderWidth),
                    })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Input Corner Radius">
                <NumberInput
                  value={Number(
                    modal.inputBorderRadius ?? DEFAULT_APPEARANCE.modal.inputBorderRadius,
                  )}
                  min={0}
                  max={24}
                  onChange={(v) =>
                    patchModal({
                      inputBorderRadius: Number(
                        v ?? DEFAULT_APPEARANCE.modal.inputBorderRadius,
                      ),
                    })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Input Border Width">
                <NumberInput
                  value={Number(
                    modal.inputBorderWidth ?? DEFAULT_APPEARANCE.modal.inputBorderWidth,
                  )}
                  min={0}
                  max={8}
                  onChange={(v) =>
                    patchModal({
                      inputBorderWidth: Number(
                        v ?? DEFAULT_APPEARANCE.modal.inputBorderWidth,
                      ),
                    })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Modal Max Width">
                <NumberInput
                  value={Number(modal.maxWidth ?? DEFAULT_APPEARANCE.modal.maxWidth)}
                  min={280}
                  max={720}
                  onChange={(v) =>
                    patchModal({ maxWidth: Number(v ?? DEFAULT_APPEARANCE.modal.maxWidth) })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Input Padding">
                <NumberInput
                  value={Number(modal.inputPadding ?? DEFAULT_APPEARANCE.modal.inputPadding)}
                  min={6}
                  max={32}
                  onChange={(v) =>
                    patchModal({
                      inputPadding: Number(v ?? DEFAULT_APPEARANCE.modal.inputPadding),
                    })
                  }
                />
              </FormField>
            </Cell>
            <Cell span={6}>
              <FormField label="Modal Padding">
                <NumberInput
                  value={Number(modal.padding ?? DEFAULT_APPEARANCE.modal.padding)}
                  min={12}
                  max={80}
                  onChange={(v) =>
                    patchModal({ padding: Number(v ?? DEFAULT_APPEARANCE.modal.padding) })
                  }
                />
              </FormField>
            </Cell>
          </Layout>

          <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Modal Colors</div>
          <Layout gap="12px">
            {(
              [
                ['primary', 'Primary Accent (checkbox / success)'],
                ['secondary', 'Border & Accents (modal + inputs)'],
                ['text', 'Heading Text'],
                ['background', 'Modal Background'],
                ['muted', 'Subtitle Text'],
              ] as const
            ).map(([key, label]) => (
              <Cell key={key} span={6}>
                <FormField label={label}>
                  <ColorInput
                    value={
                      colors[key] ||
                      (DEFAULT_APPEARANCE.colors as Record<string, string>)[key] ||
                      '#0F766E'
                    }
                    onConfirm={(c) => setPaletteColor(key, c)}
                    onChange={(c) => setPaletteColor(key, c)}
                  />
                </FormField>
              </Cell>
            ))}
          </Layout>

          <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Modal Submit Button
          </div>
          <ButtonStyleEditor
            btn={modalSubmit}
            onPatch={patchModalSubmit}
            labelPlaceholder="Subscribe"
          />
        </Box>
      ) : null}

      {subTab === 'success' ? (
        <ModalSuccessSettings
          modal={modal}
          modalScenario={modalScenario}
          setModalScenario={setModalScenario}
          patchModal={patchModal}
        />
      ) : null}
    </Box>
  );
}
