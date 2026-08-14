import xior from 'xior';

import type { Post } from './types';

interface LookupResponse {
  data: Post;
}

export default async function lookup(params: {
  platform: string;
  externalId: string;
}): Promise<Post> {
  const res = await xior.get<LookupResponse>('/posts/lookup', { params });
  return res.data.data;
}
