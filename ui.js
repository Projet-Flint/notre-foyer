// Briques visuelles, effets (goutte d'eau, impulsion, confettis, vibration) et fenêtres.
'use strict';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Icônes (traits, façon SF Symbols) ----------
const ICONS = {
  house: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5.4"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  message: '<path d="M4 5h16v11H8l-4 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  location: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  fork: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1.3-3.5 4-3.5 7.5V13H17"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H6.3"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pause: '<rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 19h16"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 19h16"/>',
  scale: '<path d="M12 4v16M5 20h14M4 8h16M6.5 8 4 14a3 3 0 0 0 5 0L6.5 8zM17.5 8 15 14a3 3 0 0 0 5 0l-2.5-6z"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-5.5-3.5-5.5-1S10 8 12 8zM12 8c1.5-3.5 5.5-3.5 5.5-1S14 8 12 8z"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  child: '<circle cx="8" cy="5" r="2.2"/><circle cx="16.5" cy="9" r="1.8"/><path d="M8 8v6M5 11h6M8 14l-2 6M8 14l2 6M16.5 12v4M16.5 16l-1.5 4M16.5 16l1.5 4M11 11l5.5 2"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.3 4-6.5 8-6.5s7.2 2.2 8 6.5"/>',
  personplus: '<circle cx="10" cy="8" r="4"/><path d="M2.5 21c.8-4.3 3.8-6.5 7.5-6.5 1.7 0 3.2.4 4.5 1.3M18 13v7M14.5 16.5h7"/>',
  note: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  hammer: '<path d="M14 6.5 9 4 6.5 6.5 9 9l-5.5 5.5a1.8 1.8 0 0 0 2.5 2.5L11.5 11.5 14 14l2.5-2.5z"/><path d="m14 6.5 2-2 3.5 3.5-2 2"/>',
  wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7zM4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  carrot: '<path d="M14.5 9.5 4 20c4 0 9-2 11.5-7.5"/><path d="M14.5 9.5c1.5-1 4-1 5.5 0M14.5 9.5c1-1.5 1-4 0-5.5M12 12l2 2M9 15l1.5 1.5"/>',
  cake: '<path d="M4 20h16v-7H4zM4 15.5c2 1 4 1 5.3 0 1.4 1 3.4 1 4.7 0 1.4 1 3.4 1 6 0M8 13V9.5M12 13V9.5M16 13V9.5"/><path d="M8 7.5v-.5M12 7.5v-.5M16 7.5v-.5"/>',
  fridge: '<rect x="5.5" y="2.5" width="13" height="19" rx="2"/><path d="M5.5 10h13M8.5 6v1.5M8.5 13v3"/>',
  fish: '<path d="M3 12c3-5 9-6.5 13-3l4-3v12l-4-3c-4 3.5-10 2-13-3z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bottle: '<path d="M10 2.5h4M10.5 2.5v3.5L8.5 9v11.5h7V9l-2-3V2.5M8.5 13h7"/>',
  snow: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  comb: '<path d="M3.5 9h17v3.5h-17zM6 12.5V19M9 12.5V19M12 12.5V19M15 12.5V19M18 12.5V19"/>',
  sparkle: '<path d="M12 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6zM18.5 15c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z"/>',
  stroller: '<path d="M4 5h2l2.5 9h9.5l2-6.5H8"/><path d="M12 7.5V3a6 6 0 0 1 6 4.5"/><circle cx="9" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
  basket: '<path d="M3 10h18l-2 10H5zM7.5 10 11 4M16.5 10 13 4M9 14v3M12 14v3M15 14v3"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.5v.5"/>',
};
function ic(name, size = 22, sw = 1.8) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// ---------- Composants ----------
function chip(name, attrs = '') {
  const c = H.color(name), photo = H.photo(name);
  return `<span class="chip" style="--pc:${c};${photo ? 'padding-left:10px' : ''}" ${attrs}>${photo ? `<img src="${photo}" alt="">` : ''}${esc(name)}</span>`;
}
function avatar(name, size = 44) {
  const c = H.color(name), photo = H.photo(name);
  const inner = photo ? `<img src="${photo}" alt="">` : esc((name || '?').charAt(0).toUpperCase());
  return `<span class="avatar sel" style="${selVars(c)};width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px">${inner}</span>`;
}
function initials(name, color = THEME.accent, size = 40) {
  const ini = (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return `<span class="avatar sel" style="${selVars(color)};width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;border-color:transparent">${esc(ini)}</span>`;
}
function checkBtn(done, action, id, extra = '') {
  return `<button class="check press ${done ? 'on' : ''}" data-a="${action}" data-id="${id}" ${extra} aria-label="${done ? 'Marquer à faire' : 'Marquer comme fait'}">${ic('check', 16, 3)}</button>`;
}
function section(header, body, footer, opts = {}) {
  return `<div class="sec">${header ? `<div class="sec-h">${header}</div>` : ''}${opts.bare ? body : `<div class="group glass">${body}</div>`}${footer ? `<div class="sec-f">${footer}</div>` : ''}</div>`;
}
/** Sélecteur en capsule de verre ; la pastille de couleur glisse d'un choix à l'autre. */
function switcher(items, current, action, opts = {}) {
  const color = opts.color || H.color(H.me);
  return `<div class="switcher glass ${opts.cls || ''}" data-switcher="${opts.key || action}" role="tablist">
    <span class="pill sel" style="${selVars(color)}"></span>
    ${items.map(it => { const v = Array.isArray(it) ? it[0] : it, l = Array.isArray(it) ? it[1] : it;
      return `<button role="tab" class="press ${v === current ? 'on' : ''}" aria-selected="${v === current}" data-a="${action}" data-v="${esc(v)}">${esc(l)}</button>`; }).join('')}
  </div>`;
}
const pillPos = {};
function placePills(root, animate) {
  root.querySelectorAll('[data-switcher]').forEach(sw => {
    const pill = sw.querySelector('.pill'), on = sw.querySelector('button.on');
    if (!pill) return;
    if (!on) { pill.style.opacity = 0; return; }
    const key = sw.dataset.switcher, left = on.offsetLeft, width = on.offsetWidth;
    const prev = pillPos[key];
    if (prev && animate !== false && (prev.left !== left || prev.width !== width)) {
      pill.style.transition = 'none'; pill.style.left = prev.left + 'px'; pill.style.width = prev.width + 'px';
      pill.offsetWidth; pill.style.transition = '';
    }
    pill.style.left = left + 'px'; pill.style.width = width + 'px';
    pillPos[key] = { left, width };
  });
}
function seg(name, options, current, colorFn) {
  return `<div class="seg ${colorFn ? 'color' : ''}" data-seg="${name}">${options.map(o => {
    const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
    return `<button type="button" class="${String(v) === String(current) ? 'on' : ''}" data-segv="${esc(v)}" ${colorFn ? `style="--pc:${colorFn(v)}"` : ''}>${esc(l)}</button>`;
  }).join('')}</div>`;
}
function toggleHtml(name, on) { return `<label class="toggle"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i></label>`; }
function swipeRow(content, actions, attrs = '') {
  return `<div class="swipe" ${attrs}><div class="acts">${actions.map(a =>
    `<button data-a="${a.a}" data-id="${a.id}" ${a.extra || ''} style="background:${a.color}">${ic(a.icon, 20)}<span>${esc(a.label)}</span></button>`).join('')}</div>
    <div class="content row">${content}</div></div>`;
}
const swipeDel = (a, id) => ({ a, id, icon: 'trash', label: 'Supprimer', color: '#E5484D' });
const swipeDone = (a, id, done, l1 = 'Fait', l2 = 'Rouvrir') => ({ a, id, icon: done ? 'undo' : 'check', label: done ? l2 : l1, color: THEME.accent });

// ---------- Vibration ----------
// Android : navigator.vibrate. iPhone (iOS 18 et plus) : un interrupteur caché donne un petit retour haptique.
let hapticLabel;
function haptic(kind) {
  try {
    if (navigator.vibrate) { navigator.vibrate(kind === 'success' ? [12, 60, 18] : 10); return; }
    if (!hapticLabel) {
      hapticLabel = document.createElement('label');
      hapticLabel.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0';
      hapticLabel.setAttribute('aria-hidden', 'true');
      hapticLabel.innerHTML = '<input type="checkbox" switch tabindex="-1">';
      document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
    if (kind === 'success') setTimeout(() => hapticLabel.click(), 90);
  } catch (e) { /* rien */ }
}

// ---------- Goutte d'eau ----------
function waterDrop(x, y) {
  const fx = document.getElementById('fx');
  const d = document.createElement('span');
  d.className = 'drop'; d.style.left = x + 'px'; d.style.top = y + 'px';
  d.innerHTML = '<i></i><i></i><b></b>';
  fx.appendChild(d);
  setTimeout(() => d.remove(), 950);
}

// ---------- Confettis ----------
function confetti() {
  const fx = document.getElementById('fx');
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1, W = innerWidth, Hh = innerHeight;
  cv.width = W * dpr; cv.height = Hh * dpr; fx.appendChild(cv);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const colors = [H.color(H.p1), H.color(H.p2), H.color(BOTH), THEME.accent, '#F5C542'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: (0.2 + Math.random() * .6) * W, vx: (Math.random() * 2 - 1) * 220, vy: -(380 + Math.random() * 380),
    spin: (Math.random() * 5 - 2.5), size: 7 + Math.random() * 5, color: colors[Math.floor(Math.random() * colors.length)], circle: Math.random() < .5,
  }));
  const dur = 2.6, t0 = performance.now();
  haptic('success');
  (function frame(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, Hh);
    if (t >= dur) { cv.remove(); return; }
    ctx.globalAlpha = Math.max(0, Math.min(1, (dur - t) / .6));
    for (const p of pieces) {
      const x = p.x + p.vx * t, y = Hh * .35 + p.vy * t + 900 * t * t / 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.spin * t * 2 * Math.PI); ctx.fillStyle = p.color;
      if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })(t0);
}

// ---------- Message bref ----------
let toastTimer;
function toast(text) {
  const el = document.getElementById('toast');
  el.innerHTML = `<span style="color:var(--accent)">${ic('check', 18, 2.4)}</span><span>${esc(text)}</span>`;
  el.classList.remove('show'); el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- Fenêtres : feuille, menu, boîte de dialogue ----------
const layerStack = [];
function openLayer(html, onMount) {
  const layer = document.getElementById('layer');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0';
  wrap.innerHTML = `<div class="backdrop" data-close></div>${html}`;
  layer.appendChild(wrap);
  layer.style.pointerEvents = 'auto';
  layerStack.push(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('layer-in')));
  wrap.querySelector('.backdrop').addEventListener('click', () => closeLayer(wrap));
  if (onMount) onMount(wrap);
  return wrap;
}
function closeLayer(wrap) {
  wrap = wrap || layerStack[layerStack.length - 1];
  if (!wrap || wrap._closing) return;
  wrap._closing = true;
  const i = layerStack.indexOf(wrap); if (i >= 0) layerStack.splice(i, 1);
  wrap.classList.remove('layer-in');
  if (document.activeElement && wrap.contains(document.activeElement)) document.activeElement.blur();
  setTimeout(() => { wrap.remove(); if (!layerStack.length) document.getElementById('layer').style.pointerEvents = 'none'; }, 420);
}

/**
 * Feuille modale façon iOS : Annuler à gauche, action principale à droite.
 * opts : { title, body, ok, cancel, onOk(root) -> false pour garder ouvert, full, onMount(root) }
 */
function sheet(opts) {
  const html = `<div class="sheet ${opts.full ? 'full' : ''}" role="dialog" aria-label="${esc(opts.title)}">
    <div class="grab"></div>
    <div class="bar-top"><button data-sheet-cancel>${esc(opts.cancel || 'Annuler')}</button><h2>${esc(opts.title)}</h2>
    ${opts.ok ? `<button class="ok" data-sheet-ok>${esc(opts.ok)}</button>` : '<span style="min-width:72px"></span>'}</div>
    <div class="body">${opts.body}</div></div>`;
  return openLayer(html, root => {
    const okBtn = root.querySelector('[data-sheet-ok]');
    const check = () => {
      if (!okBtn) return;
      const req = [...root.querySelectorAll('[data-required]')];
      okBtn.disabled = req.some(i => !i.value.trim());
    };
    root.addEventListener('input', check); check();
    root.querySelector('[data-sheet-cancel]').addEventListener('click', () => { if (opts.onCancel) opts.onCancel(root); closeLayer(root); });
    if (okBtn) okBtn.addEventListener('click', () => {
      if (okBtn.disabled) return;
      haptic();
      if (opts.onOk(root) !== false) closeLayer(root);
    });
    root.querySelectorAll('.seg').forEach(s => s.addEventListener('click', e => {
      const b = e.target.closest('button[data-segv]'); if (!b) return;
      s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); haptic();
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    root.querySelectorAll('input[type=text],input:not([type]),textarea').forEach(i => i.addEventListener('keydown', e => {
      if (e.key === 'Enter' && i.tagName !== 'TEXTAREA' && okBtn && !okBtn.disabled) { e.preventDefault(); okBtn.click(); }
    }));
    sheetSwipeDown(root);
    if (opts.onMount) opts.onMount(root);
    const first = root.querySelector('[autofocus]');
    if (first) setTimeout(() => first.focus(), 350);
  });
}
function segVal(root, name) { const b = root.querySelector(`[data-seg="${name}"] button.on`); return b ? b.dataset.segv : null; }
function val(root, name) { const el = root.querySelector(`[name="${name}"]`); if (!el) return null; return el.type === 'checkbox' ? el.checked : el.value.trim(); }

function sheetSwipeDown(root) {
  const sh = root.querySelector('.sheet'); if (!sh) return;
  const grabZone = sh.querySelector('.bar-top'), grab = sh.querySelector('.grab');
  let y0 = null, dy = 0;
  const start = e => { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; };
  const move = e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
  const end = () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 110) closeLayer(root); y0 = null; };
  [grabZone, grab].forEach(z => { z.addEventListener('touchstart', start, { passive: true }); z.addEventListener('touchmove', move, { passive: true }); z.addEventListener('touchend', end); });
}

/** Menu d'actions (comme un appui long sur iPhone). options : [{label, fn, danger}] */
function menu(title, options) {
  const html = `<div class="menu"><div class="group">${title ? `<div class="title">${esc(title)}</div>` : ''}
    ${options.map((o, i) => `<button data-mi="${i}" class="${o.danger ? 'danger' : ''}" ${o.style ? `style="${o.style}"` : ''}>${o.icon ? ic(o.icon, 20) : ''}${esc(o.label)}</button>`).join('')}</div>
    <div class="group"><button class="cancel" data-mi="x">Annuler</button></div></div>`;
  openLayer(html, root => {
    root.querySelector('.menu').addEventListener('click', e => {
      const b = e.target.closest('[data-mi]'); if (!b) return;
      closeLayer(root);
      if (b.dataset.mi !== 'x') { haptic(); options[+b.dataset.mi].fn(); }
    });
  });
}
/** Petite boîte avec un champ texte, ou une simple confirmation. */
function dialog({ title, text, placeholder, value, ok = 'OK', danger, onOk }) {
  const html = `<div class="dialog" role="alertdialog"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}
    ${placeholder != null ? `<input type="text" placeholder="${esc(placeholder)}" value="${esc(value || '')}">` : '<div style="height:8px"></div>'}
    <div class="acts"><button data-d="0">Annuler</button><button data-d="1" class="${danger ? 'danger' : ''}">${esc(ok)}</button></div></div>`;
  openLayer(html, root => {
    const input = root.querySelector('input');
    if (input) setTimeout(() => input.focus(), 300);
    const go = () => { closeLayer(root); onOk(input ? input.value.trim() : true); };
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    root.querySelector('.dialog').addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (!b) return;
      if (b.dataset.d === '1') go(); else closeLayer(root);
    });
  });
}

// ---------- Fichiers ----------
function pickFile(accept, multiple) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept; if (multiple) input.multiple = true;
    input.style.display = 'none'; document.body.appendChild(input);
    input.addEventListener('change', () => { resolve([...input.files]); input.remove(); });
    input.click();
  });
}
/** Réduit une photo (carrée si `square`) et la renvoie en texte, pour la ranger dans le téléphone. */
function shrinkImage(file, max = 160, square = true, quality = .8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height, sx = 0, sy = 0, sw = w, sh = h;
      if (square) { const m = Math.min(w, h); sx = (w - m) / 2; sy = (h - m) / 2; sw = sh = m; w = h = max; }
      else { const r = Math.min(1, max / Math.max(w, h)); w = Math.round(w * r); h = Math.round(h * r); }
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject; img.src = url;
  });
}
function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(() => {});
    return;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function shareText(title, text) {
  if (navigator.share) navigator.share({ title, text }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Copié, collez-le dans un message'));
}
/** Fichier calendrier (.ics) : l'iPhone propose de l'ajouter à l'app Calendrier, avec son rappel. */
function icsFor({ title, start, allDay, location, yearly, alarmDaysBefore }) {
  const d = new Date(start);
  const f = x => x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z';
  const fd = x => x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Notre Foyer//FR', 'BEGIN:VEVENT', 'UID:' + uid() + '@notrefoyer',
    'DTSTAMP:' + f(new Date()), 'SUMMARY:' + title.replace(/[,;]/g, ' ')];
  if (allDay) { lines.push('DTSTART;VALUE=DATE:' + fd(d), 'DTEND;VALUE=DATE:' + fd(addDays(d, 1))); }
  else { lines.push('DTSTART:' + f(d), 'DTEND:' + f(new Date(+d + 3600000))); }
  if (location) lines.push('LOCATION:' + location.replace(/[,;]/g, ' '));
  if (yearly) lines.push('RRULE:FREQ=YEARLY');
  if (alarmDaysBefore != null) {
    const trig = allDay ? `-P${alarmDaysBefore}DT0H` : `-P${alarmDaysBefore}D`;
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'TRIGGER:' + (allDay ? (alarmDaysBefore ? `-P${alarmDaysBefore - 1}DT15H` : 'PT9H') : trig), 'END:VALARM');
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
