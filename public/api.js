/*
 * Shared API client for the Influencer Detective extension.
 *
 * Loaded as a classic script (no modules) so it works in:
 *  - the background service worker (Chrome) via importScripts('api.js')
 *  - the background event page (Firefox) via background.scripts in the manifest
 *  - the popup via <script src="../api.js"></script>
 *
 * Exposes a single global: InfluencerAPI
 *
 * The AdonisJS API wraps every response payload under a top-level `data`
 * key. This client unwraps it automatically. Validation errors (HTTP 422)
 * are NOT wrapped and arrive as { errors: [...] }; they are exposed on the
 * thrown error's `body` property.
 */
(function () {
  const DEFAULT_API_BASE = 'http://localhost:3333';
  const storage = chrome.storage.local;

  async function getApiBase() {
    const { apiBase } = await storage.get('apiBase');
    if (apiBase && typeof apiBase === 'string') {
      return apiBase.replace(/\/+$/, '');
    }
    return DEFAULT_API_BASE;
  }

  async function setApiBase(value) {
    const clean = String(value || '')
      .trim()
      .replace(/\/+$/, '');
    await storage.set({ apiBase: clean || DEFAULT_API_BASE });
    return clean || DEFAULT_API_BASE;
  }

  async function request(path, options) {
    options = options || {};
    const base = await getApiBase();
    const res = await fetch(base + path, {
      method: options.method || 'GET',
      headers: Object.assign(
        { Accept: 'application/json', 'Content-Type': 'application/json' },
        options.headers || {},
      ),
      body: options.body || null,
    });

    const text = await res.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!res.ok) {
      const err = new Error('HTTP ' + res.status);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    // Unwrap the standard { data: ... } envelope.
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
      return body.data;
    }
    return body;
  }

  function lookupVideo(platform, externalId) {
    const q =
      'platform=' + encodeURIComponent(platform) + '&external_id=' + encodeURIComponent(externalId);
    return request('/posts/lookup?' + q);
  }

  function createPost(payload) {
    return request('/posts', { method: 'POST', body: JSON.stringify(payload) });
  }

  function createInfluencer(payload) {
    return request('/influencers', { method: 'POST', body: JSON.stringify(payload) });
  }

  function attachInfluencer(postId, influencerId) {
    return request('/posts/' + postId + '/influencers', {
      method: 'POST',
      body: JSON.stringify({ influencerIds: [influencerId] }),
    });
  }

  /**
   * Turn a thrown API error into a human-readable string, handling
   * Vine validation (422) errors which look like { errors: [{ message }] }.
   */
  function describeError(err) {
    if (!err) return 'Unknown error';
    const body = err.body;
    if (body && Array.isArray(body.errors) && body.errors.length) {
      return body.errors.map((e) => e.message || JSON.stringify(e)).join('; ');
    }
    if (body && typeof body === 'string') return body;
    return err.message || String(err);
  }

  globalThis.InfluencerAPI = {
    DEFAULT_API_BASE,
    getApiBase,
    setApiBase,
    lookupVideo,
    createPost,
    createInfluencer,
    attachInfluencer,
    describeError,
  };
})();
