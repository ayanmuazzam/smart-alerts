import React from 'react';
import { SettingsWorkspace } from '../components/SettingsWorkspace';

type Props = {
  config: any;
  setConfig: (updater: any) => void;
  onRun: (fn: () => Promise<void>, msg?: string) => void;
  adminPost: (body: Record<string, unknown>) => Promise<any>;
};

export function SettingsScreen({ config, setConfig, onRun, adminPost }: Props) {
  if (!config) return null;

  const savePatch = (patch: Record<string, unknown>, msg: string) =>
    onRun(async () => {
      const data = await adminPost({ action: 'saveConfig', patch });
      if (data.config) setConfig(() => data.config);
    }, msg);

  const handleResetSettings = () =>
    onRun(async () => {
      const data = await adminPost({ action: 'resetSettings' });
      if (data.config) setConfig(() => data.config);
    }, 'Settings reset to defaults');

  return (
    <SettingsWorkspace
      config={config}
      setConfig={setConfig}
      onSavePatch={savePatch}
      onResetSettings={handleResetSettings}
    />
  );
}
