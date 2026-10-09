import { appInstances } from '@wix/app-management';
import { ensureCatalogSeeded } from '../../../../lib/smart-alerts/engine';
import { notifyDeveloperOfInstall } from '../../../../lib/smart-alerts/install-notify';

export default appInstances.onAppInstanceInstalled(async () => {
  try {
    await ensureCatalogSeeded('install');
  } catch (err) {
    console.error('app-instance-installed catalog seed failed', err);
  }

  // Separate from seed — never let notify failures affect provisioning.
  try {
    await notifyDeveloperOfInstall();
  } catch (err) {
    console.error('app-instance-installed notify failed', err);
  }
});
