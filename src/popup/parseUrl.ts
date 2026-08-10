export default function parse(url?: string): { platform: string; externalId: string } | null {
  if (!url) return null;

  const urlObj = new URL(url);

  switch (urlObj.hostname) {
    case 'www.instagram.com':
      // post
      if (urlObj.pathname.startsWith('/p/')) {
        return { platform: 'instagram', externalId: urlObj.pathname.split('/')[2] || '' };
      }
      // other
      return null;
    case 'www.tiktok.com':
      // video
      if (urlObj.pathname.startsWith('/@') && urlObj.pathname.split('/')[1] === 'video') {
        return { platform: 'tiktok', externalId: urlObj.pathname.split('/')[2] || '' };
      }
      // other
      return null;
    case 'www.youtube.com':
      // shorts
      if (urlObj.pathname.startsWith('/shorts/')) {
        return { platform: 'youtube', externalId: urlObj.pathname.split('/')[2] || '' };
      }
      // video
      if (urlObj.pathname === '/watch') {
        return { platform: 'youtube', externalId: urlObj.searchParams.get('v') || '' };
      }
      // unknown
      return null;
    case 'www.bilibili.com':
      // video
      if (urlObj.pathname.startsWith('/video/')) {
        return { platform: 'bilibili', externalId: urlObj.pathname.split('/')[2] || '' };
      }
      // unknown
      return null;
    default:
      return null;
  }
}
