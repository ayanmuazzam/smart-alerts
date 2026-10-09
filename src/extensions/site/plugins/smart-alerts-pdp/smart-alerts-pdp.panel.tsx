import React, { type FC } from 'react';
import { SidePanel, WixDesignSystemProvider, Text } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

const Panel: FC = () => {
  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content>
          <Text>
            Shows the low-stock urgency badge and restock countdown (slot
            product-page-details-2). Configure styling under Storefront Customization → Urgency
            &amp; Timers.
          </Text>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
