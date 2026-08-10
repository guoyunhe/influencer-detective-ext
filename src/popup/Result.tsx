import { useState, useEffect } from 'react';
import useCurrentTab from './useCurrentTab';
import lookup from './lookup';
import { Box, Button, Center, Group, Loader, Stack } from '@mantine/core';
import InfluencerCard from './InfluencerCard';
import browser from 'webextension-polyfill';

export default function Result() {
  const currentTab = useCurrentTab();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentTab?.url) {
      setLoading(true);
      lookup(currentTab.url)
        .then((res) => setResult(res.data))
        .catch(() => setResult(null))
        .finally(() => setLoading(false));
    }
  }, [currentTab?.url]);

  if (loading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (!result) {
    return (
      <Box p="sm">
        <Center mb="sm">{browser.i18n.getMessage('notFound')}</Center>

        <Group gap="xs">
          <Button
            component="a"
            href={`http://localhost:3000/ask?url=${encodeURIComponent(currentTab?.url ?? '')}`}
            size="xs"
          >
            {browser.i18n.getMessage('ask')}
          </Button>
          <Button
            component="a"
            href={`http://localhost:3000/submit?url=${encodeURIComponent(currentTab?.url ?? '')}`}
            target="_blank"
            size="xs"
            color="green"
          >
            {browser.i18n.getMessage('submit')}
          </Button>
        </Group>
      </Box>
    );
  }

  return (
    <div>
      <Stack p="sm">
        {result.influencers.map((influencer: any) => (
          <InfluencerCard key={influencer.id} influencer={influencer} />
        ))}
      </Stack>
    </div>
  );
}
