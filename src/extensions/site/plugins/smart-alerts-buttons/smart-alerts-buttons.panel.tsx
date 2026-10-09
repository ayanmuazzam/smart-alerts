import React, { type FC } from 'react';
import { SidePanel, WixDesignSystemProvider, Text } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

const Panel: FC = () => {
  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content>
          <Text>
            Shows Notify Me and Watch for price drop (slot product-page-details-8). Configure
            styles in the Smart Alerts dashboard under Storefront Customization.
          </Text>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
