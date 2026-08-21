import { Badge, Button, Card, Group, Text } from '@mantine/core';
import { InstagramLogoIcon, TiktokLogoIcon, YoutubeLogoIcon } from '@phosphor-icons/react';

import I18nAttr from './I18nAttr';
import type { Account, Influencer } from './types';

interface InfluencerCardProps {
  influencer: Influencer;
}

const GENDER_EMOJIS: Record<string, string> = {
  male: '♂️',
  female: '♀️',
  other: '⚧️',
};

const ACCOUNT_STYLES: Record<
  string,
  { icon: typeof YoutubeLogoIcon; color: string; label: string }
> = {
  youtube: { icon: YoutubeLogoIcon, color: 'red', label: 'YouTube' },
  instagram: { icon: InstagramLogoIcon, color: 'pink', label: 'Instagram' },
  tiktok: { icon: TiktokLogoIcon, color: 'cyan', label: 'TikTok' },
};

export default function InfluencerCard({ influencer }: InfluencerCardProps) {
  return (
    <Card withBorder shadow='sm'>
      <Card.Section withBorder inheritPadding py='xs'>
        <Group gap='xs' wrap='nowrap'>
          <Text fw={700}>
            <I18nAttr value={influencer.name} />
          </Text>
          {influencer.gender && GENDER_EMOJIS[influencer.gender] && (
            <Text span>{GENDER_EMOJIS[influencer.gender]}</Text>
          )}
          {influencer.region && (
            <Text span c='dimmed' size='sm'>
              {influencer.region}
            </Text>
          )}
        </Group>
      </Card.Section>
      {influencer.tags && influencer.tags.length > 0 && (
        <Card.Section inheritPadding py='xs'>
          <Group gap='xs'>
            {influencer.tags.map((tag) => (
              <Badge key={tag.id} size='sm' variant='light'>
                <I18nAttr value={tag.name} />
              </Badge>
            ))}
          </Group>
        </Card.Section>
      )}
      <Card.Section inheritPadding py='xs'>
        <Group gap='sm'>
          {influencer.accounts?.map((account: Account) => {
            const style = ACCOUNT_STYLES[account.platform];
            const Icon = style?.icon;
            return (
              <Button
                key={account.id}
                leftSection={Icon ? <Icon size={20} /> : undefined}
                component='a'
                href={account.url ?? undefined}
                target='_blank'
                color={style?.color ?? 'gray'}
                variant={style ? 'filled' : 'light'}
                size='xs'
              >
                {style?.label ?? account.platform}
              </Button>
            );
          })}
        </Group>
      </Card.Section>
    </Card>
  );
}
