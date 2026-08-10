import xior from 'xior';

export default function lookup(params: { platform: string; externalId: string }) {
  return xior.get<any>('/posts/lookup', { params });
}
