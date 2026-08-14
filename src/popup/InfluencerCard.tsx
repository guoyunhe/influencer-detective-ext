import { Button, Card, Group, Text } from '@mantine/core';
import { InstagramLogoIcon, TiktokLogoIcon, YoutubeLogoIcon } from '@phosphor-icons/react';

import I18nAttr from './I18nAttr';
import type { Account, Influencer } from './types';

interface InfluencerCardProps {
  influencer: Influencer;
}

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
        <Text fw={700}>
          <I18nAttr value={influencer.name} />
        </Text>
      </Card.Section>
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
