import { Box, Button, Center, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import browser from 'webextension-polyfill';

import InfluencerCard from './InfluencerCard';
import lookup from './lookup';
import parseUrl from './parseUrl';
import type { Comment, Post } from './types';
import useCurrentTab from './useCurrentTab';

export default function Result() {
  const currentTab = useCurrentTab();

  const url = currentTab?.url;
  const params = useMemo(() => parseUrl(url), [url]);

  const [result, setResult] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params) {
      setLoading(true);
      lookup(params)
        .then((post) => setResult(post))
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
      {result?.influencers && result.influencers.length > 0 ? (
        <Stack p='sm'>
          {result.influencers.map((influencer) => (
            <InfluencerCard key={influencer.id} influencer={influencer} />
          ))}
        </Stack>
      ) : (
        <Center h={80}>{browser.i18n.getMessage('notFound')}</Center>
      )}

      <Divider />

      {result?.comments && result.comments.length > 0 && (
        <Stack gap='xs'>
          <Text fw={700}>{browser.i18n.getMessage('comments')}</Text>
          {result.comments.map((comment: Comment) => (
            <Stack key={comment.id} gap={2}>
              <Group justify='space-between' wrap='nowrap'>
                <Text size='sm' fw={600}>
                  {comment.user?.name ?? browser.i18n.getMessage('anonymous')}
                </Text>
                <Text size='xs' c='dimmed'>
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </Group>
              <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                {comment.body}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}

      <Button
        component='a'
        href={
          result?.id
            ? `http://localhost:3000/posts/${result.id}`
            : `http://localhost:3000/posts/new?url=${encodeURIComponent(currentTab?.url ?? '')}`
        }
        target='_blank'
        fullWidth
      >
        {browser.i18n.getMessage('askOrSubmit')}
      </Button>
    </div>
  );
}
