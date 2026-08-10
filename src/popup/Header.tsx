import browser from 'webextension-polyfill';
import { GearIcon } from '@phosphor-icons/react';
import { ActionIcon, Flex, Title } from '@mantine/core';

export default function Header() {
  const title = browser.i18n.getMessage('appName');

  return (
    <Flex align="center" p="sm">
      <Title size="md" style={{ flexGrow: 1 }}>
        {title}
      </Title>
      <ActionIcon
        variant="default"
        onClick={() => browser.runtime.openOptionsPage()}
        title="Settings"
        aria-label="Settings"
      >
        <GearIcon />
      </ActionIcon>
    </Flex>
  );
}
