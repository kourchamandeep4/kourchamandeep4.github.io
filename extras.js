/* Extras for the Australian journey, loaded after app.js:
   1. Pick your trip: choose an interest and get an express route
   2. Ask the driver: a guide that answers from the content of this site
   3. Postcard: a downloadable card with the visitor's trip

   Everything runs in the browser. There is no server and no AI service. */
(function () {
  'use strict';
  const P = window.PROFILE, C = window.COASTER;
  if (!P || !C) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach(k => { if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k)); });
    return el;
  };
  const STAGES = C.STAGES;
  const idxOf = id => STAGES.findIndex(s => s.id === id);

  /* ---------------- trip stats, kept while the page is open ---------------- */
  const stats = { trips: 0, visited: new Set([0]), km: 0 };
  window.addEventListener('coaster:end', e => {
    const { from, to } = e.detail; stats.trips++; stats.visited.add(to);
    const a = Math.min(from, to), b = Math.max(from, to);
    for (let k = a; k < b; k++) stats.km += C.LEGS[k].km;
  });

  const chatBtn = h('button', { class: 'xbtn primary', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'chat', onclick: () => toggleChat() },
    h('span', { text: 'Ask the driver' }));
  document.body.append(h('div', { class: 'xrow' }, chatBtn));

  /* ---------------- 1. pick your trip ---------------- */
  const interests = P.interests || [];
  const matches = (text, kws) => kws.some(k => {
    k = k.toLowerCase();
    return k.length <= 3 && !k.includes(' ') ? new RegExp('\\b' + k.replace(/[^a-z0-9]/g, '') + '\\b').test(text) : text.includes(k);
  });
  const ticketBox = $('.tickets');
  const tickets = $$('.ticket');
  tickets.forEach((t, i) => {
    t.dataset.i = i;
    t.querySelector('.tbody').prepend(h('span', { class: 'fit', text: 'Fits your pick' }));
  });
  let picked = null;
  const note = h('p', { class: 'pick-note', 'aria-live': 'polite' });

  function applyPick(it) {
    picked = it;
    const kws = it ? it.keywords : [];
    tickets.forEach(t => {
      const hit = it ? matches(t.textContent.toLowerCase().replace('fits your pick', ''), kws) : false;
      t.classList.toggle('match', hit);
      t.classList.toggle('dim', !!it && !hit);
    });
    [...tickets].sort((a, b) => (b.classList.contains('match') - a.classList.contains('match')) || (a.dataset.i - b.dataset.i))
      .forEach(t => ticketBox.append(t));
    $$('.skill-col li').forEach(li => li.classList.toggle('hit', !!it && matches(li.textContent.toLowerCase(), kws)));
    C.setRoute(it ? it.route : null);
    const n = it ? tickets.filter(t => t.classList.contains('match')).length : 0;
    note.textContent = it
      ? 'Express trip set: ' + it.route.map(id => STAGES[idxOf(id)].nav).join(', ') + '. ' + n + ' of ' + tickets.length + ' projects fit. The Next arrow skips the other stops.'
      : 'Full trip: every stop, in order.';
    $$('.pick button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === (it ? it.id : 'all'))));
  }
  if (interests.length) {
    const chips = interests.map(it => h('button', { type: 'button', 'data-id': it.id, 'aria-pressed': 'false', text: it.label, onclick: () => applyPick(it) }));
    chips.push(h('button', { type: 'button', 'data-id': 'all', 'aria-pressed': 'true', text: 'Show me everything', onclick: () => applyPick(null) }));
    const box = h('div', { class: 'pick' }, h('p', { class: 'pick-q', text: 'What are you here for? Pick a trip and I will shorten the route.' }),
      h('div', { class: 'chips' }, chips), note);
    const cta = $('#station .cta');
    if (cta) cta.after(box);
    note.textContent = 'Full trip: every stop, in order.';
  }

  /* ---------------- 2. ask the driver ---------------- */
  const SYN = {
    hire: 'contact email', hiring: 'contact email', reach: 'contact email', email: 'contact email', mail: 'contact email', resume: 'cv', cv: 'cv contact',
    degree: 'bachelor studied', study: 'studied bachelor', studied: 'studied bachelor', school: 'bachelor', education: 'bachelor studied', uni: 'bachelor',
    work: 'experience', worked: 'experience', job: 'experience', jobs: 'experience', career: 'experience', company: 'experience', employer: 'experience',
    stack: 'skills', tech: 'skills', tools: 'skills', languages: 'skills', language: 'skills', good: 'skills',
    visa: 'working rights', move: 'relocation', relocate: 'relocation', where: 'based', live: 'based', city: 'based', location: 'based',
    available: 'status open', availability: 'status open', github: 'contact github', linkedin: 'contact linkedin',
    ai: 'ai genai llm', ml: 'ai llm', llm: 'llm genai', chatbot: 'llm ai', dashboards: 'dashboard', dashboard: 'dashboard powerbi', bi: 'dashboard power bi'
  };
  const STOP = new Set('a an the and or of to in on at for with is are was were be been do does did you your she her he his him they what which who whom how can could would should have has had about tell me show any some there this that it its i my we our from by as if than then so'.split(' '));
  const stem = w => w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
  const tok = txt => (txt.toLowerCase().replace(/power\s*bi/g, 'powerbi').replace(/text-to-sql/g, 'texttosql').match(/[a-z0-9+#]+/g) || []).filter(w => !STOP.has(w)).map(stem);

  const KB = [];
  const add = (title, text, answer, go) => KB.push({ title, tokens: new Set(tok(title + ' ' + text)), titleTokens: new Set(tok(title)), answer, go });
  (P.projects || []).forEach(p => add(p.title, [p.blurb, p.result, (p.tools || []).join(' ')].join(' ') + ' project built',
    p.title + '. ' + (p.result || p.blurb) + (p.tools && p.tools.length ? ' Built with ' + p.tools.join(', ') + '.' : ''), 'projects'));
  (P.experience || []).forEach(e => add(e.role + ' ' + e.org, [e.when, e.where, ...(e.points || [])].join(' ') + ' experience work job',
    e.role + ' at ' + e.org + ' (' + e.when + (e.where ? ', ' + e.where : '') + '). ' + (e.points || [])[0], 'experience'));
  (P.skills || []).forEach(g => {
    const strong = g.items.filter(i => i.level >= 4).map(i => i.name), rest = g.items.filter(i => i.level < 4).map(i => i.name);
    add(g.group, g.items.map(i => i.name).join(' ') + ' skills tools stack',
      g.group + ': strongest in ' + strong.join(', ') + (rest.length ? '; working knowledge of ' + rest.join(', ') : '') + '.', 'skills');
  });
  ((P.about && P.about.paragraphs) || []).forEach((t, i) => add('About ' + i, t + ' about background', t, 'about'));
  ((P.about && P.about.facts) || []).forEach(([k, v]) => add(k, v + ' ' + k, k + ': ' + v + '.', 'about'));
  (P.credentials || []).forEach(c => add(c.title, [c.issuer, c.year].join(' ') + ' credential certificate degree education',
    c.title + ' (' + c.issuer + ', ' + c.year + ').', 'credentials'));
  (P.stats || []).forEach(s => add(s.label, s.value + ' ' + s.label + ' numbers impact', s.value + ' ' + s.label + '.', 'credentials'));
  const L = P.links || {};
  add('Contact', 'contact email hire hiring reach linkedin github cv resume get in touch relocation open',
    'You can reach ' + P.name + ' at ' + (L.email || 'the email on the Contact stop') + '. LinkedIn and GitHub links are on the Contact stop too.' + (P.status ? ' Status: ' + P.status + '.' : ''), 'contact');
  add('Status', (P.status || '') + ' available open relocation status ' + (P.location || ''), (P.status ? P.status + '. ' : '') + P.name + ' is based in ' + (P.location || 'Australia') + '.', 'station');

  const df = new Map();
  KB.forEach(e => e.tokens.forEach(t => df.set(t, (df.get(t) || 0) + 1)));
  const idf = t => Math.log(1 + KB.length / (df.get(t) || 0.5));

  function answer(q) {
    let qt = tok(q);
    qt.forEach(t => { if (SYN[t]) qt = qt.concat(tok(SYN[t]).map(x => x)); });
    qt = [...new Set(qt)];
    const scored = KB.map(e => {
      let s = 0;
      qt.forEach(t => { if (e.tokens.has(t)) s += idf(t) * (e.titleTokens.has(t) ? 1.6 : 1); });
      return { e, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    if (!scored.length || scored[0].s < 1.3) return null;
    const top = scored[0].s;
    const out = [];
    scored.slice(0, 3).forEach((x, i) => { if (i === 0 || x.s >= top * 0.72) out.push(x.e); });
    return out.slice(0, 2);
  }

  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' });
  const input = h('input', { type: 'text', placeholder: 'Ask about projects, skills, work...', 'aria-label': 'Your question', autocomplete: 'off' });
  const chips2 = ['What has she built with SQL?', 'Any AI projects?', 'Is she open to relocation?', 'How do I get in touch?'];
  const msg = (who, ...kids) => { const m = h('div', { class: 'msg ' + who }, ...kids); log.append(m); log.scrollTop = log.scrollHeight; return m; };
  function ask(q) {
    q = q.trim(); if (!q) return;
    msg('me', q);
    const res = answer(q);
    if (!res) {
      msg('bot', 'I only know what is on this site, and I could not match that. Try asking about projects, skills, experience, studies or contact details' + (L.email ? ', or email ' + L.email : '') + '.');
      return;
    }
    res.forEach(e => {
      const stop = STAGES[idxOf(e.go)];
      msg('bot', e.answer, h('button', { class: 'show', type: 'button', text: 'Show me: ' + stop.nav, onclick: () => { toggleChat(false); C.go(idxOf(e.go)); } }));
    });
  }
  const panel = h('section', { class: 'chat', id: 'chat', hidden: true, 'aria-label': 'Ask the driver' },
    h('header', null, h('b', { text: 'Ask the driver' }), h('button', { type: 'button', class: 'x', 'aria-label': 'Close chat', text: '×', onclick: () => toggleChat(false) })),
    log,
    h('div', { class: 'chips' }, chips2.map(c => h('button', { type: 'button', text: c, onclick: () => ask(c) }))),
    h('form', { onsubmit: e => { e.preventDefault(); ask(input.value); input.value = ''; } }, input, h('button', { type: 'submit', class: 'send', text: 'Ask' })),
    h('p', { class: 'chat-note', text: 'Answers come from this site\'s own content. This is a search, not an AI model.' }));
  document.body.append(panel);
  msg('bot', 'Hi, I am your driver for the trip. Ask me about projects, skills, experience or how to get in touch, and I will take you to the right stop.');

  function toggleChat(force) {
    const open = force === undefined ? panel.hidden : force;
    panel.hidden = !open;
    chatBtn.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else chatBtn.focus({ preventScroll: true });
  }
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') toggleChat(false); });

  /* ---------------- 3. postcard ---------------- */
  const who = h('input', { type: 'text', placeholder: 'Your name or company (optional)', maxlength: '40', 'aria-label': 'Name for the postcard' });
  const photoBtn = h('button', { class: 'btn primary', type: 'button', text: 'Download my postcard' });
  const photoBox = h('div', { class: 'photo' }, h('h3', { text: 'Take a souvenir' }),
    h('p', { text: 'Your postcard shows the stops you visited, the distance you covered and when you dropped by. It is made in your browser and goes nowhere.' }),
    h('div', { class: 'photo-row' }, who, photoBtn));
  const foot = $('#contact .foot-note');
  if (foot) foot.before(photoBox);

  async function makePhoto() {
    try { await document.fonts.load('48px "Bowlby One"'); await document.fonts.load('600 24px "Bricolage Grotesque"'); } catch (e) { /* fall back */ }
    const W = 1200, H = 800, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#f4e4c1'; g.fillRect(0, 0, W, H);
    // picture side (left): Melbourne at dusk
    const pw = 700, sky = g.createLinearGradient(0, 0, 0, 520); sky.addColorStop(0, '#0a1a2a'); sky.addColorStop(0.6, '#2a5a78'); sky.addColorStop(1, '#e58a52');
    g.fillStyle = sky; g.fillRect(30, 30, pw, 560);
    g.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { g.globalAlpha = 0.3 + (i % 4) * 0.15; g.fillRect(30 + (i * 137) % pw, 30 + (i * 53) % 300, 2, 2); }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,217,138,.85)'; g.beginPath(); g.arc(560, 440, 40, 0, 7); g.fill();
    g.fillStyle = '#16465e'; g.fillRect(30, 480, pw, 110);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 30; x <= 730; x += 20) g.lineTo(x, 500 + k * 22 + (x / 20 % 2 ? -4 : 4)); g.stroke(); }
    // Melbourne at dusk: skyline, Eureka Tower, Flinders Street Station
    g.fillStyle = '#183347';
    [[40, 60, 120], [110, 50, 90], [170, 44, 140], [560, 56, 110], [626, 48, 150], [684, 40, 96]].forEach(([x0, w, hh]) => g.fillRect(x0 + 0, 480 - hh, w, hh));
    g.fillStyle = '#ffd24a'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.4; g.fillRect(48 + (i * 37) % 680, 360 + (i * 23) % 110, 5, 6); } g.globalAlpha = 1;
    g.fillStyle = '#2c5f86'; g.fillRect(400, 270, 46, 210); g.fillStyle = '#e6b93a'; g.fillRect(400, 270, 46, 30); g.fillRect(412, 250, 22, 20);
    g.fillStyle = '#d9382f'; g.fillRect(400, 330, 46, 6); g.fillRect(400, 400, 46, 6); g.strokeStyle = '#c3ccd3'; g.lineWidth = 3; g.beginPath(); g.moveTo(423, 250); g.lineTo(423, 220); g.stroke();
    g.fillStyle = '#c98f3f'; g.fillRect(230, 400, 150, 80); g.fillStyle = '#7fc4b5'; g.beginPath(); g.arc(305, 392, 26, Math.PI, 0); g.fill();
    g.fillStyle = '#c98f3f'; g.fillRect(285, 392, 40, 40); g.fillStyle = '#fff3dc'; g.beginPath(); g.arc(305, 418, 10, 0, 7); g.fill();
    g.fillStyle = '#7a5424'; for (let i = 0; i < 6; i++) g.fillRect(240 + i * 24, 440, 12, 40);
    // stamp
    g.save(); g.translate(1040, 120); g.rotate(0.08); g.strokeStyle = '#b5482e'; g.lineWidth = 5; g.strokeRect(-70, -80, 140, 160);
    g.fillStyle = '#b5482e'; g.font = '700 22px "Bricolage Grotesque", system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('AUSTRALIA', 0, -40); g.font = '400 54px "Bowlby One", "Arial Black", sans-serif'; g.fillText(String(stats.visited.size), 0, 22); g.font = '600 20px "Bricolage Grotesque", system-ui, sans-serif'; g.fillText('stops visited', 0, 56); g.restore();
    // message side (right)
    g.textAlign = 'left'; g.fillStyle = '#0c1c2b'; g.font = '48px "Bowlby One", "Arial Black", sans-serif';
    const vis = who.value.trim() || 'A visitor';
    const words = ('Greetings from ' + vis).split(' '); let line = '', y = 250;
    g.font = '40px "Bowlby One", "Arial Black", sans-serif';
    words.forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > 380 && line) { g.fillText(line, 770, y); line = w; y += 48; } else line = t; });
    g.fillText(line, 770, y);
    g.font = '500 22px "Bricolage Grotesque", system-ui, sans-serif'; g.fillStyle = '#2a4a5e';
    const lines = ['Rode the ' + P.name + ' trip,', 'Geelong to Flinders Street, Melbourne,', stats.km + ' km by bus, train,', 'taxi, ferry, tram and bike.', '', new Date().toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })];
    lines.forEach((t, i) => g.fillText(t, 770, y + 52 + i * 32));
    g.strokeStyle = '#8c7a55'; g.lineWidth = 2; g.beginPath(); g.moveTo(745, 140); g.lineTo(745, 590); g.stroke();
    g.fillStyle = '#b5482e'; g.font = '700 26px "Bricolage Grotesque", system-ui, sans-serif';
    g.fillText(P.name + ', ' + (P.role || ''), 40, 660);
    g.fillStyle = '#2a4a5e'; g.font = '500 22px "Bricolage Grotesque", system-ui, sans-serif';
    g.fillText([P.location, (P.links || {}).email].filter(Boolean).join('   |   '), 40, 700);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }
  photoBtn.addEventListener('click', async () => {
    photoBtn.disabled = true; photoBtn.textContent = 'Posting it...';
    try {
      const blob = await makePhoto();
      const a = h('a', { href: URL.createObjectURL(blob), download: 'postcard-from-australia.png' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      photoBtn.textContent = 'Saved. Thanks for visiting!';
    } catch (e) { photoBtn.textContent = 'Could not make the postcard'; }
    setTimeout(() => { photoBtn.disabled = false; photoBtn.textContent = 'Download my postcard'; }, 2500);
  });
})();
