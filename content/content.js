/*
 * Content script injected into YouTube and Bilibili video pages.
 *
 * Extracts the current video id and reports it to the background script,
 * which queries the API and updates the toolbar badge. YouTube and
 * Bilibili are single-page apps, so we re-check periodically and whenever
 * the URL changes to keep the detection in sync with SPA navigation.
 */

;(function () {
  function getVideoInfo() {
    let url
    try {
      url = new URL(location.href)
    } catch {
      return null
    }

    const host = url.hostname

    // ---- YouTube -------------------------------------------------------
    if (/(^|\.)youtube\.com$/.test(host) || host === 'youtu.be') {
      let externalId = null
      if (host === 'youtu.be') {
        externalId = url.pathname.replace(/^\/+/, '').split('/')[0] || null
      } else {
        externalId = url.searchParams.get('v')
        if (!externalId) {
          const m = url.pathname.match(/\/(?:shorts|embed|v)\/([\w-]+)/)
          if (m) externalId = m[1]
        }
      }
      if (!externalId) return null
      return { platform: 'youtube', externalId: externalId, externalUrl: location.href }
    }

    // ---- Bilibili ------------------------------------------------------
    if (/(^|\.)bilibili\.com$/.test(host)) {
      const m = url.pathname.match(/\/video\/(BV[\w]+|av\d+)/i)
      if (!m) return null
      return { platform: 'bilibili', externalId: m[1], externalUrl: location.href }
    }

    return null
  }

  let lastKey = ''
  function check() {
    const info = getVideoInfo()
    const key = info ? info.platform + ':' + info.externalId : ''
    if (key === lastKey) return
    lastKey = key
    try {
      chrome.runtime.sendMessage({ type: 'VIDEO_DETECTED', info: info })
    } catch {
      // extension context may be invalidated on reload; ignore
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_VIDEO_INFO') {
      sendResponse(getVideoInfo())
      return false
    }
    return false
  })

  check()
  setInterval(check, 1500)
})()
