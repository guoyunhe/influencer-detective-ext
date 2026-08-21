/*
 * Background service worker.
 *
 * Relays lookup requests from content scripts to the Influencer Detector API.
 * Content scripts cannot call the API directly: they share the host page's
 * origin, so cross-origin fetches are subject to the page's CORS policy. The
 * service worker has host_permissions and can reach the API freely.
 */

const DEFAULT_API_BASE = import.meta.env.VITE_API_URL;
const STORAGE_KEY = 'apiBase';

async function getApiBase(): Promise<string> {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY];
  return typeof value === 'string' && value ? value : DEFAULT_API_BASE;
}

interface LookupTag {
  id: number;
  name: Record<string, string>;
}

interface LookupInfluencer {
  id: number;
  name: Record<string, string>;
  gender: string | null;
  region: string | null;
  avatar: string | null;
  tags?: LookupTag[];
}

interface LookupPost {
  id: number;
  externalId: string;
  influencers?: LookupInfluencer[];
}

async function lookupPost(platform: string, externalId: string): Promise<LookupPost | null> {
  const apiBase = await getApiBase();
  const url = new URL('/posts/lookup', apiBase);
  url.searchParams.set('platform', platform);
  url.searchParams.set('externalId', externalId);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  return json?.data ?? null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'LOOKUP_POST') {
    lookupPost(msg.platform, msg.externalId)
      .then((post) => sendResponse(post))
      .catch(() => sendResponse(null));
    return true; // keep the message channel open for the async response
  }
  return false;
});
