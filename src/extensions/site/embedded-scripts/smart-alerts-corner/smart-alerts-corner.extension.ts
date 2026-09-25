import { extensions } from '@wix/astro/builders';

/** Kept only so we can disable any previously embedded corner script on sites. Renders nothing. */
export default extensions.embeddedScript({
  id: 'f1428cdb-83d7-4ac1-b13d-91ee44f6d480',
  name: 'Smart Alerts Corner',
  placement: 'BODY_END',
  scriptType: 'FUNCTIONAL',
  source: './extensions/site/embedded-scripts/smart-alerts-corner/smart-alerts-corner.html',
});
