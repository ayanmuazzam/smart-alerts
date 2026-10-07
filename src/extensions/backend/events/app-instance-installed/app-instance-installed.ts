import { appInstances } from '@wix/app-management';
import { ensureCatalogSeeded } from '../../../../lib/smart-alerts/engine';

export default appInstances.onAppInstanceInstalled(async () => {
  try {
    await ensureCatalogSeeded('install');
  } catch (err) {
    console.error('app-instance-installed catalog seed failed', err);
  }
});
