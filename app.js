/* Coaster portfolio engine.
   1. Builds every page from window.PROFILE (profile.js).
   2. Shows one page at a time. Next / Previous (buttons, arrow keys, swipe) moves between pages.
   3. Between pages, a full-screen roller coaster ride plays: a long train rides a big track
      from left to right (right to left when you go back), then the new page appears. */
(() => {
  'use strict';

  const P = window.PROFILE;
  if (!P) { document.body.textContent = 'profile.js did not load.'; return; }

  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- tiny DOM helpers ---------- */
  const h = (tag, props, ...kids) => {
    const n = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false || v === '') continue;
      if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };
  const sv = (tag, attrs = {}) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const ext = (href, text, cls) => h('a', {
    href, class: cls, text,
    target: /^https?:/.test(href) ? '_blank' : null,
    rel: /^https?:/.test(href) ? 'noopener noreferrer' : null
  });

  /* ---------- the pages, in ride order ---------- */
  const STAGES = [
    { id: 'station',     nav: 'Start',      place: 'Geelong',        sign: 'Stop 1: Geelong bus stop' },
    { id: 'about',       nav: 'About',      place: 'Geelong Station', sign: 'Stop 2: Geelong Station platform' },
    { id: 'skills',      nav: 'Skills',     place: 'On the V/Line',  sign: 'Stop 3: Aboard the train to Melbourne' },
    { id: 'projects',    nav: 'Projects',   place: 'Williamstown',   sign: 'Stop 4: Coffee break in Williamstown' },
    { id: 'credentials', nav: 'Awards',     place: 'Docklands',      sign: 'Stop 5: Off the ferry at Docklands' },
    { id: 'experience',  nav: 'Experience', place: 'Southbank',      sign: 'Stop 6: Southbank and the Eureka Tower' },
    { id: 'contact',     nav: 'Contact',    place: 'Melbourne',      sign: 'Final stop: Flinders Street, Melbourne' }
  ];

  /* ---------- page builders ---------- */
  const page = (idx, ...body) => {
    const s = STAGES[idx];
    return h('section', { class: 'page stage', id: s.id, tabindex: '-1', 'aria-labelledby': s.id + '-t' },
      h('div', { class: 'wrap' }, ...body));
  };
  const heading = (idx, title) => [
    h('p', { class: 'sign', text: STAGES[idx].sign }),
    h('h2', { id: STAGES[idx].id + '-t', text: title })
  ];

  function topbar() {
    const logo = (() => {
      const s = sv('svg', { viewBox: '0 0 32 32', 'aria-hidden': 'true' });
      s.append(
        sv('rect', { width: 32, height: 32, rx: 8, fill: '#ff4f6d' }),
        sv('path', { d: 'M4 24L14 8l4 12 4-8 6 12', fill: 'none', stroke: '#0d0c2b', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      );
      return s;
    })();
    return [
      h('a', { class: 'brand', href: '#station', 'aria-label': P.name + ', back to the start' }, logo, h('span', { text: P.name })),
      h('nav', { class: 'nav', 'aria-label': 'Stages' },
        STAGES.map(s => h('a', { href: '#' + s.id, 'data-nav': s.id, text: s.nav }))),
      h('div', { class: 'progress', id: 'progress' })
    ];
  }

  function secHero() {
    const L = P.links || {};
    const plaque = P.plaque || [
      ['Ride', 'The ' + P.name + ' Experience'],
      ['Duration', 'About 3 minutes'],
      ['Thrill level', '●●●●○'],
      ['Minimum height', 'Curiosity'],
      ['Riders', 'One at a time']
    ];
    return h('section', { class: 'page stage hero', id: 'station', tabindex: '-1', 'aria-label': 'Introduction' },
      h('div', { class: 'wrap hero-grid' },
        h('div', null,
          P.status ? h('span', { class: 'badge' }, h('i'), P.status) : null,
          h('h1', { text: P.name }),
          h('p', { class: 'role', text: [P.role, P.location].filter(Boolean).join(' in ') }),
          h('p', { class: 'tagline', text: P.tagline }),
          h('div', { class: 'cta' },
            h('a', { class: 'btn primary', href: '#about', text: 'Start the trip' }),
            h('a', { class: 'btn', href: '#projects', text: 'Jump to projects' }),
            L.cv ? ext(L.cv, 'Download CV', 'btn') : null)),
        h('aside', { class: 'plaque', 'aria-label': 'Trip details' },
          h('h3', { text: 'Trip details' }),
          h('dl', null, plaque.map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })))))));
  }

  function secAbout() {
    const a = P.about || {};
    return page(1, heading(1, a.title || 'About me'),
      h('div', { class: 'about-grid' },
        h('div', { class: 'prose' }, (a.paragraphs || []).map(t => h('p', { text: t }))),
        h('aside', { class: 'rider', 'aria-label': 'Traveller profile' },
          h('h3', { text: 'Traveller profile' }),
          h('dl', null, (a.facts || []).map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })))))));
  }

  const clicks = n => h('span', { class: 'clicks', role: 'img', 'aria-label': n + ' out of 5' },
    [1, 2, 3, 4, 5].map(i => h('i', { class: i <= n ? 'on' : '' })));

  function secSkills() {
    return page(2, heading(2, 'Skills and tools'),
      P.skillsNote ? h('p', { class: 'lede', text: P.skillsNote }) : null,
      h('div', { class: 'skill-grid' }, (P.skills || []).map(g =>
        h('div', { class: 'skill-col' },
          h('h3', { text: g.group }),
          h('ul', null, (g.items || []).map(it => h('li', null, h('span', { text: it.name }), it.level ? clicks(it.level) : null)))))));
  }

  function secProjects() {
    const list = P.projects || [];
    const tickets = h('div', { class: 'tickets' }, list.map((p, i) =>
      h('article', { class: 'ticket' },
        h('div', { class: 'stub', 'aria-hidden': 'true' }, h('span', { text: 'TICKET' }), h('b', { text: String(i + 1).padStart(2, '0') })),
        h('div', { class: 'tbody' },
          h('h3', { text: p.title }),
          h('p', { text: p.blurb }),
          p.result ? h('p', { class: 'result' }, h('b', { text: 'Result:' }), p.result) : null,
          p.tools && p.tools.length ? h('ul', { class: 'tags', 'aria-label': 'Tools used' }, p.tools.map(t => h('li', { text: t }))) : null,
          h('div', { class: 'links' },
            p.repo ? ext(p.repo, 'View repository', 'btn small') : null,
            p.demo ? ext(p.demo, 'Open live demo', 'btn small primary') : null)))));
    const live = (P.github && P.github.showLiveRepos && P.github.user)
      ? h('div', { class: 'live', id: 'live' }, h('h3', { text: 'Fresh off the build line' }), h('p', { text: 'Latest public repositories, loaded live from GitHub.' }), h('div', { class: 'repos', id: 'repos' }))
      : null;
    return page(3, heading(3, 'Projects'), tickets, live);
  }

  function secExperience() {
    return page(5, heading(5, P.experienceTitle || 'Experience and education'),
      h('div', { class: 'jobs' }, (P.experience || []).map(j =>
        h('article', { class: 'job' },
          h('p', { class: 'when' }, j.when || '', j.where ? h('small', { text: j.where }) : null),
          h('div', null,
            h('h3', null, j.role, j.org ? h('span', { text: ' at ' + j.org }) : null),
            h('ul', null, (j.points || []).map(t => h('li', { text: t }))))))));
  }

  function secCreds() {
    const stats = P.stats || [];
    const creds = P.credentials || [];
    return page(4, heading(4, P.credentialsTitle || 'Ride stats and awards'),
      stats.length ? h('div', { class: 'stats' }, stats.map(s => h('div', { class: 'stat' }, h('b', { text: s.value }), h('span', { text: s.label })))) : null,
      creds.length ? h('ul', { class: 'creds' }, creds.map(c => h('li', { class: 'cred' },
        h('div', null, h('b', { text: c.title }), h('span', { text: c.issuer || '' })),
        c.link ? ext(c.link, 'View ' + (c.year ? '(' + c.year + ')' : ''), '') : h('em', { text: c.year || '' })))) : null);
  }

  function secContact() {
    const L = P.links || {};
    const c = P.contact || {};
    const copy = h('button', { class: 'btn', type: 'button', text: 'Copy email' });
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(L.email); copy.textContent = 'Copied'; }
      catch (e) { window.prompt('Copy this email address:', L.email); }
      setTimeout(() => (copy.textContent = 'Copy email'), 1800);
    });
    return page(6, heading(6, c.title || 'Exit through the gift shop'),
      c.text ? h('p', { class: 'contact-text', text: c.text }) : null,
      L.email ? h('a', { class: 'mail', href: 'mailto:' + L.email, text: L.email }) : null,
      h('div', { class: 'souvenirs' },
        L.email ? copy : null,
        L.linkedin ? ext(L.linkedin, 'LinkedIn', 'btn') : null,
        L.github ? ext(L.github, 'GitHub', 'btn') : null,
        (L.other || []).map(o => ext(o.url, o.label, 'btn'))),
      h('p', { class: 'foot-note', text: 'Thanks for visiting. © ' + new Date().getFullYear() + ' ' + P.name }));
  }

  /* ---------- assemble ---------- */
  document.title = P.name + ' | ' + (P.role || 'Portfolio');
  const meta = $('meta[name="description"]');
  if (meta) meta.setAttribute('content', P.tagline || (P.name + ' portfolio'));
  $('#topbar').append(...topbar());
  const main = $('#main');
  main.append(secHero(), secAbout(), secSkills(), secProjects(), secCreds(), secExperience(), secContact());
  const pages = $$('.page', main);
  const LAST = pages.length - 1;

  /* ---------- optional: live GitHub repos ---------- */
  (async function liveRepos() {
    const box = $('#repos');
    if (!box) return;
    try {
      const r = await fetch('https://api.github.com/users/' + encodeURIComponent(P.github.user) + '/repos?per_page=60&sort=updated');
      if (!r.ok) throw new Error(r.status);
      const repos = (await r.json()).filter(x => !x.fork && !x.archived)
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 6);
      if (!repos.length) throw new Error('none');
      repos.forEach(x => box.append(h('a', { class: 'repo', href: x.html_url, target: '_blank', rel: 'noopener noreferrer' },
        h('b', { text: x.name }),
        h('span', { text: x.description || 'No description yet.' }),
        h('small', { text: [x.language, x.stargazers_count ? x.stargazers_count + ' stars' : ''].filter(Boolean).join('  |  ') }))));
    } catch (e) { const live = $('#live'); if (live) live.remove(); }
  })();

  /* =====================================================================
     THE JOURNEY
     A trip from a Geelong bus stop to Flinders Street in Melbourne. Each stop is a page.
     Between two pages a full-screen scene plays: the vehicle for that leg (bus, train,
     taxi, ferry, tram, bike) rides from one landmark to the next. The bar at the bottom
     is the route: one pin per stop, plus the Next and Previous arrows.
  ===================================================================== */
  const bar = $('#pager');
  const DH = 216, GYD = 168, PARK = 56, ROAD = '#2a3b4a';
  const COL = { sun: '#ffd24a', coral: '#ff7a45', sea: '#4fd6c8', gum: '#2f8a63', sand: '#f4e4c1', ink: '#0c1c2b' };

  const R = (x, y, w, hh, fill, ex) => sv('rect', Object.assign({ x, y, width: w, height: hh, fill }, ex));
  const PA = (d, fill, ex) => sv('path', Object.assign({ d, fill }, ex));
  const CI = (cx, cy, r, fill, ex) => sv('circle', Object.assign({ cx, cy, r, fill }, ex));
  const LN = (x1, y1, x2, y2, stroke, w, ex) => sv('line', Object.assign({ x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round' }, ex));
  const G = (attrs, ...kids) => { const g = sv('g', attrs || {}); kids.flat().forEach(k => k && g.append(k)); return g; };

  /* ---------- vehicles: nose points right (+x), wheels touch y = 0 ---------- */
  function wheel(g, cx, r, wheels) {
    const w = sv('g');
    w.append(CI(cx, -r, r, '#14202b', { stroke: '#cfd8df', 'stroke-width': 2 }), CI(cx, -r, 2.2, '#cfd8df'));
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; w.append(LN(cx - (r - 2) * Math.cos(a), -r - (r - 2) * Math.sin(a), cx + (r - 2) * Math.cos(a), -r + (r - 2) * Math.sin(a), '#cfd8df', 1.3)); }
    g.append(w); wheels.push({ g: w, cx, cy: -r });
  }
  const heads = (g, xs, y) => xs.forEach(x => g.append(CI(x, y, 4.2, '#ffe2c6')));

  function vBus() {
    const g = sv('g'), wheels = [];
    g.append(R(-66, -50, 132, 42, '#ff7a45', { rx: 9 }), R(-66, -24, 132, 5, '#fff3dc'), R(-66, -12, 132, 5, '#c4521e'));
    for (let i = 0; i < 5; i++) g.append(R(-58 + i * 20, -43, 17, 14, '#a9d8ee', { rx: 2 }));
    heads(g, [-49, -9, 31], -34);
    g.append(PA('M44 -44 L62 -44 Q66 -44 66 -39 L66 -28 L44 -28 Z', '#a9d8ee'), R(60, -22, 7, 5, COL.sun, { rx: 2 }), R(-30, -54, 26, 5, '#e65a22', { rx: 2 }));
    wheel(g, -40, 9, wheels); wheel(g, 40, 9, wheels);
    return { g, wheels };
  }
  function vTrain() {
    const g = sv('g'), wheels = [];
    // carriage
    g.append(R(-124, -50, 112, 42, '#2a9d8f', { rx: 6 }), R(-124, -24, 112, 5, COL.sun), R(-124, -13, 112, 5, '#1b6f66'));
    for (let i = 0; i < 5; i++) g.append(R(-116 + i * 21, -43, 17, 14, '#c9eef0', { rx: 2 }));
    heads(g, [-107, -65, -23], -34);
    g.append(R(-14, -30, 6, 4, '#555'));
    // locomotive with sloped nose
    g.append(PA('M-8 -52 L78 -52 Q96 -52 104 -30 L108 -8 L-8 -8 Z', '#e9f5f3'), PA('M-8 -52 L78 -52 Q96 -52 104 -30 L-8 -30 Z', '#2a9d8f'), R(-8, -24, 116, 5, COL.sun),
      PA('M72 -46 L90 -46 Q98 -44 101 -34 L72 -34 Z', '#c9eef0'), R(-2, -45, 18, 13, '#c9eef0', { rx: 2 }), R(24, -45, 18, 13, '#c9eef0', { rx: 2 }),
      CI(104, -16, 3.5, '#fff3b0'), R(-8, -58, 40, 6, '#1b6f66', { rx: 2 }));
    heads(g, [7, 33], -36);
    [-104, -80, 4, 28, 82].forEach(x => wheel(g, x, 7, wheels));
    return { g, wheels };
  }
  function vTram() {
    const g = sv('g'), wheels = [];
    g.append(LN(-30, -58, -10, -86, '#b9c4cc', 2.5), LN(-10, -86, 20, -86, '#b9c4cc', 2.5),
      R(-92, -56, 184, 48, '#f5f1ea', { rx: 14 }), R(-92, -56, 184, 14, '#d9382f', { rx: 10 }), R(-92, -18, 184, 8, '#d9382f'));
    for (let i = 0; i < 7; i++) g.append(R(-82 + i * 24, -41, 19, 17, '#9fd0ea', { rx: 3 }));
    heads(g, [-72, -24, 48], -31);
    g.append(PA('M70 -42 L88 -42 Q92 -42 92 -36 L92 -22 L70 -22 Z', '#9fd0ea'), CI(88, -14, 3, '#fff3b0'));
    [-62, -36, 36, 62].forEach(x => wheel(g, x, 6.5, wheels));
    return { g, wheels };
  }
  function vFerry() {
    const g = sv('g'), wheels = [];
    g.append(PA('M-92 -16 L90 -16 L78 5 L-80 5 Z', '#1f6f54'), R(-86, -12, 168, 4, COL.sand),
      R(-64, -46, 118, 30, COL.sand, { rx: 4 }), R(-40, -66, 70, 20, COL.sand, { rx: 4 }), R(-36, -72, 62, 6, '#1f6f54', { rx: 2 }),
      R(2, -88, 17, 18, COL.sun, { rx: 2 }), R(2, -90, 17, 4, '#14202b'), LN(-70, -16, -70, -26, '#14202b', 1.5), LN(60, -16, 60, -26, '#14202b', 1.5));
    for (let i = 0; i < 6; i++) g.append(R(-58 + i * 18, -40, 12, 11, '#2b6f8a', { rx: 2 }));
    for (let i = 0; i < 4; i++) g.append(R(-32 + i * 17, -62, 11, 9, '#2b6f8a', { rx: 2 }));
    heads(g, [-52, -16, 20], -45);
    g.append(PA('M-92 4 q-12 -3 -24 2 M-92 -2 q-16 -3 -30 3', 'none', { stroke: 'rgba(255,255,255,.65)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    return { g, wheels, y: 5, bob: true };
  }
  function vTaxi() {
    const g = sv('g'), wheels = [];
    g.append(PA('M-44 -14 L-44 -26 Q-44 -30 -38 -31 L-24 -33 L-14 -48 Q-12 -51 -8 -51 L22 -51 Q27 -51 30 -47 L38 -33 L50 -30 Q54 -29 54 -24 L54 -14 Z', '#ffd24a'),
      PA('M-11 -35 L-4 -46 L8 -46 L8 -35 Z M13 -35 L13 -46 L22 -46 L30 -35 Z', '#a9d8ee'), R(-9, -58, 22, 7, '#fff3b0', { rx: 2 }), R(-44, -22, 98, 3, '#14202b'),
      CI(51, -24, 2.8, '#fff3b0'), CI(-42, -25, 2.5, '#ff4d4d'));
    heads(g, [-1, 19], -41);
    wheel(g, -26, 9, wheels); wheel(g, 32, 9, wheels);
    return { g, wheels };
  }
  function vUte() {
    const g = sv('g'), wheels = [];
    g.append(R(-58, -46, 74, 4, '#14202b'), R(-52, -52, 62, 7, '#ff7a45', { rx: 3 }), PA('M-54 -50 Q-30 -62 10 -52', 'none'),
      PA('M-62 -14 L-62 -34 L-6 -34 L-6 -14 Z', '#c98a3d'), R(-62, -36, 58, 4, '#a76f2c'),
      PA('M-6 -14 L-6 -42 L10 -46 L30 -46 L40 -32 L56 -28 Q60 -27 60 -22 L60 -14 Z', '#e0a860'),
      PA('M12 -33 L14 -42 L28 -42 L35 -33 Z', '#a9d8ee'), CI(56, -22, 2.8, '#fff3b0'), R(-6, -22, 66, 3, '#14202b'));
    g.append(PA('M-56 -52 Q-12 -60 36 -53 Q-12 -50 -56 -52 Z', '#4fd6c8'));
    heads(g, [21], -38);
    wheel(g, -38, 9, wheels); wheel(g, 34, 9, wheels);
    return { g, wheels };
  }
  const LEGS = [
    { name: 'Bus', route: 'Geelong bus stop to Geelong Station', km: 3, speed: 50, build: vBus, surface: 'road' },
    { name: 'Train', route: 'Geelong to Footscray', km: 70, speed: 140, build: vTrain, surface: 'rail' },
    { name: 'Taxi', route: 'Footscray to Williamstown', km: 8, speed: 60, build: vTaxi, surface: 'road' },
    { name: 'Ferry', route: 'Williamstown to Docklands', km: 12, speed: 26, build: vFerry, surface: 'water' },
    { name: 'Tram', route: 'Docklands to Southbank', km: 3, speed: 35, build: vTram, surface: 'tram' },
    { name: 'Bike', route: 'Southbank to Flinders Street', km: 1, speed: 18, build: vBike, surface: 'road' }
  ];
  // landmark for each stop, drawn around x
  const LANDMARKS = [x => sBusStop(x), x => sGeelongStation(x), x => sCountry(x), x => sCafe(x), x => sDocklands(x), x => sEureka(x), x => sFlinders(x)];


  /* ---------- scenery ---------- */
  function gum(x, s) {
    return G({ transform: 'translate(' + x + ' ' + GYD + ') scale(' + (s || 1) + ')' },
      R(-3, -44, 6, 44, '#e8dcc0', { rx: 2 }), CI(-12, -50, 15, COL.gum), CI(10, -56, 17, '#37a073'), CI(0, -68, 14, '#2f8a63'));
  }
  function sBusStop(x) {
    return G(null, gum(x - 80, 1.1), gum(x + 76, 0.8),
      R(x - 3, GYD - 70, 5, 70, '#c3ccd3'), R(x - 18, GYD - 84, 36, 22, COL.coral, { rx: 5 }), CI(x, GYD - 73, 6, '#fff3dc'), R(x - 3.5, GYD - 76, 7, 6, COL.coral, { rx: 1 }),
      R(x - 62, GYD - 58, 52, 5, '#6c8aa0', { rx: 2 }), R(x - 60, GYD - 53, 3, 53, '#6c8aa0'), R(x - 14, GYD - 53, 3, 53, '#6c8aa0'),
      R(x - 56, GYD - 19, 40, 4, '#c98a3d', { rx: 1 }), R(x - 56, GYD - 15, 3, 15, '#7a5424'), R(x - 22, GYD - 15, 3, 15, '#7a5424'));
  }
  function sFlinders(x) {
    const g = G(null, R(x - 70, GYD - 52, 140, 52, '#b98338', { opacity: 0.95 }), R(x - 22, GYD - 86, 44, 36, '#c98f3f'),
      PA('M' + (x - 20) + ' ' + (GYD - 86) + ' A20 20 0 0 1 ' + (x + 20) + ' ' + (GYD - 86) + ' Z', '#7fc4b5'), LN(x, GYD - 106, x, GYD - 118, '#c3ccd3', 2), PA('M' + x + ' ' + (GYD - 118) + ' l10 3 l-10 3 Z', COL.coral),
      CI(x, GYD - 68, 9, '#fff3dc', { stroke: '#7a5424', 'stroke-width': 1.5 }), LN(x, GYD - 68, x, GYD - 74, '#14202b', 1.4), LN(x, GYD - 68, x + 4, GYD - 66, '#14202b', 1.4));
    for (let i = 0; i < 6; i++) g.append(R(x - 64 + i * 22, GYD - 38, 12, 38, '#7a5424', { rx: 6, opacity: 0.85 }));
    return g;
  }
  function sCountry(x) {
    const g = G(null);
    g.append(PA('M' + (x - 150) + ' ' + (GYD - 8) + ' Q' + (x - 60) + ' ' + (GYD - 56) + ' ' + (x + 10) + ' ' + (GYD - 14) + ' Q' + (x + 70) + ' ' + (GYD - 46) + ' ' + (x + 160) + ' ' + (GYD - 8) + ' Z', '#1d3d3a'),
      gum(x - 96, 0.95), gum(x + 100, 1.15), gum(x + 70, 0.7),
      R(x - 40, GYD - 66, 112, 5, '#6c8aa0', { rx: 2 }), R(x - 36, GYD - 61, 3, 61, '#6c8aa0'), R(x + 62, GYD - 61, 3, 61, '#6c8aa0'),
      R(x - 26, GYD - 82, 56, 16, '#2a9d8f', { rx: 3 }), R(x - 20, GYD - 78, 44, 8, '#e9f5f3', { rx: 2 }));
    // kangaroo crossing sign
    g.append(R(x - 108, GYD - 36, 3, 36, '#c3ccd3'), PA('M' + (x - 106) + ' ' + (GYD - 70) + ' l18 18 l-18 18 l-18 -18 Z', COL.sun, { stroke: '#14202b', 'stroke-width': 1.5 }),
      PA('M' + (x - 114) + ' ' + (GYD - 50) + ' q4 -12 12 -12 l6 -6 l2 5 l-3 3 q4 4 2 12 l-5 10 l-3 -4 l2 -7 l-6 2 l-4 8 l-3 -3 Z', '#14202b'));
    return g;
  }
  function sCafe(x) {
    const g = G(null), aw = [];
    g.append(R(x - 58, GYD - 70, 116, 70, '#26394a'), R(x - 62, GYD - 78, 124, 10, '#1a2a38', { rx: 2 }),
      R(x - 48, GYD - 42, 54, 30, '#ffd24a', { opacity: 0.55, rx: 3 }), R(x + 14, GYD - 46, 26, 46, '#12202c', { rx: 3 }), CI(x + 34, GYD - 22, 1.8, COL.sun));
    for (let i = 0; i < 8; i++) aw.push(PA('M' + (x - 64 + i * 16) + ' ' + (GYD - 66) + ' l16 0 l3 14 l-16 0 Z', i % 2 ? COL.sand : COL.coral));
    g.append(...aw);
    g.append(R(x - 24, GYD - 100, 48, 20, '#12202c', { rx: 6, stroke: COL.sun, 'stroke-width': 1.5 }),
      PA('M' + (x - 9) + ' ' + (GYD - 94) + ' h14 v8 q0 5 -7 5 q-7 0 -7 -5 Z', COL.sand), PA('M' + (x + 5) + ' ' + (GYD - 92) + ' q5 0 5 4 q0 4 -5 4', 'none', { stroke: COL.sand, 'stroke-width': 1.6 }));
    ['-6', '0', '6'].forEach((dx, i) => g.append(PA('M' + (x + +dx) + ' ' + (GYD - 104) + ' q-4 -6 0 -11 q4 -5 0 -10', 'none', { class: 'steam s' + i, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 1.6, 'stroke-linecap': 'round' })));
    g.append(R(x - 100, GYD - 34, 3, 34, '#c3ccd3'), R(x - 112, GYD - 40, 28, 7, '#6c8aa0', { rx: 2 }), gum(x + 100, 0.9));
    return g;
  }
  function sQuay(x) {
    const g = G(null);
    g.append(R(x - 76, GYD - 10, 130, 7, '#7a5424', { rx: 2 }));
    [-66, -30, 6, 42].forEach(dx => g.append(R(x + dx, GYD - 3, 5, 20, '#4a3418')));
    g.append(R(x - 54, GYD - 54, 58, 44, '#c98f3f'), R(x - 58, GYD - 62, 66, 8, '#a76f2c', { rx: 2 }), R(x - 44, GYD - 44, 14, 16, '#a9d8ee', { rx: 2 }), R(x - 20, GYD - 44, 14, 16, '#a9d8ee', { rx: 2 }),
      LN(x + 24, GYD - 10, x + 24, GYD - 70, '#c3ccd3', 2.5), PA('M' + (x + 24) + ' ' + (GYD - 70) + ' l22 6 l-22 6 Z', COL.coral), CI(x + 40, GYD - 14, 4, '#14202b'), CI(x + 40, GYD - 18, 3, '#14202b'));
    for (let i = 0; i < 3; i++) g.append(PA('M' + (x - 90 + i * 22) + ' ' + (GYD - 96 - i * 6) + ' q5 -5 10 0 q5 -5 10 0', 'none', { class: 'bird', stroke: '#e8dcc0', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
    return g;
  }
  function vBike() {
    const g = sv('g'), wheels = [];
    wheel(g, -22, 13, wheels); wheel(g, 24, 13, wheels);
    g.append(PA('M-22 -13 L-4 -13 L10 -34 L-8 -34 Z M-4 -13 L24 -13 L12 -34 M10 -34 L16 -38', 'none', { stroke: '#ff7a45', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
      LN(-10, -37, 0, -37, '#14202b', 4), LN(14, -38, 22, -34, '#14202b', 3),
      LN(-3, -36, -3, -52, '#2a9d8f', 6), LN(-3, -50, 14, -38, '#ffe2c6', 4), LN(-4, -36, 6, -22, '#26394a', 5), LN(6, -22, 2, -14, '#26394a', 5), CI(0, -61, 6, '#ffe2c6'), PA('M-6 -62 q6 -9 12 0 Z', '#ffd24a'));
    return { g, wheels, bike: true };
  }
  function sGeelongStation(x) {
    return G(null, gum(x + 90, 0.8),
      R(x - 66, GYD - 46, 132, 46, '#a4523a'), PA('M' + (x - 72) + ' ' + (GYD - 46) + ' L' + x + ' ' + (GYD - 66) + ' L' + (x + 72) + ' ' + (GYD - 46) + ' Z', '#6b2f22'),
      R(x - 14, GYD - 100, 28, 40, '#b8664a'), PA('M' + (x - 18) + ' ' + (GYD - 100) + ' L' + x + ' ' + (GYD - 120) + ' L' + (x + 18) + ' ' + (GYD - 100) + ' Z', '#6b2f22'),
      CI(x, GYD - 84, 8, '#fff3dc', { stroke: '#3a1a12', 'stroke-width': 1.5 }), LN(x, GYD - 84, x, GYD - 89, '#14202b', 1.4), LN(x, GYD - 84, x + 3, GYD - 82, '#14202b', 1.4),
      R(x - 56, GYD - 34, 14, 22, '#f4e4c1', { rx: 6 }), R(x - 30, GYD - 34, 14, 22, '#f4e4c1', { rx: 6 }), R(x + 16, GYD - 34, 14, 22, '#f4e4c1', { rx: 6 }), R(x + 42, GYD - 34, 14, 22, '#f4e4c1', { rx: 6 }),
      R(x - 80, GYD - 62, 160, 5, '#6c8aa0', { rx: 2 }), R(x - 78, GYD - 57, 3, 57, '#6c8aa0'), R(x + 75, GYD - 57, 3, 57, '#6c8aa0'));
  }
  function sDocklands(x) {
    const g = G(null);
    // observation wheel behind the wharf
    g.append(CI(x + 40, GYD - 74, 46, 'none', { stroke: '#cfe3ee', 'stroke-width': 3, opacity: 0.85 }), CI(x + 40, GYD - 74, 5, '#cfe3ee'));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.append(LN(x + 40, GYD - 74, x + 40 + 46 * Math.cos(a), GYD - 74 + 46 * Math.sin(a), '#9fbccb', 1.2), R(x + 40 + 46 * Math.cos(a) - 3, GYD - 74 + 46 * Math.sin(a) - 3, 6, 6, COL.coral, { rx: 2 })); }
    g.append(LN(x + 40, GYD - 74, x + 22, GYD, '#9fbccb', 3), LN(x + 40, GYD - 74, x + 58, GYD, '#9fbccb', 3));
    g.append(R(x - 76, GYD - 10, 110, 7, '#7a5424', { rx: 2 }));
    [-66, -30, 6].forEach(dx => g.append(R(x + dx, GYD - 3, 5, 20, '#4a3418')));
    g.append(R(x - 60, GYD - 44, 48, 34, '#2f4f68'), R(x - 52, GYD - 36, 12, 14, '#a9d8ee', { rx: 2 }), R(x - 32, GYD - 36, 12, 14, '#a9d8ee', { rx: 2 }), R(x - 64, GYD - 50, 56, 6, '#1d3547', { rx: 2 }),
      LN(x - 4, GYD - 10, x - 4, GYD - 62, '#c3ccd3', 2.5), PA('M' + (x - 4) + ' ' + (GYD - 62) + ' l20 6 l-20 6 Z', COL.coral));
    return g;
  }
  function sEureka(x) {
    const g = G(null);
    g.append(R(x - 70, GYD - 46, 34, 46, '#2f4f68'), R(x + 40, GYD - 58, 40, 58, '#27425a'));
    for (let i = 0; i < 4; i++) { g.append(R(x - 64, GYD - 40 + i * 10, 6, 4, COL.sun, { opacity: 0.7 }), R(x - 52, GYD - 40 + i * 10, 6, 4, COL.sun, { opacity: 0.5 }), R(x + 48, GYD - 52 + i * 12, 6, 5, COL.sun, { opacity: 0.6 }), R(x + 62, GYD - 52 + i * 12, 6, 5, COL.sun, { opacity: 0.4 })); }
    g.append(R(x - 18, GYD - 140, 36, 140, '#2c5f86'), R(x - 18, GYD - 140, 36, 22, '#e6b93a'), R(x - 18, GYD - 106, 36, 5, '#d9382f'), R(x - 18, GYD - 70, 36, 5, '#d9382f'), R(x - 6, GYD - 156, 12, 16, '#e6b93a'), LN(x, GYD - 156, x, GYD - 170, '#c3ccd3', 2));
    for (let i = 0; i < 9; i++) g.append(R(x - 12, GYD - 128 + i * 12, 4, 6, '#a9d8ee', { opacity: 0.6 }), R(x - 2, GYD - 128 + i * 12, 4, 6, '#a9d8ee', { opacity: 0.6 }), R(x + 8, GYD - 128 + i * 12, 4, 6, '#a9d8ee', { opacity: 0.6 }));
    g.append(R(x - 100, GYD - 8, 200, 8, '#7a5424', { rx: 2 }));
    return g;
  }
  function stars(totalW) {
    const g = G(null);
    for (let i = 0; i < 110; i++) g.append(R(((i * 211) % 997) / 997 * totalW, ((i * 67) % 83) / 83 * (GYD - 40), i % 5 ? 1.2 : 2, i % 5 ? 1.2 : 2, '#fff', { opacity: 0.25 + (i % 4) * 0.15 }));
    return g;
  }
  function southernCrossStars(x) {
    const g = G({ class: 'sx' }); const P2 = [[0, -8], [0, 20], [-14, 6], [14, 0], [5, 8]];
    P2.forEach(([dx, dy], i) => { g.append(PA('M' + (x + dx) + ' ' + (24 + dy - 5) + ' l1.6 3.8 l4 .3 l-3 2.7 l1 4 l-3.6 -2.2 l-3.6 2.2 l1 -4 l-3 -2.7 l4 -.3 Z', i === 4 ? '#bcd5e8' : '#fff3c4')); });
    return g;
  }

  /* ---------- the bottom bar: a simple route line, one pin per stop ---------- */
  let cur = 0, busy = false, pending = null, streak = 0, lastGo = 0, route = null;
  let BX = null;

  const arrow = dir => {
    const s = sv('svg', { viewBox: '0 0 24 24', class: 'arrow', 'aria-hidden': 'true' });
    s.append(sv('path', { d: dir > 0 ? 'M4 12h15M13 5.5l6.5 6.5-6.5 6.5' : 'M20 12H5M11 5.5L4.5 12 11 18.5', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    return s;
  };
  const routeSvg = sv('svg', { class: 'track-svg', 'aria-hidden': 'true', focusable: 'false' });
  const stBtns = STAGES.map((s, i) => h('button', { class: 'st', type: 'button', 'aria-label': 'Travel to ' + s.nav + ', ' + s.place, onclick: () => go(i) },
    h('span', null, h('b', { text: s.nav }), h('i', { text: s.place }))));
  const prevBtn = h('button', { class: 'pbtn prev', type: 'button', 'aria-label': 'Previous stop', onclick: () => go(step(-1)) }, arrow(-1));
  const nextBtn = h('button', { class: 'pbtn next', type: 'button', onclick: () => go(step(1) <= LAST ? step(1) : 0) }, arrow(1));
  const hud = h('div', { class: 'hud', 'aria-hidden': 'true' },
    h('div', { class: 'wide' }, h('small', { id: 'hMode', text: 'Bus' }), h('b', { id: 'hRoute', text: '' })),
    h('div', null, h('small', { text: 'Distance' }), h('b', { id: 'hKm', text: '' })),
    h('div', null, h('small', { text: 'Speed' }), h('b', { id: 'hSpd', text: '0 km/h' })));
  bar.append(routeSvg, ...stBtns, prevBtn, nextBtn);
  document.body.append(hud);

  function layoutBar() {
    const W = bar.clientWidth, H = bar.clientHeight;
    if (!W || !H) return;
    const padX = W < 640 ? 62 : 110, y = H * 0.36;
    const xs = STAGES.map((_, i) => padX + i * (W - 2 * padX) / LAST);
    routeSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    routeSvg.replaceChildren();
    const prog = LN(xs[0], y, xs[0], y, COL.sun, 4, { id: 'prog' });
    const pins = xs.map(x => G({ class: 'pin' }, CI(x, y, 7, 'currentColor', { stroke: '#0b1b29', 'stroke-width': 3 })));
    routeSvg.append(LN(xs[0], y, xs[LAST], y, 'rgba(150,190,210,.35)', 4, { 'stroke-dasharray': '2 8' }), prog, ...pins);
    stBtns.forEach((b, i) => { b.style.left = xs[i] + 'px'; });
    BX = { W, H, xs, y, prog, pins };
    setProg(xs[cur]);
    paintPins();
  }
  const setProg = x => { if (BX) BX.prog.setAttribute('x2', x); };
  function paintPins() {
    if (BX) BX.pins.forEach((g, i) => { g.classList.toggle('on', i === cur); g.classList.toggle('done', i < cur); });
  }

  /* =====================================================================
     THE TRIP SCENE (full screen, between two pages)
     The vehicle leaves one landmark and rides to the next while hills, trees and
     buildings slide past at different speeds. Going back plays it mirrored.
  ===================================================================== */
  const ride = $('#ride'), rideSvg = $('#rideSvg');
  const SEED = n => { let s = n * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const VS = 2.1, LS = 1.9;

  function drawScene(k, dir) {
    const r = ride.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const vw = r.width < 700 ? 560 : 1000, VH = clamp(vw * r.height / r.width, 420, 1100), GY = VH * 0.74;
    rideSvg.setAttribute('viewBox', '0 0 ' + vw + ' ' + VH.toFixed(1));
    rideSvg.replaceChildren();
    const L = LEGS[k], dep = dir > 0 ? k : k + 1, arr = dir > 0 ? k + 1 : k;
    const x0 = 520, x1 = 2520, camS = x0 - vw * 0.3, camE = x1 - vw * 0.52;
    const rnd = SEED(k + 3);

    const defs = sv('defs');
    const sky = sv('linearGradient', { id: 'rsky', x1: 0, y1: 0, x2: 0, y2: 1 });
    [['0', '#08121f'], ['.55', '#173a52'], ['1', '#c0643c']].forEach(([o, c]) => sky.append(sv('stop', { offset: o, 'stop-color': c })));
    const sea = sv('linearGradient', { id: 'rsea', x1: 0, y1: 0, x2: 0, y2: 1 });
    [['0', '#2a9bb0'], ['1', '#0e3a50']].forEach(([o, c]) => sea.append(sv('stop', { offset: o, 'stop-color': c })));
    defs.append(sky, sea);

    const root = sv('g', dir > 0 ? {} : { transform: 'translate(' + vw + ' 0) scale(-1 1)' });
    root.append(defs, R(0, 0, vw, VH, 'url(#rsky)'));
    for (let i = 0; i < 70; i++) root.append(R(rnd() * vw, rnd() * GY * 0.6, i % 6 ? 1.5 : 2.6, i % 6 ? 1.5 : 2.6, '#fff', { opacity: 0.25 + rnd() * 0.5 }));
    root.append(CI(vw * 0.78, GY - 40, 70, '#ffb25a', { opacity: 0.28 }), CI(vw * 0.78, GY - 40, 36, '#ffd98a', { opacity: 0.5 }));
    const sx = G({ transform: 'translate(' + (vw * 0.14) + ' 30) scale(2.2)' }, southernCrossStars(0)); root.append(sx);

    // far hills
    const far = G(), mid = G(), world = G();
    let hd = 'M-200 ' + GY; for (let x = -200; x <= 1400; x += 20) hd += ' L' + x + ' ' + (GY - 60 - 34 * Math.sin(x / 140 + k) - 18 * Math.sin(x / 53)); hd += ' L1400 ' + GY + ' Z';
    far.append(PA(hd, '#12303f', { opacity: 0.9 }));
    if (L.surface === 'tram' || k >= 4) { for (let i = 0; i < 9; i++) { const bw = 40 + rnd() * 40, bh = 70 + rnd() * 150; far.append(R(-100 + i * 150, GY - bh, bw, bh, '#183347')); for (let j = 0; j < 5; j++) far.append(R(-96 + i * 150 + (j % 2) * 18, GY - bh + 12 + Math.floor(j / 2) * 22, 8, 8, COL.sun, { opacity: 0.45 })); } }
    // mid layer: trees, poles or buoys, depending on the surface
    for (let i = 0; i < 26; i++) {
      const x = -150 + i * 130 + rnd() * 70;
      if (L.surface === 'water') { if (i % 3 === 0) mid.append(G({ transform: 'translate(' + x + ' ' + (GY + 14) + ')' }, CI(0, 0, 9, COL.coral), R(-2, -22, 4, 14, '#e8dcc0'))); }
      else if (L.surface === 'rail') { if (i % 2) mid.append(G({ transform: 'translate(' + x + ' ' + GY + ') scale(' + (1.4 + rnd() * 0.6) + ')' }, gumAt()));
        else mid.append(G(null, R(x, GY - 90, 4, 90, '#3a4b57'), R(x - 16, GY - 90, 36, 4, '#3a4b57'))); }
      else if (L.surface === 'tram') { if (i % 2) { const bh = 110 + rnd() * 120; mid.append(R(x, GY - bh, 70, bh, '#1f3b52')); for (let j = 0; j < 5; j++) for (let m = 0; m < 3; m++) mid.append(R(x + 8 + m * 20, GY - bh + 14 + j * 22, 10, 11, rnd() > 0.35 ? COL.sun : '#2c4d66', { opacity: 0.55 })); } else mid.append(R(x, GY - 150, 4, 150, '#3a4b57')); }
      else { if (i % 3) mid.append(G({ transform: 'translate(' + x + ' ' + GY + ') scale(' + (1.3 + rnd() * 0.7) + ')' }, gumAt())); else { mid.append(R(x, GY - 56, 64, 56, '#a4523a'), PA('M' + (x - 6) + ' ' + (GY - 56) + ' L' + (x + 32) + ' ' + (GY - 84) + ' L' + (x + 70) + ' ' + (GY - 56) + ' Z', '#6b2f22'), R(x + 12, GY - 34, 16, 20, '#ffd24a', { opacity: 0.7 })); } }
    }
    function gumAt() { return G(null, R(-3, -44, 6, 44, '#e8dcc0', { rx: 2 }), CI(-12, -50, 15, COL.gum), CI(10, -56, 17, '#37a073'), CI(0, -68, 14, '#2f8a63')); }

    // the world: ground, landmarks, vehicle
    const surf = G();
    const tw = 3300;
    if (L.surface === 'water') {
      surf.append(R(-200, GY - 6, tw, VH - GY + 80, 'url(#rsea)'));
      for (let j = 0; j < 5; j++) surf.append(PA('M-200 ' + (GY + 16 + j * 26) + ' q15 -8 30 0 t30 0'.repeat(1) + ' t30 0'.repeat(Math.ceil(tw / 30)), 'none', { stroke: 'rgba(255,255,255,.3)', 'stroke-width': 2 }));
    } else {
      surf.append(R(-200, GY, tw, VH - GY + 80, '#0e2230'));
      if (L.surface === 'rail') { surf.append(R(-200, GY, tw, 22, '#1d2b36')); for (let x = -200; x < tw; x += 26) surf.append(R(x, GY + 4, 9, 16, '#4a3a2a')); surf.append(LN(-200, GY + 4, tw, GY + 4, '#b5c0c8', 3.5), LN(-200, GY + 20, tw, GY + 20, '#b5c0c8', 3.5)); }
      else { surf.append(R(-200, GY, tw, 34, ROAD), LN(-200, GY + 17, tw, GY + 17, '#e3e9ee', 3, { 'stroke-dasharray': '34 28' })); if (L.surface === 'tram') { surf.append(LN(-200, GY + 6, tw, GY + 6, '#aab6bf', 2.5), LN(-200, GY + 28, tw, GY + 28, '#aab6bf', 2.5)); for (let x = -200; x < tw; x += 190) surf.append(LN(x, GY, x, GY - 230, '#3a4b57', 4)); surf.append(LN(-200, GY - 228, tw, GY - 228, '#5a6b77', 2)); } }
    }
    const lm = (fn, x, s) => G({ transform: 'translate(' + x + ' ' + (GY + (L.surface === 'water' ? 0 : 6)) + ') scale(' + s + ') translate(0 ' + (-GYD) + ')' }, fn(0));
    world.append(surf, lm(LANDMARKS[dep], x0 - 90, LS), lm(LANDMARKS[arr], x1 - 90, LS));

    // fence posts / lamps close to the camera
    const posts = G();
    for (let x = 300; x < tw; x += 210) posts.append(R(x, GY + 26, 6, 56, '#16293a'), CI(x + 3, GY + 24, 5, COL.sun, { opacity: 0.8 }));
    const v = L.build(), holder = sv('g');
    holder.append(v.g);
    world.append(holder, posts);
    root.append(far, mid, world);
    rideSvg.append(root);
    return { far, mid, world, holder, v, GY, x0, x1, camS, camE, L, dir, surf };
  }

  function renderScene(s, q, t) {
    const cam = s.camS + (s.camE - s.camS) * q, vx = s.x0 + (s.x1 - s.x0) * q;
    s.far.setAttribute('transform', 'translate(' + (-cam * 0.22).toFixed(1) + ' 0)');
    s.mid.setAttribute('transform', 'translate(' + (-cam * 0.55).toFixed(1) + ' 0)');
    s.world.setAttribute('transform', 'translate(' + (-cam).toFixed(1) + ' 0)');
    const bob = s.v.bob ? Math.sin(t / 360) * 4 : Math.sin(t / 70) * 0.9 * clamp(Math.sin(Math.PI * q) * 2, 0, 1);
    const lift = s.L.surface === 'water' ? 18 : s.L.surface === 'rail' ? 14 : s.L.surface === 'tram' ? 10 : 12;
    s.holder.setAttribute('transform', 'translate(' + vx.toFixed(1) + ' ' + (s.GY + lift + (s.v.y || 0) * VS + bob).toFixed(1) + ') scale(' + VS + ')');
    s.v.wheels.forEach(w => w.g.setAttribute('transform', 'rotate(' + (vx * 1.9).toFixed(0) + ' ' + w.cx + ' ' + w.cy + ')'));
  }

  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  function playTrip(from, to, onMid, speedUp) {
    return new Promise(resolve => {
      const dir = to > from ? 1 : -1, seq = [];
      if (dir > 0) for (let k = from; k < to; k++) seq.push(k); else for (let k = from - 1; k >= to; k--) seq.push(k);
      const n = seq.length, per = (n <= 1 ? 2700 : n <= 3 ? 1900 : 1250) * speedUp, total = per * n;
      let scene = null, lastLeg = -1, swapped = false;
      ride.classList.add('on');
      const t0 = performance.now();
      const frame = now => {
        const e = Math.max(0, now - t0), i = Math.min(n - 1, Math.floor(e / per)), lt = clamp((e - i * per) / per, 0, 1);
        if (i !== lastLeg) { lastLeg = i; scene = drawScene(seq[i], dir); emit('coaster:leg', { leg: seq[i], dir }); }
        if (!scene) { onMid(); ride.classList.remove('on'); resolve(); return; }
        const q = easeIO(lt);
        renderScene(scene, q, now);
        const overall = (i + q) / n;
        setProg(BX ? BX.xs[from] + (BX.xs[to] - BX.xs[from]) * (e / total > 1 ? 1 : e / total) : 0);
        emit('coaster:ride', { leg: seq[i], q: lt, t: now, dir });
        if (!swapped && e / total >= 0.4) { swapped = true; onMid(); }
        if (e < total) requestAnimationFrame(frame);
        else { ride.classList.remove('on'); setTimeout(() => { rideSvg.replaceChildren(); resolve(); }, 330); }
      };
      requestAnimationFrame(frame);
    });
  }

  const step = dir => {
    let i = cur + dir;
    while (route && i >= 0 && i <= LAST && !route.has(STAGES[i].id)) i += dir;
    return i;
  };

  function render() {
    pages.forEach((pg, i) => pg.classList.toggle('on', i === cur));
    $$('.nav a').forEach(a => {
      const on = a.dataset.nav === STAGES[cur].id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#progress').style.width = ((cur + 1) / pages.length * 100).toFixed(1) + '%';
    prevBtn.style.visibility = step(-1) < 0 ? 'hidden' : 'visible';
    const nx = step(1), nextName = nx > LAST ? 'Back to start' : STAGES[nx].nav + ' (' + STAGES[nx].place + ')';
    nextBtn.setAttribute('aria-label', 'Next: ' + nextName);
    nextBtn.title = 'Next: ' + nextName;
    stBtns.forEach((b, i) => {
      b.classList.toggle('skip', !!route && !route.has(STAGES[i].id));
      b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur);
      if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    paintPins();
    if (BX && !busy) setProg(BX.xs[cur]);
    try { history.replaceState(null, '', '#' + STAGES[cur].id); } catch (e) { /* ignore */ }
  }

  async function go(to) {
    if (to < 0 || to > LAST || to === cur) return;
    if (busy) { pending = to; return; }
    busy = true;
    const from = cur, now = performance.now();
    streak = now - lastGo < 4000 ? Math.min(streak + 1, 3) : 0;
    lastGo = now;
    const speedUp = Math.pow(0.82, streak);
    const swap = () => { cur = to; render(); pages[cur].scrollTop = 0; };
    emit('coaster:start', { from, to, speedUp, streak });
    if (REDUCED) swap(); else await playTrip(from, to, swap, speedUp);
    cur = to; render();
    emit('coaster:end', { from, to, streak });
    pages[cur].focus({ preventScroll: true });
    busy = false;
    if (pending !== null) { const p = pending; pending = null; go(p); }
  }

  window.COASTER = {
    go, STAGES, pages,
    get cur() { return cur; },
    get route() { return route; },
    setRoute(ids) { route = ids ? new Set(ids) : null; render(); },
    isBusy: () => busy, LEGS
  };

  // trip computer: which vehicle, which route, how fast
  let hudHide = 0;
  window.addEventListener('coaster:start', () => { clearTimeout(hudHide); hud.classList.add('on'); });
  window.addEventListener('coaster:leg', e => {
    const L = LEGS[e.detail.leg];
    $('#hMode').textContent = L.name; $('#hRoute').textContent = e.detail.dir > 0 ? L.route : L.route.split(' to ').reverse().join(' to ');
    $('#hKm').textContent = L.km + ' km';
  });
  window.addEventListener('coaster:ride', e => {
    const env = clamp(Math.sin(Math.PI * e.detail.q) * 1.8, 0, 1);
    $('#hSpd').textContent = Math.round(LEGS[e.detail.leg].speed * env) + ' km/h';
  });
  window.addEventListener('coaster:end', () => { $('#hSpd').textContent = '0 km/h'; hudHide = setTimeout(() => { if (!busy) hud.classList.remove('on'); }, 900); });

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const idx = STAGES.findIndex(s => '#' + s.id === a.getAttribute('href'));
    if (idx < 0) return;
    e.preventDefault();
    if (idx === cur) { pages[cur].scrollTop = 0; return; }
    go(idx);
  });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(step(1));
    else if (e.key === 'ArrowLeft') go(step(-1));
  });
  let tx = 0, ty = 0;
  document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? step(1) : step(-1));
  }, { passive: true });

  const startAt = STAGES.findIndex(s => '#' + s.id === location.hash);
  cur = startAt > 0 ? startAt : 0;
  layoutBar();
  render();
  window.addEventListener('hashchange', () => {
    const i = STAGES.findIndex(s => '#' + s.id === location.hash);
    if (i >= 0 && i !== cur) go(i);
  });
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!busy) { layoutBar(); render(); } }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!busy) { layoutBar(); render(); } });
})();
