import { useState, useEffect } from 'react';
import useCurrentTab from './useCurrentTab';
import lookup from './lookup';
import { Center, Loader, Stack } from '@mantine/core';
import InfluencerCard from './InfluencerCard';

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
    return <div>No result found.</div>;
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
