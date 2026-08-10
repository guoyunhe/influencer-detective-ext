/*
 * Background context for the Influencer Detective extension.
 *
 * Cross-browser note:
 *  - Chrome MV3 runs this file as a service worker; `importScripts` is
 *    available, so we load the shared API client that way.
 *  - Firefox MV3 runs this file as an event page (the manifest lists
 *    `["api.js", "background.js"]` under background.scripts), so the
 *    `InfluencerAPI` global already exists by the time this runs.
 *
 * Responsibilities:
 *  - Receive video-id detections from the content script.
 *  - Query the API and cache the result per tab.
 *  - Update the toolbar badge (green count = matched, ? = no match,
 *    ! = error, … = loading).
 *  - Answer popup requests for the current tab's state and trigger
 *    manual lookups / refreshes.
 */

if (typeof importScripts === 'function') {
  importScripts('api.js')
}

/** tabId -> { info, result, loading, error } */
const tabState = new Map()

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Popup asks for the cached state of a tab.
  if (msg.type === 'GET_TAB_STATE') {
    sendResponse(normalize(msg.tabId))
    return false
  }

  // Popup asks to run / re-run a lookup for a tab (used on open and after
  // a successful submit).
  if (msg.type === 'LOOKUP') {
    handleVideoDetected(msg.tabId, msg.info).then(() => {
      sendResponse(normalize(msg.tabId))
    })
    return true // async response
  }

  // Content script reports a (possibly null) video detection.
  if (msg.type === 'VIDEO_DETECTED') {
    const tabId = sender.tab && sender.tab.id
    if (tabId) handleVideoDetected(tabId, msg.info)
    return false
  }

  return false
})

chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId)
})

function normalize(tabId) {
  return (
    tabState.get(tabId) || { info: null, result: null, loading: false, error: null }
  )
}

async function handleVideoDetected(tabId, info) {
  if (!tabId) return

  if (!info) {
    tabState.set(tabId, { info: null, result: null, loading: false, error: null })
    setBadge(tabId, '', null)
    return
  }

  tabState.set(tabId, { info, result: null, loading: true, error: null })
  setBadge(tabId, '…', '#9aa0a6')

  try {
    const result = await InfluencerAPI.lookupVideo(info.platform, info.externalId)
    tabState.set(tabId, { info, result, loading: false, error: null })

    console.log('lookup result', { tabId, info, result })

    if (
      result &&
      Array.isArray(result.influencers) &&
      result.influencers.length > 0
    ) {
      setBadge(tabId, '✔', '#1e8e3e')
    } else {
      // no_post or no_influencer → user may submit info
      setBadge(tabId, '?', '#f9ab00')
    }
  } catch (err) {
    tabState.set(tabId, {
      info,
      result: null,
      loading: false,
      error: (err && err.message) || String(err),
    })
    setBadge(tabId, '!', '#d93025')
  }
}

function setBadge(tabId, text, color) {
  try {
    chrome.action.setBadgeText({ text: text, tabId: tabId })
    if (color) {
      chrome.action.setBadgeBackgroundColor({ color: color, tabId: tabId })
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: tabId })
    }
  } catch {
    /* action API unavailable in some contexts */
  }
}
