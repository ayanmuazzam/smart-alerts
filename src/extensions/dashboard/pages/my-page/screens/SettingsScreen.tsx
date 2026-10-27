import React from 'react';
import { SettingsWorkspace, type PlanInfo } from '../components/SettingsWorkspace';

type Props = {
  config: any;
  setConfig: (updater: any) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
  plan?: PlanInfo | null;
  onPlanChange?: (plan: PlanInfo) => void;
};

export function SettingsScreen({
  config,
  setConfig,
  onRun,
  adminPost,
  plan,
  onPlanChange,
}: Props) {
  if (!config) return null;

  const savePatch = (patch: Record<string, unknown>, msg: string) =>
    onRun(async () => {
      const data = await adminPost({ action: 'saveConfig', patch });
      if (data.config) setConfig(() => data.config);
      if (data.plan && onPlanChange) onPlanChange(data.plan);
    }, msg);

  const handleResetSettings = () =>
    onRun(async () => {
      const data = await adminPost({ action: 'resetSettings' });
      if (data.config) setConfig(() => data.config);
      if (data.plan && onPlanChange) onPlanChange(data.plan);
    }, 'Settings reset to defaults');

  return (
    <SettingsWorkspace
      config={config}
      setConfig={setConfig}
      onSavePatch={savePatch}
      onResetSettings={handleResetSettings}
      plan={plan}
    />
  );
}
