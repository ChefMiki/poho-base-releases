// PoHo Base website motion. Content is visible without this file; it only adds the choreography.
;(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  /* Nav gets a sheet once the page moves. */
  const nav = $('#nav')
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 12)
    // The hero window straightens as you scroll toward it.
    const p = Math.min(1, window.scrollY / 520)
    $('#hero-window').style.setProperty('--tilt', reduce ? 0 : (18 * (1 - p)).toFixed(2))
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  /* Count numbers up when they come into view. */
  const countUp = (el) => {
    if (el.dataset.done) return
    el.dataset.done = '1'
    const to = parseFloat(el.dataset.count)
    const dec = Number(el.dataset.dec || 0)
    const pre = el.dataset.prefix || ''
    const suf = el.dataset.suffix || ''
    const fmt = (v) => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf
    if (reduce) return (el.textContent = fmt(to))
    const start = performance.now()
    const dur = 1400
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      el.textContent = fmt(to * (1 - Math.pow(1 - t, 4)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* Reveal sections once, when they come into view. A plain scroll check: works everywhere. */
  const pending = new Set($$('.reveal, .section-head, .problem-title, .noai-copy, .noai-demo, .close, .private'))
  const checkReveals = () => {
    const h = window.innerHeight
    for (const el of pending) {
      const r = el.getBoundingClientRect()
      if (r.top < h * 0.88 && r.bottom > 0) {
        el.classList.add('in')
        $$('[data-count]', el).forEach(countUp)
        pending.delete(el)
      }
    }
  }
  window.addEventListener('scroll', checkReveals, { passive: true })
  window.addEventListener('resize', checkReveals)
  checkReveals()
  $$('.bars i').forEach((b, i) => b.style.setProperty('--n', i))

  /* A year of sample activity: quiet early, busier lately, weekends lighter. */
  const heat = $('#heat')
  if (heat) {
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const cells = []
    for (let w = 0; w < 53; w++) {
      for (let d = 0; d < 7; d++) {
        const trend = 0.25 + (w / 52) * 0.75
        const weekend = d >= 5 ? 0.45 : 1
        const v = rand() * trend * weekend
        const lvl = v < 0.18 ? 0 : v < 0.34 ? 1 : v < 0.5 ? 2 : v < 0.66 ? 3 : 4
        cells.push(`<i class="l${lvl}" style="--d:${Math.min(80, w + d)}"></i>`)
      }
    }
    heat.innerHTML = cells.join('')
  }

  /* The hero demo: projects assemble, the resume card writes itself, the cursor presses Continue. */
  const win = $('#hero-window')
  const typed = $('#demo-typed')
  const cursor = $('#demo-cursor')
  const toast = $('#demo-toast')
  const cont = $('#demo-continue')
  const text = 'Your last Claude Code session, Tuesday, was “Quick capture shortcuts”. You last asked: “make Ctrl+Shift+N open a new note from anywhere”.'
  const offsetIn = (el) => {
    let x = 0
    let y = 0
    while (el && el !== win) {
      x += el.offsetLeft
      y += el.offsetTop
      el = el.offsetParent
    }
    return { x, y }
  }
  let heroVisible = true
  new IntersectionObserver((e) => (heroVisible = e[0].isIntersecting), { threshold: 0.1 }).observe(win)

  const typeOut = async () => {
    typed.textContent = ''
    for (let i = 0; i <= text.length; i++) {
      typed.textContent = text.slice(0, i)
      await wait(text[i - 1] === ' ' ? 18 : 24)
    }
  }

  const loop = async () => {
    if (reduce) {
      typed.textContent = text
      win.classList.add('typed-done')
      return
    }
    await wait(900)
    for (;;) {
      while (!heroVisible) await wait(400)
      win.classList.add('scatter')
      win.classList.remove('typed-done')
      toast.classList.remove('show')
      cont.classList.remove('pressed')
      typed.textContent = ''
      cursor.style.setProperty('--cx', `${win.offsetWidth * 0.82}px`)
      cursor.style.setProperty('--cy', `${win.offsetHeight + 40}px`)
      await wait(700)
      win.classList.remove('scatter')
      await wait(900)
      await typeOut()
      win.classList.add('typed-done')
      await wait(500)
      const b = offsetIn(cont)
      cursor.style.setProperty('--cx', `${b.x + cont.offsetWidth * 0.55}px`)
      cursor.style.setProperty('--cy', `${b.y + cont.offsetHeight * 0.5}px`)
      await wait(1200)
      cont.classList.add('pressed')
      await wait(160)
      cont.classList.remove('pressed')
      toast.classList.add('show')
      await wait(2600)
      toast.classList.remove('show')
      cursor.style.setProperty('--cx', `${win.offsetWidth * 0.82}px`)
      cursor.style.setProperty('--cy', `${win.offsetHeight + 40}px`)
      await wait(1400)
    }
  }
  loop()

  /* Acts: the sticky stage follows the paragraph you are reading. */
  const acts = $('.acts')
  const scanCount = $('#scan-count')
  const key = $('#enter-key')
  const reopened = $('.reopened')
  let scene = -1
  let keyTimer = null
  const setScene = (n) => {
    if (n === scene) return
    scene = n
    acts.dataset.scene = String(n)
    $$('.act').forEach((a) => a.classList.toggle('on', Number(a.dataset.act) === n))
    if (n === 0) {
      let c = 0
      const step = () => {
        scanCount.textContent = `${c} found`
        if (c++ < 6 && scene === 0) setTimeout(step, reduce ? 0 : 220)
      }
      step()
    }
    clearTimeout(keyTimer)
    reopened.classList.remove('show')
    key.classList.remove('down')
    if (n === 2) {
      const press = () => {
        key.classList.add('down')
        setTimeout(() => {
          key.classList.remove('down')
          reopened.classList.add('show')
        }, 160)
        keyTimer = setTimeout(() => {
          reopened.classList.remove('show')
          keyTimer = setTimeout(press, 900)
        }, 2600)
      }
      keyTimer = setTimeout(press, reduce ? 0 : 900)
    }
  }
  // The act whose middle is nearest the middle of the screen owns the stage.
  const actEls = $$('.act')
  const pickScene = () => {
    const mid = window.innerHeight / 2
    let best = 0
    let bestD = Infinity
    for (const a of actEls) {
      const r = a.getBoundingClientRect()
      const d = Math.abs(r.top + r.height / 2 - mid)
      if (d < bestD) {
        bestD = d
        best = Number(a.dataset.act)
      }
    }
    setScene(best)
  }
  window.addEventListener('scroll', pickScene, { passive: true })
  window.addEventListener('resize', pickScene)
  pickScene()

  /* The AI add-on switch: same facts, written two ways. */
  const toggle = $('#ai-toggle')
  const brief = $('#brief')
  toggle.addEventListener('change', () => brief.classList.toggle('ai', toggle.checked))
})()
