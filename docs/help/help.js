// PoHo Base Help: search over titles, summaries and text (search.json), and the menu on small screens.
;(function () {
  const q = document.getElementById('q')
  const box = document.getElementById('results')
  const root = q ? q.dataset.root || '' : ''
  let index = null
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  async function load() {
    if (index) return index
    try {
      index = await (await fetch(root + 'search.json')).json()
    } catch {
      index = []
    }
    return index
  }
  function score(item, words) {
    let s = 0
    for (const w of words) {
      if (item.t.toLowerCase().includes(w)) s += 5
      if (item.s.toLowerCase().includes(w)) s += 3
      if (item.x.toLowerCase().includes(w)) s += 1
      else if (!item.t.toLowerCase().includes(w) && !item.s.toLowerCase().includes(w)) return 0
    }
    return s
  }
  async function search() {
    const words = q.value.toLowerCase().split(/\s+/).filter((w) => w.length > 1)
    if (!words.length) {
      box.hidden = true
      return
    }
    const hits = (await load())
      .map((it) => ({ it, s: score(it, words) }))
      .filter((h) => h.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
    box.innerHTML = hits.length
      ? hits.map((h) => `<a href="${esc(root + h.it.u)}"><strong>${esc(h.it.t)}</strong><small>${esc(h.it.g)} · ${esc(h.it.s)}</small></a>`).join('')
      : `<p>Nothing found for “${esc(q.value)}”. Try other words, or browse the menu.</p>`
    box.hidden = false
  }
  if (q) {
    q.addEventListener('input', search)
    q.addEventListener('focus', search)
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        box.hidden = true
        q.blur()
      }
      if (e.key === 'Enter') {
        const first = box.querySelector('a')
        if (first) location.href = first.href
      }
    })
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search')) box.hidden = true
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== q) {
        e.preventDefault()
        q.focus()
      }
    })
  }
  const menu = document.getElementById('menu')
  const side = document.getElementById('side')
  if (menu && side) {
    menu.addEventListener('click', () => {
      const open = side.classList.toggle('open')
      menu.setAttribute('aria-expanded', String(open))
    })
  }
})()
