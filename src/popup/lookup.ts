import xior from 'xior';

export default function lookup(url: string) {
  const urlObj = new URL(url);
  let platform = '';
  let externalId = '';

  switch (urlObj.hostname) {
    case 'www.instagram.com':
      platform = 'instagram';
      externalId = urlObj.pathname.split('/')[1] || '';
      break;
    case 'www.tiktok.com':
      platform = 'tiktok';
      externalId = urlObj.pathname.split('/')[2] || '';
      break;
    case 'www.youtube.com':
      platform = 'youtube';
      externalId = urlObj.searchParams.get('v') || '';
      break;
    case 'www.bilibili.com':
      platform = 'bilibili';
      externalId = urlObj.pathname.split('/')[2] || '';
      break;
    default:
      platform = '';
      externalId = '';
  }

  return xior.get<any>('/posts/lookup', { params: { platform, externalId } });
}
