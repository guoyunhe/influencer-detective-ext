import { Button, Card, Group, Text } from '@mantine/core';
import I18nAttr from './I18nAttr';
import { InstagramLogoIcon, TiktokLogoIcon, YoutubeLogoIcon } from '@phosphor-icons/react';

interface InfluencerCardProps {
  influencer: any;
}

export default function InfluencerCard({ influencer }: InfluencerCardProps) {
  return (
    <Card withBorder shadow="sm">
      <Card.Section withBorder inheritPadding py="xs">
        <Text fw={700}>
          <I18nAttr value={influencer.name} />
        </Text>
      </Card.Section>
      <Card.Section inheritPadding py="xs">
        <Group gap="sm">
          {influencer.youtube && (
            <Button
              leftSection={<YoutubeLogoIcon size={20} weight="fill" />}
              component="a"
              href={`https://www.youtube.com/@${influencer.youtube}`}
              target="_blank"
              color="red"
              size="xs"
            >
              YouTube
            </Button>
          )}
          {influencer.instagram && (
            <Button
              leftSection={<InstagramLogoIcon size={20} />}
              component="a"
              href={`https://www.instagram.com/${influencer.instagram}`}
              target="_blank"
              color="pink"
              size="xs"
            >
              Instagram
            </Button>
          )}
          {influencer.tiktok && (
            <Button
              leftSection={<TiktokLogoIcon size={20} />}
              component="a"
              href={`https://www.tiktok.com/@${influencer.tiktok}`}
              target="_blank"
              color="cyan"
              size="xs"
            >
              TikTok
            </Button>
          )}
        </Group>
      </Card.Section>
    </Card>
  );
}
