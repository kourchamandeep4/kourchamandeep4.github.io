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
    { id: 'station',     nav: 'Start',      place: 'Source',    sign: 'Stage 1: Source' },
    { id: 'about',       nav: 'About',      place: 'Ingest',    sign: 'Stage 2: Ingest' },
    { id: 'skills',      nav: 'Skills',     place: 'Transform', sign: 'Stage 3: Transform with SQL' },
    { id: 'projects',    nav: 'Projects',   place: 'Dashboard', sign: 'Stage 4: Gold layer and dashboard' },
    { id: 'experience',  nav: 'Experience', place: 'Quality',   sign: 'Stage 5: Quality checks' },
    { id: 'credentials', nav: 'Awards',     place: 'Model',     sign: 'Stage 6: Model and AI' },
    { id: 'contact',     nav: 'Contact',    place: 'Deploy',    sign: 'Final stage: Deploy' }
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
            h('a', { class: 'btn primary', href: '#about', text: 'Run the pipeline' }),
            h('a', { class: 'btn', href: '#projects', text: 'Jump to projects' }),
            L.cv ? ext(L.cv, 'Download CV', 'btn') : null)),
        h('aside', { class: 'plaque', 'aria-label': 'Pipeline info' },
          h('h3', { text: 'Pipeline info' }),
          h('dl', null, plaque.map(([k, v]) => h('div', null, h('dt', { text: k }), h('dd', { text: v })))))));
  }

  function secAbout() {
    const a = P.about || {};
    return page(1, heading(1, a.title || 'About me'),
      h('div', { class: 'about-grid' },
        h('div', { class: 'prose' }, (a.paragraphs || []).map(t => h('p', { text: t }))),
        h('aside', { class: 'rider', 'aria-label': 'Engineer profile' },
          h('h3', { text: 'Engineer profile' }),
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

  function barsChart(c) {
    return h('div', { class: 'panel' }, h('h3', { text: c.title }), h('p', { class: 'panel-sub', text: c.sub || '' }),
      (c.items || []).map(it => h('div', { class: 'brow' },
        h('div', { class: 'blabel' }, h('span', { text: it.label }), h('b', { text: it.before + ' to ' + it.after + (it.unit || '') })),
        h('div', { class: 'bar before' }, h('i', { style: '--w:' + clamp(it.before, 0, 100) + '%' })),
        h('div', { class: 'bar after' }, h('i', { style: '--w:' + clamp(Math.max(it.after, 1.5), 0, 100) + '%' })))),
      h('p', { class: 'legend' }, h('span', { class: 'k before' }), 'Before', h('span', { class: 'k after' }), 'After'));
  }
  function donutChart(c) {
    const r = 54, C = 2 * Math.PI * r;
    const svg = sv('svg', { viewBox: '0 0 140 140', class: 'donut', role: 'img', 'aria-label': c.title + ': ' + c.value + ' percent' });
    svg.append(sv('circle', { cx: 70, cy: 70, r, fill: 'none', stroke: 'rgba(120,170,200,.18)', 'stroke-width': 16 }),
      sv('circle', { class: 'arc', cx: 70, cy: 70, r, fill: 'none', stroke: 'currentColor', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-dasharray': (C * c.value / 100).toFixed(1) + ' ' + C.toFixed(1), transform: 'rotate(-90 70 70)', style: '--len:' + (C * c.value / 100).toFixed(1) + ';--circ:' + C.toFixed(1) }));
    const t = sv('text', { x: 70, y: 78, 'text-anchor': 'middle', class: 'donut-v' }); t.textContent = c.value + '%'; svg.append(t);
    return h('div', { class: 'panel center' }, h('h3', { text: c.title }), svg, h('p', { class: 'panel-sub', text: c.sub || '' }));
  }

  function secProjects() {
    const list = P.projects || [], D = P.dashboard || {};
    const kpis = h('div', { class: 'kpis' }, (D.kpis || []).map(k => h('div', { class: 'kpi' }, h('b', { text: k.value }), h('span', { text: k.label }), k.note ? h('small', { text: k.note }) : null)));
    const charts = h('div', { class: 'panels' }, (D.charts || []).map(c => c.type === 'donut' ? donutChart(c) : barsChart(c)));
    const tickets = h('div', { class: 'tickets' }, list.map((p, i) =>
      h('article', { class: 'ticket' },
        h('div', { class: 'stub', 'aria-hidden': 'true' }, h('span', { text: 'PROJECT' }), h('b', { text: String(i + 1).padStart(2, '0') })),
        h('div', { class: 'tbody' },
          h('h3', { text: p.title }),
          h('p', { text: p.blurb }),
          p.result ? h('p', { class: 'result' }, h('b', { text: 'Result:' }), p.result) : null,
          p.tools && p.tools.length ? h('ul', { class: 'tags', 'aria-label': 'Tools used' }, p.tools.map(t => h('li', { text: t }))) : null,
          h('div', { class: 'links' },
            p.repo ? ext(p.repo, 'View repository', 'btn small') : null,
            p.demo ? ext(p.demo, 'Open live demo', 'btn small primary') : null)))));
    // slicer: filter the project cards by tool, like a dashboard filter
    const tools = [...new Set(list.flatMap(p => p.tools || []))];
    const active = new Set();
    const cards = Array.from(tickets.children);
    const apply = () => {
      cards.forEach((c, i) => c.classList.toggle('hide', active.size > 0 && !(list[i].tools || []).some(t => active.has(t))));
      $$('.slicers button', slicers).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t ? active.has(b.dataset.t) : active.size === 0)));
    };
    const slicers = h('div', { class: 'slicers', role: 'group', 'aria-label': 'Filter projects by tool' }, h('span', { text: 'Filter by tool' }),
      h('button', { type: 'button', 'aria-pressed': 'true', text: 'All', onclick: () => { active.clear(); apply(); } }),
      tools.map(t => h('button', { type: 'button', 'data-t': t, 'aria-pressed': 'false', text: t, onclick: () => { active.has(t) ? active.delete(t) : active.add(t); apply(); } })));
    const live = (P.github && P.github.showLiveRepos && P.github.user)
      ? h('div', { class: 'live', id: 'live' }, h('h3', { text: 'Fresh off the build line' }), h('p', { text: 'Latest public repositories, loaded live from GitHub.' }), h('div', { class: 'repos', id: 'repos' }))
      : null;
    const head = h('div', { class: 'dash-head' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', { text: 'projects_dashboard' }), h('small', { text: 'Last refreshed ' + new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) }));
    return page(3, heading(3, 'Projects'), h('div', { class: 'dash' }, head, kpis, charts, slicers, tickets), live);
  }

  function secExperience() {
    return page(4, heading(4, P.experienceTitle || 'Experience and education'),
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
    return page(5, heading(5, P.credentialsTitle || 'Ride stats and awards'),
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
      h('div', { class: 'release' }, h('b', { text: 'Release notes: v1.0 shipped' }),
        h('ul', null,
          h('li', null, h('span', { class: 'ok', text: 'OK' }), 'Resume: ' + [P.role, P.location].filter(Boolean).join(', ')),
          h('li', null, h('span', { class: 'ok', text: 'OK' }), (P.projects || []).length + ' projects deployed, see the dashboard'),
          h('li', null, h('span', { class: 'ok', text: 'OK' }), (P.status || 'Available') + '. Say hello.')),
        h('div', { class: 'links' }, h('a', { class: 'btn small primary', href: '#projects', text: 'Open the projects dashboard' }), L.cv ? ext(L.cv, 'Download CV', 'btn small') : null)),
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
  main.append(secHero(), secAbout(), secSkills(), secProjects(), secExperience(), secCreds(), secContact());
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
     THE PIPELINE
     Between two pages a full-screen scene plays, and each scene is a piece of data
     engineering: ingest, a SQL query, a lakehouse, quality checks, an AI retrieval run
     with robots, and finally a flying car that delivers the resume and the projects.
     The bar at the bottom is the pipeline: one node per stage.
  ===================================================================== */
  const bar = $('#pager');
  const COL = { cy: '#35e0e8', gr: '#5cff9d', pu: '#9b7bff', am: '#ffc93c', rd: '#ff5d73', ink: '#07101c', panel: '#0e1a2b', line: '#24405c', mute: '#7fa3bd' };
  const WL = 2900;                         // length of every scene, in scene units

  const R = (x, y, w, hh, fill, ex) => sv('rect', Object.assign({ x, y, width: w, height: hh, fill }, ex));
  const PA = (d, fill, ex) => sv('path', Object.assign({ d, fill }, ex));
  const CI = (cx, cy, r, fill, ex) => sv('circle', Object.assign({ cx, cy, r, fill }, ex));
  const LN = (x1, y1, x2, y2, stroke, w, ex) => sv('line', Object.assign({ x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round' }, ex));
  const G = (attrs, ...kids) => { const g = sv('g', attrs || {}); kids.flat().forEach(k => k && g.append(k)); return g; };
  const TX = (x, y, str, size, fill, anchor, ex) => {
    const t = sv('text', Object.assign({ x, y, fill, 'font-size': size, 'text-anchor': anchor || 'start', 'font-family': '"Share Tech Mono", ui-monospace, Menlo, monospace' }, ex));
    t.textContent = str; return t;
  };
  const mix = (a, b, t) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const frac = v => v - Math.floor(v);
  const sm = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- small icons ---------- */
  function dbIcon(x, y, c) {
    return G(null, PA('M' + (x - 34) + ' ' + (y - 22) + ' v44 a34 11 0 0 0 68 0 v-44 Z', COL.panel, { stroke: c, 'stroke-width': 2.5 }),
      sv('ellipse', { cx: x, cy: y - 22, rx: 34, ry: 11, fill: '#13263b', stroke: c, 'stroke-width': 2.5 }),
      PA('M' + (x - 34) + ' ' + (y - 4) + ' a34 11 0 0 0 68 0', 'none', { stroke: c, 'stroke-width': 1.6, opacity: 0.6 }), TX(x, y + 44, 'database', 13, COL.mute, 'middle'));
  }
  function apiIcon(x, y, c) { return G(null, R(x - 36, y - 26, 72, 52, 10, { fill: COL.panel, stroke: c, 'stroke-width': 2.5 }), TX(x, y + 8, '{ }', 28, c, 'middle'), TX(x, y + 44, 'REST API', 13, COL.mute, 'middle')); }
  function fileIcon(x, y, c) { return G(null, PA('M' + (x - 28) + ' ' + (y - 30) + ' h38 l18 18 v42 h-56 Z', COL.panel, { stroke: c, 'stroke-width': 2.5 }), TX(x, y + 8, 'CSV', 20, c, 'middle'), TX(x, y + 44, 'files', 13, COL.mute, 'middle')); }
  function tableIcon(x, y, w, c, fill) { return G(null, R(x, y, w, w * 0.7, fill || '#13263b', { rx: 2, stroke: c, 'stroke-width': 1.2 }), LN(x, y + w * 0.23, x + w, y + w * 0.23, c, 1), LN(x + w * 0.4, y, x + w * 0.4, y + w * 0.7, c, 1)); }
  function pipe(x0, x1, y, hh) { return G(null, R(x0, y - hh / 2, x1 - x0, hh, '#0d2236', { stroke: COL.line, 'stroke-width': 2 }), R(x0, y - hh / 2 + 3, x1 - x0, 3, 'rgba(255,255,255,.1)')); }
  function label(x, y, str, c) { return TX(x, y, str, 15, c || COL.mute, 'middle', { 'letter-spacing': 2 }); }

  /* ---------- robots and the flying car ---------- */
  function robot(color) {
    const g = sv('g'), legL = LN(-8, -14, -8, 0, color, 6), legR = LN(8, -14, 8, 0, color, 6);
    const crate = G({ style: 'display:none' }, R(-14, -52, 28, 22, '#0e1a2b', { stroke: COL.am, 'stroke-width': 2, rx: 3 }), tableIcon(-9, -48, 18, COL.am));
    g.append(legL, legR, R(-17, -48, 34, 34, color, { rx: 8 }), R(-11, -41, 22, 8, '#07101c', { rx: 3 }), CI(-5, -37, 2.5, COL.gr), CI(5, -37, 2.5, COL.gr),
      R(-14, -76, 28, 24, '#cfe4f2', { rx: 7 }), R(-9, -69, 18, 8, '#07101c', { rx: 3 }), CI(-4, -65, 2.2, COL.cy), CI(4, -65, 2.2, COL.cy),
      LN(0, -76, 0, -88, '#cfe4f2', 2.5), CI(0, -90, 3.5, COL.rd), LN(-17, -40, -26, -28, color, 5), LN(17, -40, 26, -28, color, 5), crate);
    return { g, legL, legR, crate };
  }
  function walk(rb, x, y, t, carry, dir) {
    const sw = Math.sin(t / 110) * 8;
    rb.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + (y + Math.abs(Math.sin(t / 110)) * -3).toFixed(1) + ') scale(' + (dir || 1) + ' 1)');
    rb.legL.setAttribute('x2', -8 + sw); rb.legR.setAttribute('x2', 8 - sw);
    rb.crate.style.display = carry ? '' : 'none';
  }
  function flyingCar() {
    const g = sv('g'), flame = PA('M-56 -6 L-84 -10 L-56 -16 Z', COL.am, { opacity: 0.9 });
    g.append(flame, PA('M-58 0 Q-60 -18 -38 -22 L-10 -40 Q10 -48 34 -38 L58 -22 Q74 -18 72 0 Z', COL.cy), PA('M-10 -38 Q8 -44 28 -36 L40 -24 L-20 -24 Z', '#07101c', { opacity: 0.85 }),
      PA('M-4 -34 Q8 -39 22 -33 L28 -26 L-8 -26 Z', '#9ee8ff', { opacity: 0.55 }), R(-58, -6, 130, 5, COL.pu, { rx: 2 }), CI(66, -10, 4, '#fff6c9'), CI(-30, 6, 6, '#07101c', { stroke: COL.cy, 'stroke-width': 2 }), CI(40, 6, 6, '#07101c', { stroke: COL.cy, 'stroke-width': 2 }),
      PA('M-34 10 Q5 24 46 10', 'none', { stroke: COL.cy, 'stroke-width': 3, opacity: 0.5, 'stroke-linecap': 'round' }));
    return { g, flame };
  }
  function docSprite(w, title, color) { return G(null, R(-w / 2, -w * 0.6, w, w * 1.2, '#f4f7fb', { rx: 5, stroke: color, 'stroke-width': 3 }), R(-w / 2 + 8, -w * 0.6 + 10, w * 0.5, 7, color, { rx: 2 }), ...[0, 1, 2, 3].map(i => R(-w / 2 + 8, -w * 0.6 + 26 + i * 12, w - 16 - (i % 2) * 12, 4, '#b7c6d4', { rx: 2 })), TX(0, w * 0.52, title, 13, '#0e1a2b', 'middle', { 'font-weight': 700 })); }

  /* ---------- the six scenes ---------- */
  // each returns { update(q, t) } and adds its objects to world (moves with the camera) and screen (fixed)
  const SCENES = [];

  // 1. Ingest: three kinds of source feed a stream that lands in storage
  SCENES[0] = ({ world, screen, GY }) => {
    const y0 = GY - 110, srcY = [y0 - 130, y0, y0 + 130], cols = [COL.cy, COL.gr, COL.pu];
    world.append(dbIcon(240, srcY[0], cols[0]), apiIcon(240, srcY[1], cols[1]), fileIcon(240, srcY[2], cols[2]));
    srcY.forEach((y, i) => world.append(PA('M330 ' + y + ' C520 ' + y + ' 560 ' + y0 + ' 760 ' + y0, 'none', { stroke: COL.line, 'stroke-width': 14, 'stroke-linecap': 'round' })));
    world.append(pipe(740, 2430, y0, 34));
    // stream (a message queue): three stacked lanes
    [-20, 0, 20].forEach(o => world.append(R(1180, y0 + o - 7, 160, 12, '#0f2a44', { rx: 6, stroke: cols[(o + 20) / 20], 'stroke-width': 1.5 })));
    world.append(label(1260, y0 - 70, 'STREAM'), label(240, y0 - 200, 'SOURCES'), label(1850, y0 - 70, 'SCHEMA CHECK'), label(2540, y0 - 130, 'LANDING ZONE'));
    world.append(R(1830, y0 - 50, 8, 100, COL.gr, { rx: 3, opacity: 0.7 }), R(1900, y0 - 50, 8, 100, COL.gr, { rx: 3, opacity: 0.7 }), PA('M1830 ' + (y0 - 50) + ' h78', 'none', { stroke: COL.gr, 'stroke-width': 4 }));
    for (let i = 0; i < 3; i++) world.append(R(2480 + i * 4, y0 - 60 + i * 38, 120, 34, '#13263b', { rx: 5, stroke: COL.cy, 'stroke-width': 2 }), CI(2500 + i * 4, y0 - 43 + i * 38, 4, COL.gr));
    const N = 30, pk = Array.from({ length: N }, (_, i) => { const r = R(-9, -6, 18, 12, cols[i % 3], { rx: 3 }); world.append(r); return r; });
    screen.append(TX(36, 54, '01  INGEST', 26, COL.cy), TX(36, 80, 'pull data from databases, APIs and files', 15, COL.mute));
    return { update(q) { pk.forEach((r, i) => { const ph = frac(q * 1.7 + i / N), x = 330 + ph * 2150, y = ph < 0.2 ? srcY[i % 3] + (y0 - srcY[i % 3]) * sm(ph / 0.2) : y0; r.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); r.setAttribute('opacity', ph > 0.97 ? 0 : 1); }); } };
  };

  // 2. SQL: two tables are joined, filtered and grouped
  SCENES[1] = ({ world, screen, GY, vw }) => {
    const y0 = GY - 110;
    world.append(pipe(200, 2300, y0, 34), label(300, y0 - 150, 'orders'), label(300, y0 + 175, 'customers'), label(920, y0 - 70, 'JOIN'), label(1500, y0 - 70, 'WHERE'), label(2080, y0 - 70, 'GROUP BY'));
    world.append(PA('M200 ' + (y0 - 80) + ' C500 ' + (y0 - 80) + ' 600 ' + y0 + ' 880 ' + y0, 'none', { stroke: COL.line, 'stroke-width': 14, 'stroke-linecap': 'round' }), PA('M200 ' + (y0 + 80) + ' C500 ' + (y0 + 80) + ' 600 ' + y0 + ' 880 ' + y0, 'none', { stroke: COL.line, 'stroke-width': 14, 'stroke-linecap': 'round' }));
    world.append(CI(920, y0, 44, COL.panel, { stroke: COL.am, 'stroke-width': 3 }), TX(920, y0 + 12, '⋈', 40, COL.am, 'middle'));
    world.append(PA('M1440 ' + (y0 - 60) + ' h120 l-44 56 v60 h-32 v-60 Z', COL.panel, { stroke: COL.cy, 'stroke-width': 3 }));
    world.append(R(2060, y0 - 40, 110, 80, COL.panel, { rx: 8, stroke: COL.gr, 'stroke-width': 3 }), ...[0, 1, 2].map(i => R(2076 + i * 28, y0 - 24, 20, 48, COL.gr, { opacity: 0.35, rx: 3 })));
    const bars = [0.5, 0.9, 0.65, 1].map((v, i) => { const b = R(2400 + i * 58, GY - 40, 40, 4, i % 2 ? COL.cy : COL.gr, { rx: 4 }); world.append(b); return [b, v]; });
    world.append(LN(2380, GY - 36, 2640, GY - 36, COL.line, 3), label(2510, GY + 10, 'RESULT'));
    const N = 34, pk = Array.from({ length: N }, (_, i) => { const r = R(-9, -6, 18, 12, i % 2 ? COL.cy : COL.pu, { rx: 3 }); world.append(r); return { r, bad: i % 4 === 3 }; });
    // the query, typed out on the screen
    const lines = ['SELECT c.region, SUM(o.amount)', 'FROM orders o', 'JOIN customers c ON o.cid = c.id', "WHERE o.status = 'ok'", 'GROUP BY c.region;'];
    const cw = Math.min(vw - 72, 470), card = G(null, R(30, 96, cw, 142, '#050c16', { rx: 10, stroke: COL.line, 'stroke-width': 2, opacity: 0.94 }));
    const tl = lines.map((l, i) => { const t = TX(48, 128 + i * 26, '', 15, i === 0 || i === 4 ? COL.cy : '#cfe4f2'); card.append(t); return t; });
    screen.append(TX(36, 54, '02  TRANSFORM WITH SQL', 26, COL.cy), TX(36, 80, 'join, filter and aggregate', 15, COL.mute), card);
    return { update(q) {
      const total = lines.join('').length; let n = Math.floor(clamp(q * 1.25, 0, 1) * total);
      tl.forEach((t, i) => { const take = clamp(n, 0, lines[i].length); t.textContent = lines[i].slice(0, take); n -= lines[i].length; });
      pk.forEach(({ r, bad }, i) => {
        const ph = frac(q * 1.5 + i / N), side = i % 2 ? 1 : -1;
        let x, y = y0, op = 1;
        if (ph < 0.3) { const u = sm(ph / 0.3); x = 220 + u * 660; y = y0 + side * 80 * (1 - u); }
        else { x = 880 + (ph - 0.3) / 0.7 * 1280; if (bad && x > 1500) { y = y0 + (x - 1500) * 0.9; op = clamp(1 - (x - 1500) / 260, 0, 1); } }
        r.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); r.setAttribute('fill', bad && x > 1450 ? COL.rd : (ph > 0.3 ? (i % 2 ? COL.cy : COL.pu) : (i % 2 ? COL.cy : COL.pu))); r.setAttribute('opacity', ph > 0.97 ? 0 : op);
      });
      bars.forEach(([b, v]) => { const hh = 4 + 150 * v * sm((q - 0.25) / 0.6); b.setAttribute('height', hh.toFixed(1)); b.setAttribute('y', (GY - 36 - hh).toFixed(1)); });
    } };
  };

  // 3. Lakehouse: bronze, silver and gold layers
  SCENES[2] = ({ world, screen, GY }) => {
    const y0 = GY - 100, tiers = [['BRONZE', 'raw', '#cd7f32', 520], ['SILVER', 'cleaned', '#c6d2dc', 1450], ['GOLD', 'ready for BI', COL.am, 2380]];
    world.append(pipe(150, 2700, y0, 30));
    tiers.forEach(([n, d, c, x]) => {
      world.append(PA('M' + (x - 130) + ' ' + (y0 - 130) + ' h260 l-30 260 h-200 Z', COL.panel, { stroke: c, 'stroke-width': 3 }), R(x - 118, y0 - 20, 236, 128, c, { opacity: 0.18 }), label(x, y0 - 150, n + ' LAYER', c), TX(x, y0 + 160, d, 15, COL.mute, 'middle'));
      world.append(TX(x, y0 + 10, 'Δ', 38, c, 'middle', { opacity: 0.8 }));
    });
    // a small compute cluster that blinks above the silver layer
    const lights = []; for (let i = 0; i < 6; i++) { const bx = 1330 + i * 40; world.append(R(bx, y0 - 270, 32, 54, '#13263b', { rx: 4, stroke: COL.cy, 'stroke-width': 1.5 })); const l = CI(bx + 16, y0 - 250, 4, COL.gr); world.append(l, R(bx + 6, y0 - 238, 20, 4, COL.line)); lights.push(l); }
    world.append(label(1450, y0 - 292, 'SPARK CLUSTER'));
    const N = 40, pk = Array.from({ length: N }, (_, i) => { const r = R(-8, -6, 16, 12, '#cd7f32', { rx: 3 }); world.append(r); return r; });
    screen.append(TX(36, 54, '03  LAKEHOUSE', 26, COL.cy), TX(36, 80, 'bronze to silver to gold, clean as it goes', 15, COL.mute));
    return { update(q, t) {
      lights.forEach((l, i) => l.setAttribute('fill', Math.sin(t / 160 + i * 1.7) > 0 ? COL.gr : '#1a4a3a'));
      pk.forEach((r, i) => { const ph = frac(q * 1.2 + i / N), x = 160 + ph * 2540, y = y0 + Math.sin(ph * 40 + i) * (ph < 0.3 ? 9 : ph < 0.62 ? 3 : 0); const c = x < 900 ? mix('#cd7f32', '#8a8f98', (i % 5) / 5) : x < 1900 ? mix('#c6d2dc', '#e9eef2', clamp((x - 900) / 800, 0, 1)) : mix('#e9eef2', COL.am, clamp((x - 1900) / 500, 0, 1));
        r.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); r.setAttribute('fill', c); r.setAttribute('opacity', ph > 0.97 ? 0 : 1); });
    } };
  };

  // 4. Data quality: checks that let the good rows through and quarantine the bad ones
  SCENES[3] = ({ world, screen, GY }) => {
    const y0 = GY - 90, gates = [['NOT NULL', 800], ['UNIQUE', 1350], ['VALID RANGE', 1900]];
    world.append(pipe(150, 2450, y0, 30));
    const lamps = gates.map(([n, x]) => { world.append(PA('M' + (x - 50) + ' ' + (y0 + 40) + ' V' + (y0 - 40) + ' a50 50 0 0 1 100 0 V' + (y0 + 40), 'none', { stroke: COL.cy, 'stroke-width': 4 }), label(x, y0 + 80, n, COL.cy)); const l = CI(x, y0 - 70, 9, '#1a4a3a', { stroke: COL.cy, 'stroke-width': 2 }); world.append(l); return l; });
    world.append(R(1250, y0 - 250, 200, 90, '#1a0d16', { rx: 8, stroke: COL.rd, 'stroke-width': 2.5 }), label(1350, y0 - 262, 'QUARANTINE', COL.rd));
    const qcount = TX(1350, y0 - 192, '0', 40, COL.rd, 'middle'); world.append(qcount);
    world.append(R(2520, y0 - 70, 190, 140, COL.panel, { rx: 12, stroke: COL.gr, 'stroke-width': 3 }), PA('M2570 ' + y0 + ' l26 26 l56 -56', 'none', { stroke: COL.gr, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), label(2615, y0 + 112, 'TRUSTED', COL.gr));
    const N = 36, pk = Array.from({ length: N }, (_, i) => { const r = R(-9, -6, 18, 12, COL.cy, { rx: 3 }); world.append(r); return { r, bad: i % 3 === 1, gate: (i * 7) % 3 }; });
    screen.append(TX(36, 54, '04  QUALITY CHECKS', 26, COL.cy), TX(36, 80, 'good rows pass, bad rows are quarantined', 15, COL.mute));
    return { update(q, t) {
      let rejected = 0;
      pk.forEach(({ r, bad, gate }, i) => {
        const ph = frac(q * 1.3 + i / N), x = 170 + ph * 2300, gx = gates[gate][1];
        let y = y0, c = COL.cy, op = 1;
        if (bad && x > gx) { const d = x - gx; y = y0 - d * 0.55; c = COL.rd; op = clamp(1 - d / 380, 0, 1); if (d < 60) rejected++; }
        else if (x > gates[2][1] + 60) c = COL.gr;
        r.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); r.setAttribute('fill', c); r.setAttribute('opacity', ph > 0.97 ? 0 : op);
      });
      qcount.textContent = String(Math.floor(q * 12));
      lamps.forEach((l, i) => l.setAttribute('fill', Math.sin(t / 220 + i * 2) > 0.2 ? COL.gr : COL.am));
    } };
  };

  // 5. AI: robots fetch the right tables from a huge schema and feed a language model
  SCENES[4] = ({ world, screen, GY }) => {
    const y0 = GY;
    // 1,200+ tables on shelves
    for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) world.append(tableIcon(150 + c * 38, y0 - 330 + r * 40, 26, '#34536e', '#0f2336'));
    world.append(label(410, y0 - 352, '1,200+ TABLES'));
    const hit = [[3, 2], [4, 3], [8, 1]].map(([c, r]) => { const g = tableIcon(150 + c * 38, y0 - 330 + r * 40, 26, COL.am, '#3a2f0e'); world.append(g); g.style.opacity = 0; return g; });
    world.append(R(0, y0, WL, 6, COL.line));
    // vector database
    world.append(PA('M1230 ' + (y0 - 150) + ' v120 a60 18 0 0 0 120 0 v-120 Z', COL.panel, { stroke: COL.pu, 'stroke-width': 3 }), sv('ellipse', { cx: 1290, cy: y0 - 150, rx: 60, ry: 18, fill: '#1b1740', stroke: COL.pu, 'stroke-width': 3 }),
      ...[0, 1, 2].map(i => CI(1260 + i * 30, y0 - 100 + (i % 2) * 22, 5, COL.pu)), label(1290, y0 - 190, 'VECTOR DB', COL.pu));
    // language model chip
    const chip = R(1810, y0 - 170, 150, 110, '#0b1626', { rx: 12, stroke: COL.cy, 'stroke-width': 3 });
    world.append(chip, ...[0, 1, 2, 3].map(i => LN(1830 + i * 30, y0 - 170, 1830 + i * 30, y0 - 190, COL.cy, 3)), ...[0, 1, 2, 3].map(i => LN(1830 + i * 30, y0 - 60, 1830 + i * 30, y0 - 40, COL.cy, 3)), TX(1885, y0 - 100, 'LLM', 34, COL.cy, 'middle'), label(1885, y0 - 208, 'LANGUAGE MODEL', COL.cy));
    // answer: a SQL card and a chart
    world.append(R(2330, y0 - 230, 360, 200, '#050c16', { rx: 12, stroke: COL.gr, 'stroke-width': 3 }), TX(2350, y0 - 196, 'SELECT suburb, score', 15, COL.gr), TX(2350, y0 - 172, 'FROM liveability', 15, '#cfe4f2'), TX(2350, y0 - 148, 'ORDER BY score DESC;', 15, '#cfe4f2'),
      ...[0.4, 0.7, 0.55, 0.95].map((v, i) => R(2360 + i * 56, y0 - 50 - 70 * v, 38, 70 * v, i % 2 ? COL.cy : COL.gr, { rx: 3 })), label(2510, y0 - 252, 'ANSWER', COL.gr));
    const r1 = robot('#5aa9ff'), r2 = robot(COL.pu), r3 = robot('#3ddc97');
    const bubble = G(null, R(-90, -150, 190, 36, '#f4f7fb', { rx: 10 }), PA('M-10 -114 l10 14 l10 -14 Z', '#f4f7fb'), TX(5, -126, 'Which suburbs are liveable?', 10.5, '#0e1a2b', 'middle', { 'font-weight': 700 }));
    world.append(r1.g, r2.g, r3.g, bubble);
    screen.append(TX(36, 54, '05  MODEL AND AI', 26, COL.cy), TX(36, 80, 'robots retrieve only the tables a question needs', 15, COL.mute));
    return { update(q, t) {
      const a = clamp(q / 0.45, 0, 1), b = clamp((q - 0.4) / 0.4, 0, 1);
      const x1 = 250 + sm(a) * 1000, carry1 = a > 0.05 && a < 1 && false;
      walk(r1, x1, y0, a < 1 ? t : 0, a > 0.6, 1);
      bubble.setAttribute('transform', 'translate(' + x1.toFixed(1) + ' ' + (y0 - 40) + ') scale(1.3)'); bubble.style.opacity = a < 0.55 ? 1 : 0;
      hit.forEach((g, i) => { g.style.opacity = a > 0.35 + i * 0.1 ? 1 : 0; });
      walk(r2, 1340 + sm(b) * 480, y0, b > 0 && b < 1 ? t : 0, b > 0.02 && b < 0.98, 1);
      walk(r3, 2250, y0, 0, false, -1); r3.g.setAttribute('transform', 'translate(2250 ' + (y0 - Math.max(0, Math.sin(t / 150)) * 4 * (q > 0.78 ? 1 : 0)).toFixed(1) + ') scale(-1.6 1.6)');
      chip.setAttribute('stroke', q > 0.7 ? COL.gr : COL.cy); chip.setAttribute('stroke-width', (3 + (q > 0.55 ? 2 * Math.abs(Math.sin(t / 200)) : 0)).toFixed(1));
    } };
  };

  // 6. Deploy: a flying car delivers the resume and the projects, and lands with a boom
  SCENES[5] = ({ world, screen, GY, vw, VH }) => {
    for (let l = 0; l < 3; l++) for (let i = 0; i < 26; i++) { const bw = 50 + ((i * 37 + l * 11) % 60), bh = 80 + ((i * 53 + l * 29) % 200) - l * 10; world.append(R(i * 120 + l * 40, GY - bh * (1 + l * 0.12), bw, bh * (1 + l * 0.12), mix('#102236', '#183452', l / 2), { opacity: 0.9 - l * 0.12 }));
      if (l === 2) for (let j = 0; j < 4; j++) world.append(R(i * 120 + l * 40 + 8 + (j % 2) * 20, GY - bh * 1.24 + 14 + Math.floor(j / 2) * 24, 8, 8, COL.am, { opacity: 0.5 })); }
    world.append(R(0, GY, WL, 400, '#050c16'));
    // sky lane with light trails and a landing pad
    for (let i = 0; i < 14; i++) world.append(R(80 + i * 210, GY - 330 - (i % 3) * 36, 90, 3, i % 2 ? COL.pu : COL.cy, { opacity: 0.35, rx: 2 }));
    world.append(R(2320, GY - 14, 320, 14, COL.panel, { rx: 5, stroke: COL.cy, 'stroke-width': 3 }), label(2480, GY - 34, 'DEPLOY', COL.cy), CI(2340, GY - 7, 4, COL.gr), CI(2620, GY - 7, 4, COL.gr));
    const car = flyingCar(), tow = [['Resume', COL.cy, 70], ['ionLens', COL.pu, 60], ['Dashboard', COL.gr, 60]].map(([t, c, w]) => { const d = docSprite(w, t, c); world.append(d); return d; });
    const tl = tow.map(() => LN(0, 0, 0, 0, 'rgba(155,123,255,.6)', 2, { 'stroke-dasharray': '4 5' })); world.append(...tl, car.g);
    const parts = Array.from({ length: 46 }, (_, i) => { const p = CI(0, 0, 3 + (i % 4), [COL.am, COL.cy, COL.gr, COL.pu, COL.rd][i % 5]); p.style.opacity = 0; world.append(p); return p; });
    const ring = CI(0, 0, 10, 'none', { stroke: '#fff', 'stroke-width': 6 }); ring.style.opacity = 0; world.append(ring);
    const flash = R(0, 0, vw, VH, '#fff'); flash.style.opacity = 0; screen.append(flash);
    const boom = TX(vw / 2, VH * 0.3, 'BOOM. DEPLOYED.', 40, '#fff', 'middle', { 'font-weight': 700 }); boom.style.opacity = 0;
    screen.append(TX(36, 54, '06  DEPLOY', 26, COL.cy), TX(36, 80, 'ship the resume and the projects', 15, COL.mute), boom);
    return { update(q, t) {
      const fly = clamp(q / 0.78, 0, 1), cx = 330 + sm(fly) * 2000, cy = GY - 300 + Math.sin(t / 260) * 8 + sm(clamp((q - 0.6) / 0.2, 0, 1)) * 190;
      car.g.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(' + (q > 0.6 && q < 0.8 ? 8 : -2) + ') scale(1.5)');
      car.flame.setAttribute('d', 'M-56 -6 L' + (-84 - Math.random() * 14) + ' -10 L-56 -16 Z');
      const bx = clamp((q - 0.78) / 0.22, 0, 1), padX = 2480, padY = GY - 20;
      tow.forEach((d, i) => {
        const bxp = cx - 120 - i * 78, byp = cy + 4 + Math.sin(t / 240 + i) * 7;
        if (q < 0.8) { d.setAttribute('transform', 'translate(' + bxp.toFixed(1) + ' ' + byp.toFixed(1) + ') rotate(' + (Math.sin(t / 300 + i) * 5).toFixed(1) + ')'); d.style.opacity = 1; tl[i].setAttribute('x1', cx - 56); tl[i].setAttribute('y1', cy - 6); tl[i].setAttribute('x2', bxp + 30); tl[i].setAttribute('y2', byp); }
        else { const ang = -2.4 + i * 0.7, d2 = 40 + bx * 260; d.setAttribute('transform', 'translate(' + (padX + Math.cos(ang) * d2).toFixed(1) + ' ' + (padY - 60 + Math.sin(ang) * d2 * 0.9 - bx * 40).toFixed(1) + ') rotate(' + ((ang * 20) * bx).toFixed(1) + ') scale(' + (1 + bx * 0.5) + ')'); d.style.opacity = 1; tl[i].setAttribute('x2', tl[i].getAttribute('x1')); tl[i].setAttribute('y2', tl[i].getAttribute('y1')); }
      });
      const e = clamp((q - 0.8) / 0.2, 0, 1);
      parts.forEach((p, i) => { if (e <= 0) { p.style.opacity = 0; return; } const a = (i / parts.length) * Math.PI * 2, d = e * (140 + (i % 5) * 50); p.setAttribute('cx', (padX + Math.cos(a) * d).toFixed(1)); p.setAttribute('cy', (padY - 40 + Math.sin(a) * d * 0.8).toFixed(1)); p.style.opacity = (1 - e).toFixed(2); });
      ring.setAttribute('cx', padX); ring.setAttribute('cy', padY - 20); ring.setAttribute('r', (10 + e * 280).toFixed(1)); ring.style.opacity = e > 0 ? (1 - e) * 0.8 : 0;
      flash.style.opacity = e > 0 && e < 0.25 ? (0.55 * (1 - e / 0.25)).toFixed(2) : 0;
      boom.style.opacity = e > 0.1 ? clamp(1 - Math.max(0, e - 0.75) * 4, 0, 1).toFixed(2) : 0;
      car.g.style.opacity = q > 0.82 ? 0.0 : 1;
    } };
  };

  /* ---------- the bottom bar: a simple route line, one pin per stop ---------- */
  let cur = 0, busy = false, pending = null, streak = 0, lastGo = 0, route = null;
  let BX = null;

  const arrow = dir => {
    const s = sv('svg', { viewBox: '0 0 24 24', class: 'arrow', 'aria-hidden': 'true' });
    s.append(sv('path', { d: dir > 0 ? 'M4 12h15M13 5.5l6.5 6.5-6.5 6.5' : 'M20 12H5M11 5.5L4.5 12 11 18.5', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    return s;
  };
  const routeSvg = sv('svg', { class: 'track-svg', 'aria-hidden': 'true', focusable: 'false' });
  const stBtns = STAGES.map((s, i) => h('button', { class: 'st', type: 'button', 'aria-label': 'Go to ' + s.nav + ', ' + s.place, onclick: () => go(i) },
    h('span', null, h('b', { text: s.nav }), h('i', { text: s.place }))));
  const prevBtn = h('button', { class: 'pbtn prev', type: 'button', 'aria-label': 'Previous stop', onclick: () => go(step(-1)) }, arrow(-1));
  const nextBtn = h('button', { class: 'pbtn next', type: 'button', onclick: () => go(step(1) <= LAST ? step(1) : 0) }, arrow(1));
  const hud = h('div', { class: 'hud', 'aria-hidden': 'true' },
    h('div', { class: 'wide' }, h('small', { id: 'hMode', text: 'Pipeline' }), h('b', { id: 'hRoute', text: '' })),
    h('div', null, h('small', { text: 'Records' }), h('b', { id: 'hKm', text: '0' })),
    h('div', null, h('small', { text: 'Status' }), h('b', { id: 'hSpd', text: 'OK' })));
  bar.append(routeSvg, ...stBtns, prevBtn, nextBtn);
  document.body.append(hud);

  function layoutBar() {
    const W = bar.clientWidth, H = bar.clientHeight;
    if (!W || !H) return;
    const padX = W < 640 ? 62 : 110, y = H * 0.36;
    const xs = STAGES.map((_, i) => padX + i * (W - 2 * padX) / LAST);
    routeSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    routeSvg.replaceChildren();
    const prog = LN(xs[0], y, xs[0], y, COL.gr, 4, { id: 'prog' });
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

  /* ---------- the scene overlay ---------- */
  const ride = $('#ride'), rideSvg = $('#rideSvg');
  const LEGS = [
    { name: 'Ingest', note: 'database, API and files', rows: 48200 },
    { name: 'SQL transform', note: 'join, filter, group', rows: 31750 },
    { name: 'Lakehouse', note: 'bronze, silver, gold', rows: 29400 },
    { name: 'Quality checks', note: 'quarantine bad rows', rows: 29388 },
    { name: 'AI retrieval', note: 'robots fetch the right tables', rows: 1204 },
    { name: 'Deploy', note: 'resume and projects shipped', rows: 7 }
  ];

  function drawScene(k) {
    const r = ride.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const vw = r.width < 700 ? 560 : 1000, VH = clamp(vw * r.height / r.width, 420, 1100), GY = VH * 0.8;
    rideSvg.setAttribute('viewBox', '0 0 ' + vw + ' ' + VH.toFixed(1));
    rideSvg.replaceChildren();
    const defs = sv('defs'), bg = sv('linearGradient', { id: 'dbg', x1: 0, y1: 0, x2: 0, y2: 1 });
    [['0', '#050b14'], ['1', '#0c1d30']].forEach(([o, c]) => bg.append(sv('stop', { offset: o, 'stop-color': c })));
    const pat = sv('pattern', { id: 'grid', width: 80, height: 80, patternUnits: 'userSpaceOnUse' });
    pat.append(sv('path', { d: 'M80 0H0V80', fill: 'none', stroke: 'rgba(80,140,190,.12)', 'stroke-width': 1 }));
    defs.append(bg, pat);
    const grid = G(null, R(-200, 0, vw + 400 + 160, VH, 'url(#grid)'));
    const world = G(), screen = G();
    const sc = SCENES[k]({ world, screen, GY, vw, VH });
    rideSvg.append(defs, R(0, 0, vw, VH, 'url(#dbg)'), grid, world, screen);
    return { grid, world, sc, camE: WL - vw, k };
  }

  function renderScene(s, q, t) {
    const cam = s.camE * q;
    s.world.setAttribute('transform', 'translate(' + (-cam).toFixed(1) + ' 0)');
    s.grid.setAttribute('transform', 'translate(' + (-(cam * 0.4) % 80).toFixed(1) + ' 0)');
    s.sc.update(q, t);
  }

  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  function playTrip(from, to, onMid, speedUp) {
    return new Promise(resolve => {
      const dir = to > from ? 1 : -1, seq = [];
      if (dir > 0) for (let k = from; k < to; k++) seq.push(k); else for (let k = from - 1; k >= to; k--) seq.push(k);
      const n = seq.length, per = (n <= 1 ? 4200 : n <= 3 ? 3000 : 2000) * speedUp, total = per * n;
      let scene = null, lastLeg = -1, swapped = false;
      ride.classList.add('on');
      const t0 = performance.now();
      const frame = now => {
        const e = Math.max(0, now - t0), i = Math.min(n - 1, Math.floor(e / per)), lt = clamp((e - i * per) / per, 0, 1);
        if (i !== lastLeg) { lastLeg = i; scene = drawScene(seq[i]); emit('coaster:leg', { leg: seq[i], dir }); }
        if (!scene) { onMid(); ride.classList.remove('on'); resolve(); return; }
        const q = dir > 0 ? lt : 1 - lt;               // going back plays the scene in reverse
        renderScene(scene, q, now);
        setProg(BX ? BX.xs[from] + (BX.xs[to] - BX.xs[from]) * clamp(e / total, 0, 1) : 0);
        emit('coaster:ride', { leg: seq[i], q: lt, t: now, dir });
        if (!swapped && e / total >= 0.55) { swapped = true; onMid(); }
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
    const speedUp = Math.pow(0.8, streak);
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

  // pipeline monitor: which stage, how many records
  let hudHide = 0;
  window.addEventListener('coaster:start', () => { clearTimeout(hudHide); hud.classList.add('on'); });
  window.addEventListener('coaster:leg', e => { const L = LEGS[e.detail.leg]; $('#hMode').textContent = 'Stage: ' + L.name; $('#hRoute').textContent = L.note; });
  window.addEventListener('coaster:ride', e => {
    const L = LEGS[e.detail.leg], p = e.detail.dir > 0 ? e.detail.q : 1 - e.detail.q;
    $('#hKm').textContent = Math.round(L.rows * clamp(p, 0, 1)).toLocaleString();
    $('#hSpd').textContent = p > 0.97 ? 'DONE' : 'RUNNING';
  });
  window.addEventListener('coaster:end', () => { $('#hSpd').textContent = 'OK'; hudHide = setTimeout(() => { if (!busy) hud.classList.remove('on'); }, 900); });

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
