import { extensions } from '@wix/astro/builders'

export default extensions.sitePlugin({
  id: 'b9345f77-369c-4b71-91c6-79c07eadaa17',
  name: 'Smart Alerts PDP',
  marketData: {
    name: 'Smart Alerts PDP',
    description: 'Back-in-stock, price-drop, and urgency alerts on the product page.',
    logoUrl: '{{BASE_URL}}/smart-alerts-pdp-logo.svg',
  },
  placements: [
    {
      appDefinitionId: 'a0c68605-c2e7-4c8d-9ea1-767f9770e087',
      widgetId: '6a25b678-53ec-4b37-a190-65fcd1ca1a63',
      slotId: 'product-page-details-2',
    },
    {
      appDefinitionId: '1380b703-ce81-ff05-f115-39571d94dfcd',
      widgetId: '13a94f09-2766-3c40-4a32-8edb5acdd8bc',
      slotId: 'product-page-details-2',
    },
  ],
  installation: { autoAdd: true },
  tagName: 'smart-alerts-pdp',
  element: './extensions/site/plugins/smart-alerts-pdp/smart-alerts-pdp.tsx',
  settings: './extensions/site/plugins/smart-alerts-pdp/smart-alerts-pdp.panel.tsx',
});
