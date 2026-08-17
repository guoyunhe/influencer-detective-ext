/*
 * YouTube content script.
 *
 * Watches for video cards (thumbnail anchors whose href contains "/watch")
 * and overlays a small widget in their top-left corner. The widget shows
 * the influencers attached to the video — avatar with a tooltip (name,
 * region, gender) linking to the influencer page — or, when nothing is
 * found yet, the extension icon linking to the "submit a post" page.
 */

interface Influencer {
  id: number;
  name: Record<string, string>;
  gender: string | null;
  region: string | null;
  avatar: string | null;
}

interface Post {
  id: number;
  influencers?: Influencer[];
}

const APP_URL = import.meta.env.VITE_APP_URL;
const WATCH_SELECTOR = 'a[href*="/watch"], a[href*="/shorts/"]';
const HOST_CLASS = 'infdet-overlay-host';

const processed = new WeakMap<HTMLAnchorElement, string>();
const hosts = new WeakMap<HTMLAnchorElement, HTMLElement>();
const cache = new Map<string, Promise<Post | null>>();

function getVideoId(anchor: HTMLAnchorElement): string | null {
  try {
    const url = new URL(anchor.href);
    return url.searchParams.get('v') || url.pathname.split('/')[2] || null;
  } catch {
    return null;
  }
}

function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function lookupPost(videoId: string): Promise<Post | null> {
  let pending = cache.get(videoId);
  if (!pending) {
    pending = new Promise<Post | null>((resolve) => {
      let settled = false;
      const done = (value: Post | null) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      try {
        chrome.runtime.sendMessage(
          { type: 'LOOKUP_POST', platform: 'youtube', externalId: videoId },
          (post: Post | null) => done(post ?? null),
        );
      } catch {
        done(null);
      }
      window.setTimeout(() => done(null), 10000);
    });
    cache.set(videoId, pending);
  }
  return pending;
}

function pickName(name: Record<string, string>): string {
  const lang = chrome.i18n.getUILanguage().split('-')[0];
  return name[lang] || name.en || Object.values(name)[0] || '';
}

const GENDER_EMOJIS: Record<string, string> = {
  male: '♂️',
  female: '♀️',
  other: '⚧️',
};

/** Convert a two-letter region code (e.g. 'kr') into a flag emoji. */
function regionToFlag(region: string | null): string | null {
  if (!region || region.length !== 2) return null;
  const codePoints = region
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  if (codePoints.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return null;
  return String.fromCodePoint(...codePoints);
}

function formatMeta(region: string | null, gender: string | null): string {
  const parts = [regionToFlag(region), gender ? GENDER_EMOJIS[gender] : null].filter(Boolean);
  return parts.join(' ');
}

const STYLE = `
  :host {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    pointer-events: auto;
  }
  .infdet-root {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .infdet-item {
    position: relative;
    display: block;
  }
  .infdet-avatar-link,
  .infdet-icon-link {
    display: block;
    line-height: 0;
  }
  .infdet-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    object-fit: cover;
    background-color: #fff;
    display: block;
  }
  .infdet-icon {
    width: 30px;
    height: 30px;
    display: block;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45));
  }
  .infdet-tooltip {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    display: none;
    background: rgba(15, 15, 15, 0.94);
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    font: 12px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    z-index: 1;
  }
  .infdet-item:hover .infdet-tooltip {
    display: block;
  }
  .infdet-tooltip-name {
    font-weight: 600;
  }
  .infdet-tooltip-meta {
    opacity: 0.85;
    font-size: 11px;
  }
`;

function createAvatar(influencer: Influencer): HTMLElement {
  const item = document.createElement('div');
  item.className = 'infdet-item';

  const link = document.createElement('a');
  link.className = 'infdet-avatar-link';
  link.href = `${APP_URL}/influencers/${influencer.id}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const img = document.createElement('img');
  img.className = 'infdet-avatar';
  img.alt = pickName(influencer.name);
  img.src = influencer.avatar ?? '';
  img.onerror = () => {
    img.src = chrome.runtime.getURL('icons/icon48.png');
  };
  link.appendChild(img);

  const tooltip = document.createElement('div');
  tooltip.className = 'infdet-tooltip';

  const name = document.createElement('div');
  name.className = 'infdet-tooltip-name';
  name.textContent = pickName(influencer.name);
  tooltip.appendChild(name);

  const metaText = formatMeta(influencer.region, influencer.gender);
  if (metaText) {
    const meta = document.createElement('div');
    meta.className = 'infdet-tooltip-meta';
    meta.textContent = metaText;
    tooltip.appendChild(meta);
  }

  item.appendChild(link);
  item.appendChild(tooltip);
  return item;
}

function createIcon(videoId: string): HTMLElement {
  const link = document.createElement('a');
  link.className = 'infdet-icon-link';
  link.href = `${APP_URL}/posts/new?url=${encodeURIComponent(videoUrl(videoId))}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const img = document.createElement('img');
  img.className = 'infdet-icon';
  img.src = chrome.runtime.getURL('icons/icon48.png');
  img.src = 'https://infdet.com/favicon.svg';
  img.alt = 'Influencer Detector';
  link.appendChild(img);
  return link;
}

function renderBadge(anchor: HTMLAnchorElement, videoId: string) {
  hosts.get(anchor)?.remove();

  const host = document.createElement('span');
  host.className = HOST_CLASS;
  // The host is a sibling of the thumbnail anchor, so clicks on our widget
  // never bubble into the anchor and navigate to the video.
  host.addEventListener('click', (event) => event.stopPropagation());

  // Position the host against the anchor's parent (the thumbnail container),
  // keeping it a sibling so YouTube's DOM updates don't wipe it out.
  const parent = anchor.parentElement;
  if (parent && getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }
  anchor.insertAdjacentElement('afterend', host);
  hosts.set(anchor, host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = STYLE;
  shadow.appendChild(style);

  const root = document.createElement('div');
  root.className = 'infdet-root';
  shadow.appendChild(root);

  lookupPost(videoId).then((post) => {
    const influencers = post?.influencers ?? [];
    root.replaceChildren();
    if (influencers.length === 0) {
      root.appendChild(createIcon(videoId));
    } else {
      for (const influencer of influencers) {
        root.appendChild(createAvatar(influencer));
      }
    }
  });
}

function processAnchor(anchor: HTMLAnchorElement) {
  // Only anchors containing a thumbnail view model are video cards; other
  // `/watch` links (channel headers, playlists, etc.) are skipped.
  if (!anchor.querySelector('yt-thumbnail-view-model')) return;

  const videoId = getVideoId(anchor);
  if (!videoId) return;

  const host = hosts.get(anchor);
  if (processed.get(anchor) === videoId && host?.isConnected) {
    return; // already up to date
  }

  processed.set(anchor, videoId);
  renderBadge(anchor, videoId);
}

function scan(root: ParentNode) {
  root.querySelectorAll<HTMLAnchorElement>(WATCH_SELECTOR).forEach(processAnchor);
}

scan(document);

// Batch MutationObserver callbacks: collect the changed parent nodes and
// scan each of them once per animation frame, instead of scanning every
// added node individually. This avoids redundant scans when a large subtree
// (e.g. a feed of video cards) is inserted at once.
const dirtyRoots = new Set<ParentNode>();
let scheduled = false;

function scheduleScan() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    for (const root of dirtyRoots) scan(root);
    dirtyRoots.clear();
  });
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.target instanceof Element) {
      dirtyRoots.add(mutation.target);
    }
    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        // New nodes may be the card itself or a descendant such as the
        // thumbnail view model; walk up to the nearest `/watch` anchor.
        const anchor = node.closest<HTMLAnchorElement>(WATCH_SELECTOR);
        if (anchor) processAnchor(anchor);
      }
    });
  }
  scheduleScan();
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// YouTube is a SPA that recycles DOM nodes while scrolling; re-scan
// periodically as a fallback to restore any overlays it may have removed.
// Run infrequently and during idle time to avoid jank.
setInterval(() => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => scan(document));
  } else {
    scan(document);
  }
}, 5000);
