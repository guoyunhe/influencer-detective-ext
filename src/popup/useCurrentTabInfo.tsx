import { useEffect, useState } from 'react';

import useCurrentTab from './useCurrentTab';

export default function useCurrentTabInfo() {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const currentTab = useCurrentTab();

  useEffect(() => {
    if (currentTab?.id) {
      chrome.tabs
        .sendMessage(currentTab.id, { type: 'GET_VIDEO_INFO' })
        .then((info) => setVideoInfo(info))
        .catch(() => setVideoInfo(null));
    }
  }, [currentTab]);

  return videoInfo;
}
