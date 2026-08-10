/*
 * Popup UI logic.
 *
 * On open: asks the background for the current tab's cached lookup state.
 * If none is cached, asks the content script for the video info directly
 * and triggers a lookup. Renders either matched influencer(s) or a submit
 * form when nothing is found.
 */

const content = document.getElementById('content')

document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

// ---------- small DOM helpers ------------------------------------------------

function el(tag, attrs, children) {
  const node = document.createElement(tag)
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k]
      if (v == null) continue
      if (k === 'class') node.className = v
      else if (k === 'text') node.textContent = v
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v)
      } else {
        node.setAttribute(k, v)
      }
    }
  }
  append(node, children)
  return node
}

function append(parent, children) {
  if (children == null || children === '') return
  if (Array.isArray(children)) {
    children.forEach((c) => append(parent, c))
  } else if (typeof children === 'string' || typeof children === 'number') {
    parent.appendChild(document.createTextNode(String(children)))
  } else {
    parent.appendChild(children)
  }
}

function val(form, name) {
  const field = form.elements[name]
  return field ? field.value : ''
}

// ---------- formatting helpers ----------------------------------------------

function platformLabel(p) {
  if (p === 'youtube') return 'YouTube'
  if (p === 'bilibili') return 'Bilibili'
  return p
}

function displayName(name) {
  if (!name || typeof name !== 'object') return '(unnamed)'
  const preferred = ['en', 'zh', 'ja', 'ko']
  for (const l of preferred) {
    if (name[l]) return name[l]
  }
  const values = Object.values(name)
  return values.length ? values[0] : '(unnamed)'
}

function socialLink(platform, handle) {
  const h = String(handle).trim()
  if (!h) return null
  const strip = (s) => s.replace(/^@/, '')
  const map = {
    youtube: (s) => 'https://www.youtube.com/' + (s.startsWith('@') ? s : '@' + s),
    bilibili: (s) => 'https://space.bilibili.com/' + strip(s),
    twitter: (s) => 'https://twitter.com/' + strip(s),
    instagram: (s) => 'https://instagram.com/' + strip(s),
    tiktok: (s) => 'https://www.tiktok.com/@' + strip(s),
    douyin: (s) => 'https://www.douyin.com/user/' + strip(s),
  }
  const fn = map[platform]
  return fn ? fn(h) : null
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------- messaging --------------------------------------------------------

function send(msg) {
  return chrome.runtime.sendMessage(msg)
}

function getCurrentTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0])
}

function tryGetInfoFromTab(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: 'GET_VIDEO_INFO' }).catch(() => null)
}

// Mirror of the content-script detection, used as a fallback when the
// content script has not loaded yet (e.g. popup opened right after
// navigation). Keeps the popup self-sufficient for the initial lookup.
function parseVideoInfo(href) {
  let url
  try {
    url = new URL(href)
  } catch {
    return null
  }
  const host = url.hostname
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
    return { platform: 'youtube', externalId: externalId, externalUrl: href }
  }
  if (/(^|\.)bilibili\.com$/.test(host)) {
    const m = url.pathname.match(/\/video\/(BV[\w]+|av\d+)/i)
    if (!m) return null
    return { platform: 'bilibili', externalId: m[1], externalUrl: href }
  }
  return null
}

// ---------- rendering --------------------------------------------------------

function render(state, tab) {
  content.innerHTML = ''
  const info = state.info

  if (!info) {
    content.appendChild(
      el('div', { class: 'notice' },
        'Open a YouTube or Bilibili video page to detect influencer info.'
      )
    )
    return
  }

  content.appendChild(
    el('div', { class: 'page-info' }, [
      el('span', { class: 'badge' }, platformLabel(info.platform)),
      el('span', { class: 'vid', title: info.externalId }, info.externalId),
    ])
  )

  if (state.loading) {
    content.appendChild(el('div', { class: 'loading' }, 'Querying API…'))
    return
  }

  if (state.error) {
    content.appendChild(el('div', { class: 'error' }, 'Lookup error: ' + state.error))
    const retry = el('button', { class: 'submit' }, 'Retry')
    retry.addEventListener('click', () => init())
    content.appendChild(retry)
    return
  }

  const result = state.result
  if (
    result &&
    Array.isArray(result.influencers) &&
    result.influencers.length > 0
  ) {
    content.appendChild(el('h2', {}, 'Matched influencers'))
    const list = el('div', { class: 'influencer-list' })
    for (const inf of result.influencers) list.appendChild(renderInfluencer(inf))
    content.appendChild(list)
    return
  }

  const reason =
    result && result.status === 'no_influencer'
      ? 'This video is known but has no influencer yet. Submit one below.'
      : 'No matching influencer found for this video.'
  content.appendChild(el('div', { class: 'notice' }, reason))
  content.appendChild(renderSubmitForm(info, result))
}

function renderInfluencer(inf) {
  const card = el('div', { class: 'influencer-card' })
  card.appendChild(el('div', { class: 'name' }, displayName(inf.name)))
  card.appendChild(el('div', { class: 'slug' }, '@' + inf.slug))

  const socials = el('div', { class: 'socials' })
  let any = false
  for (const p of ['youtube', 'bilibili', 'twitter', 'instagram', 'tiktok', 'douyin']) {
    if (inf[p]) {
      const href = socialLink(p, inf[p])
      socials.appendChild(
        el(
          'a',
          { href: href || '#', target: '_blank', rel: 'noopener noreferrer' },
          platformLabel(p)
        )
      )
      any = true
    }
  }
  if (inf.website) {
    socials.appendChild(
      el('a', { href: inf.website, target: '_blank', rel: 'noopener noreferrer' }, 'Website')
    )
    any = true
  }
  if (any) card.appendChild(socials)
  return card
}

function renderSubmitForm(info, result) {
  let slugEdited = false

  const handleField = (name, label) =>
    el('div', { class: 'field' }, [
      el('label', { for: name }, label),
      el('input', { name: name, id: name, placeholder: '@handle', autocomplete: 'off' }),
    ])

  const form = el('form', {}, [
    el('div', { class: 'field' }, [
      el('label', { for: 'slug' }, 'Slug'),
      el('input', { name: 'slug', id: 'slug', placeholder: 'unique-handle', autocomplete: 'off' }),
    ]),
    el('div', { class: 'row' }, [
      el('div', { class: 'field' }, [
        el('label', { for: 'name_en' }, 'Name (English) *'),
        el('input', { name: 'name_en', id: 'name_en', placeholder: 'Jane Doe', autocomplete: 'off' }),
      ]),
      el('div', { class: 'field' }, [
        el('label', { for: 'name_zh' }, 'Name (中文)'),
        el('input', { name: 'name_zh', id: 'name_zh', placeholder: '名字', autocomplete: 'off' }),
      ]),
    ]),
    el('div', { class: 'row' }, [handleField('youtube', 'YouTube'), handleField('bilibili', 'Bilibili')]),
    el('div', { class: 'row' }, [handleField('twitter', 'Twitter'), handleField('instagram', 'Instagram')]),
    el('div', { class: 'row' }, [handleField('tiktok', 'TikTok'), handleField('douyin', 'Douyin')]),
    el('div', { class: 'field' }, [
      el('label', { for: 'website' }, 'Website'),
      el('input', { name: 'website', id: 'website', type: 'url', placeholder: 'https://', autocomplete: 'off' }),
    ]),
    el('div', { class: 'error form-error', style: 'display:none' }),
    el('button', { class: 'submit', type: 'submit' }, 'Submit'),
    el(
      'div',
      { class: 'hint' },
      'Creates a post for this video and the influencer, then links them. If the video post already exists, the influencer is attached to it.'
    ),
  ])

  const slugInput = form.querySelector('#slug')
  const nameEnInput = form.querySelector('#name_en')
  slugInput.addEventListener('input', () => {
    slugEdited = true
  })
  nameEnInput.addEventListener('input', () => {
    if (!slugEdited) slugInput.value = slugify(nameEnInput.value)
  })

  form.addEventListener('submit', (e) => handleSubmit(e, info, result, form))
  return form
}

async function handleSubmit(e, info, result, form) {
  e.preventDefault()
  const submitBtn = form.querySelector('button.submit')
  const errBox = form.querySelector('.form-error')
  errBox.textContent = ''
  errBox.style.display = 'none'

  const slug = val(form, 'slug').trim()
  const nameEn = val(form, 'name_en').trim()
  const nameZh = val(form, 'name_zh').trim()

  const fail = (msg) => {
    errBox.textContent = msg
    errBox.style.display = 'block'
    submitBtn.disabled = false
    submitBtn.textContent = 'Submit'
  }

  if (!slug) return fail('Slug is required.')
  if (!nameEn && !nameZh) return fail('At least one name is required.')

  submitBtn.disabled = true
  submitBtn.textContent = 'Submitting…'

  const name = {}
  if (nameEn) name.en = nameEn
  if (nameZh) name.zh = nameZh

  const influencerPayload = { slug: slug, name: name }
  for (const f of ['youtube', 'bilibili', 'twitter', 'instagram', 'tiktok', 'douyin']) {
    const v = val(form, f).trim()
    if (v) influencerPayload[f] = v
  }
  const website = val(form, 'website').trim()
  if (website) influencerPayload.website = website

  try {
    let postId
    if (result && result.status === 'no_influencer' && result.post) {
      postId = result.post.id
    } else {
      const post = await InfluencerAPI.createPost({
        platform: info.platform,
        type: 'video',
        externalUrl: info.externalUrl,
        externalId: info.externalId,
      })
      postId = post.id
    }

    const influencer = await InfluencerAPI.createInfluencer(influencerPayload)
    await InfluencerAPI.attachInfluencer(postId, influencer.id)

    const tab = await getCurrentTab()
    const state = await send({ type: 'LOOKUP', tabId: tab.id, info: info })
    render(state, tab)
    content.insertBefore(
      el('div', { class: 'success' }, 'Influencer submitted and linked to this video.'),
      content.firstChild
    )
  } catch (err) {
    fail(InfluencerAPI.describeError(err))
  }
}

// ---------- init / polling ---------------------------------------------------

async function init() {
  const tab = await getCurrentTab()
  if (!tab) {
    content.innerHTML = ''
    content.appendChild(el('div', { class: 'notice' }, 'No active tab.'))
    return
  }

  let state = await send({ type: 'GET_TAB_STATE', tabId: tab.id })

  if (!state.info && !state.loading) {
    // Prefer the content script's live reading; fall back to parsing the
    // tab URL directly so the popup works even before the content script
    // has had a chance to report.
    let info = await tryGetInfoFromTab(tab.id)
    if (!info && tab.url) info = parseVideoInfo(tab.url)
    if (info) {
      state = await send({ type: 'LOOKUP', tabId: tab.id, info: info })
    }
  }

  render(state, tab)
  if (state.loading) poll(tab.id)
}

function poll(tabId) {
  let attempts = 0
  const timer = setInterval(async () => {
    attempts++
    const state = await send({ type: 'GET_TAB_STATE', tabId: tabId })
    if (!state.loading || attempts > 25) {
      clearInterval(timer)
      const tab = await getCurrentTab()
      render(state, tab)
    }
  }, 400)
}

init()
