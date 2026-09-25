import React, { type FC } from 'react';
import { SidePanel, WixDesignSystemProvider, Text } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

const Panel: FC = () => {
  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content>
          <Text>
            Smart Alerts reads product stock and price from the page context. Configure modules and
            appearance in the Smart Alerts dashboard.
          </Text>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
