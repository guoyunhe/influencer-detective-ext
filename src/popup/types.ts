export interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'user' | string;
  email?: string | null;
}

export interface Comment {
  id: number;
  body: string;
  userId: number;
  createdAt: string;
  updatedAt: string | null;
  user?: User | null;
}

export interface Post {
  id: number;
  platform: string;
  type: string;
  externalId: string;
  externalUrl: string;
  embedUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  influencers?: Influencer[];
  comments?: Comment[];
}

export interface Account {
  id: number;
  platform: string;
  username: string;
  url: string | null;
}

export interface Tag {
  id: number;
  slug: string;
  name: Record<string, string>;
  forInfluencer: boolean;
  icon: string | null;
}

export interface Influencer {
  id: number;
  slug: string;
  name: Record<string, string>;
  alias: string[];
  excludeKeywords: string[];
  gender: string | null;
  region: string | null;
  avatar: string | null;
  cover: string | null;
  createdAt: string;
  updatedAt: string | null;
  accounts?: Account[];
  tags?: Tag[];
}
