import { Box, Button, Center, Group, Loader, Stack } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import browser from 'webextension-polyfill';

import InfluencerCard from './InfluencerCard';
import lookup from './lookup';
import parseUrl from './parseUrl';
import useCurrentTab from './useCurrentTab';

export default function Result() {
  const currentTab = useCurrentTab();

  const url = currentTab?.url;
  const params = useMemo(() => parseUrl(url), [url]);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params) {
      setLoading(true);
      lookup(params)
        .then((res) => setResult(res.data))
        .catch(() => setResult(null))
        .finally(() => setLoading(false));
    }
  }, [params]);

  if (!params) {
    return <Center p='sm'>{browser.i18n.getMessage('unsupported')}</Center>;
  }

  if (loading) {
    return (
      <Center p='sm'>
        <Loader />
      </Center>
    );
  }

  return (
    <div>
      {result?.influencers.length > 0 ? (
        <Stack p='sm'>
          {result?.influencers.map((influencer: any) => (
            <InfluencerCard key={influencer.id} influencer={influencer} />
          ))}
        </Stack>
      ) : (
        <Box p='sm'>
          <Center mb='sm'>{browser.i18n.getMessage('notFound')}</Center>

          <Group gap='xs'>
            <Button
              component='a'
              href={
                result?.id
                  ? `http://localhost:3000/posts/${result.id}`
                  : `http://localhost:3000/posts/new?url=${encodeURIComponent(currentTab?.url ?? '')}`
              }
              target='_blank'
              size='xs'
            >
              {browser.i18n.getMessage('askOrSubmit')}
            </Button>
          </Group>
        </Box>
      )}
    </div>
  );
}
