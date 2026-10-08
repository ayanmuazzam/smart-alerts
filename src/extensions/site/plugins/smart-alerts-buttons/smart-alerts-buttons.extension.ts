import { extensions } from '@wix/astro/builders';

export default extensions.sitePlugin({
  id: '41cec966-b932-48dc-9716-db3514a5c74b',
  name: 'Smart Alerts Buttons',
  marketData: {
    name: 'Smart Alerts Buttons',
    description: 'Notify Me and Watch for price drop buttons on the product page.',
    logoUrl: '{{BASE_URL}}/smart-alerts-buttons-logo.svg',
  },
  placements: [
    {
      appDefinitionId: 'a0c68605-c2e7-4c8d-9ea1-767f9770e087',
      widgetId: '6a25b678-53ec-4b37-a190-65fcd1ca1a63',
      slotId: 'product-page-details-8',
    },
    {
      appDefinitionId: '1380b703-ce81-ff05-f115-39571d94dfcd',
      widgetId: '13a94f09-2766-3c40-4a32-8edb5acdd8bc',
      slotId: 'product-page-details-8',
    },
  ],
  installation: { autoAdd: true },
  tagName: 'smart-alerts-buttons',
  element: './extensions/site/plugins/smart-alerts-buttons/smart-alerts-buttons.tsx',
  settings: './extensions/site/plugins/smart-alerts-buttons/smart-alerts-buttons.panel.tsx',
});
