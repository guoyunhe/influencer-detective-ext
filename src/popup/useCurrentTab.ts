import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';

export default function useCurrentTab() {
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null);

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        setCurrentTab(tabs[0]);
      }
    });
  }, []);

  return currentTab;
}
