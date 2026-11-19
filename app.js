// Assemblage : onglets, rendu, gestes (glisser, appui long), effets au toucher.
'use strict';

const TABS = [['accueil', 'Accueil', 'house'], ['famille', 'Famille', 'people'], ['finances', 'Finances', 'card'], ['travail', 'Travail', 'briefcase'], ['projets', 'Projets', 'flag']];
const main = document.getElementById('main'), tabbar = document.getElementById('tabbar');

// ---------- Thème et fond ----------
function applyTheme() {
  const t = S.settings.theme || 'auto';
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  paintBackground();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
function paintBackground() {
  const h = new Date().getHours(), dark = document.documentElement.dataset.theme === 'dark';
  const p = h >= 5 && h < 11 ? ['#E8F0F2', '#0A1114', ['#5CC3AC', '#7FA6F0', '#9FD3F0', '#B39CF0']]
    : h >= 11 && h < 17 ? ['#E9EFED', '#0B110F', ['#5CC3AC', '#7FA6F0', '#F0957C', '#B39CF0']]
    : h >= 17 && h < 22 ? ['#F1ECE7', '#130F0D', ['#F0B27C', '#F0957C', '#E88FB0', '#B39CF0']]
    : ['#E6E8F0', '#090B12', ['#4F7FB8', '#7B6BD0', '#3E9C8C', '#9C7BD8']];
  const base = dark ? p[1] : p[0];
  document.documentElement.style.setProperty('--base', base);
  document.querySelectorAll('#bg i').forEach((b, i) => b.style.background = p[2][i]);
  document.querySelectorAll('meta[name=theme-color]').forEach(m => m.setAttribute('content', base));
}
setInterval(paintBackground, 300000);

// ---------- Rendu ----------
const scrollMemo = {};
function screenKey() { return UI.view ? UI.view.name + ':' + (UI.view.id || '') : UI.tab + ':' + (UI.tab === 'travail' ? UI.work + UI.nseg + jobOf(H.me) : ''); }
function render(opts = {}) {
  // garder la position de défilement de chaque écran
  const prevKey = main.dataset.key;
  main.querySelectorAll('.scroll').forEach((s, i) => { scrollMemo[prevKey + '#' + (s.closest('[data-page]') ? s.closest('[data-page]').dataset.page : i)] = s.scrollTop; });
  const key = screenKey();
  const myColor = H.color(H.me);
  document.documentElement.style.setProperty('--me', myColor);
  let html;
  if (UI.view) {
    html = { reglages: viewReglages, eleve: viewEleve, bilan: viewBilan, types: viewTypes, projet: viewProjet, shifts: viewShifts }[UI.view.name]();
  } else {
    html = { accueil: screenAccueil, famille: screenFamille, finances: screenFinances, travail: screenTravail, projets: screenProjets }[UI.tab]();
  }
  main.innerHTML = html;
  main.dataset.key = key;
  if (prevKey !== key && !opts.keepAnim) main.firstElementChild && main.firstElementChild.classList.add('fadein');
  main.querySelectorAll('.scroll').forEach((s, i) => { const v = scrollMemo[key + '#' + (s.closest('[data-page]') ? s.closest('[data-page]').dataset.page : i)]; if (v) s.scrollTop = v; });
  placePills(main);
  renderTabbar();
}
function renderTabbar() {
  const active = UI.tab, c = H.color(H.me);
  tabbar.className = 'glass';
  tabbar.innerHTML = `<span class="pill sel" style="${selVars(c)}"></span>` + TABS.map(([k, l, i]) =>
    `<button class="press halo ${k === active ? 'on' : ''}" data-a="tab" data-v="${k}" aria-label="${l}" aria-selected="${k === active}">${ic(i, 22, k === active ? 2 : 1.7)}<span>${l}</span></button>`).join('');
  const on = tabbar.querySelector('button.on'), pill = tabbar.querySelector('.pill');
  const prev = pillPos.tabbar;
  if (prev) { pill.style.transition = 'none'; pill.style.left = prev.left + 'px'; pill.style.width = prev.width + 'px'; pill.offsetWidth; pill.style.transition = ''; }
  pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px';
  pillPos.tabbar = { left: on.offsetLeft, width: on.offsetWidth };
}
A.tab = d => {
  if (UI.tab === d.v && !UI.view) { const s = main.querySelector('.page[data-page="' + UI.section + '"] .scroll') || main.querySelector('.scroll'); if (s) s.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  UI.tab = d.v; UI.view = null; render();
};
addEventListener('resize', () => { placePills(main, false); renderTabbar(); });

// ---------- Toucher : effets ----------
const PRESSABLE = 'button, a, .press, [data-a], .row[data-long], .swipe .content';
let pressEl = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest(PRESSABLE);
  if (!el || el.closest('#layer .field') && el.tagName === 'INPUT') return;
  waterDrop(e.clientX, e.clientY);
  const target = el.closest('.press') || (el.matches('button, a') ? el : null);
  if (target && !target.closest('.swipe .content') ) { pressEl = target; target.classList.add('press', 'pressing'); }
}, { passive: true });
const endPress = () => {
  if (!pressEl) return;
  const el = pressEl; pressEl = null;
  el.classList.remove('pressing', 'bounce'); el.offsetWidth; el.classList.add('bounce');
  setTimeout(() => el.classList.remove('bounce'), 520);
};
document.addEventListener('pointerup', endPress, { passive: true });
document.addEventListener('pointercancel', () => { if (pressEl) { pressEl.classList.remove('pressing'); pressEl = null; } }, { passive: true });

// ---------- Clics (actions) ----------
let suppressClick = false;
document.addEventListener('click', e => {
  if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
  const sw = e.target.closest('.swipe.open');
  if (sw && e.target.closest('.content')) { closeSwipes(); e.preventDefault(); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.closest('.sheet')) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  if (!(el.tagName === 'INPUT')) haptic();
  if (el.closest('.swipe .acts')) closeSwipes(true);
  fn(el.dataset, el, e);
}, true);

// ---------- Appui long ----------
let longTimer = null, longStart = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-long]'); if (!el || e.target.closest('.check, .acts, a, input')) return;
  longStart = { x: e.clientX, y: e.clientY };
  clearTimeout(longTimer);
  longTimer = setTimeout(() => {
    longTimer = null; suppressClick = true; setTimeout(() => { suppressClick = false; }, 600);
    haptic(); const fn = A[el.dataset.long]; if (fn) fn(el.dataset, el);
  }, 480);
}, { passive: true });
document.addEventListener('pointermove', e => { if (longTimer && longStart && Math.hypot(e.clientX - longStart.x, e.clientY - longStart.y) > 8) { clearTimeout(longTimer); longTimer = null; } }, { passive: true });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { clearTimeout(longTimer); longTimer = null; }, { passive: true }));
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-long]')) e.preventDefault(); });

// ---------- Glisser : lignes, pages de Famille, barre d'onglets ----------
function closeSwipes(now) {
  document.querySelectorAll('.swipe.open').forEach(s => { s.classList.remove('open'); s.querySelector('.content').style.transform = ''; });
}
let drag = null;
document.addEventListener('touchstart', e => {
  if (e.touches.length !== 1 || e.target.closest('#layer')) return;
  const t = e.touches[0];
  const row = e.target.closest('.swipe'), pager = e.target.closest('[data-pager]');
  drag = { x0: t.clientX, y0: t.clientY, row, pager, mode: null, dx: 0 };
  if (row && !row.classList.contains('open')) closeSwipes();
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!drag) return;
  const t = e.touches[0], dx = t.clientX - drag.x0, dy = t.clientY - drag.y0;
  if (!drag.mode) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dy) > Math.abs(dx)) { drag.mode = 'scroll'; return; }
    const rowOpen = drag.row && drag.row.classList.contains('open');
    if (drag.row && (dx < 0 || rowOpen)) {
      drag.mode = 'row'; drag.content = drag.row.querySelector('.content');
      drag.width = drag.row.querySelector('.acts').offsetWidth; drag.base = rowOpen ? -drag.width : 0;
      drag.row.classList.add('dragging');
    } else if (drag.pager) {
      drag.mode = 'page'; drag.pages = drag.pager.querySelector('.pages'); drag.w = drag.pager.offsetWidth; drag.idx = SECTIONS.indexOf(UI.section);
      drag.pages.classList.add('dragging');
    } else { drag.mode = 'none'; }
    clearTimeout(longTimer); longTimer = null;
  }
  drag.dx = dx;
  if (drag.mode === 'row') {
    let x = drag.base + dx; if (x > 0) x = x / 4; if (x < -drag.width) x = -drag.width + (x + drag.width) / 4;
    drag.content.style.transform = `translateX(${x}px)`;
  } else if (drag.mode === 'page') {
    let off = dx; if ((drag.idx === 0 && dx > 0) || (drag.idx === SECTIONS.length - 1 && dx < 0)) off = dx / 3;
    drag.pages.style.transform = `translateX(calc(${-drag.idx * 100}% + ${off}px))`;
  }
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.mode === 'row') {
    d.row.classList.remove('dragging');
    const x = d.base + d.dx;
    if (x < -d.width / 2) { d.row.classList.add('open'); d.content.style.transform = `translateX(${-d.width}px)`; haptic(); }
    else { d.row.classList.remove('open'); d.content.style.transform = ''; }
    suppressClick = Math.abs(d.dx) > 8; setTimeout(() => { suppressClick = false; }, 50);
  } else if (d.mode === 'page') {
    d.pages.classList.remove('dragging');
    let idx = d.idx;
    if (d.dx < -d.w * .22 && idx < SECTIONS.length - 1) idx++;
    else if (d.dx > d.w * .22 && idx > 0) idx--;
    d.pages.style.transform = `translateX(${-idx * 100}%)`;
    if (idx !== d.idx) { UI.section = SECTIONS[idx]; haptic(); setTimeout(() => render({ keepAnim: true }), 320); }
  }
});

// Barre d'onglets : on peut glisser le doigt le long, la pastille suit.
tabbar.addEventListener('touchmove', e => {
  const t = e.touches[0], r = tabbar.getBoundingClientRect();
  const i = Math.max(0, Math.min(TABS.length - 1, Math.floor((t.clientX - r.left - 5) / ((r.width - 10) / TABS.length))));
  if (TABS[i][0] !== UI.tab) { UI.tab = TABS[i][0]; UI.view = null; haptic(); render(); }
}, { passive: true });

// ---------- Minuteur du travail : rafraîchir l'affichage ----------
setInterval(() => { if (S.work.running && UI.tab === 'travail' && !UI.view && UI.work === "Aujourd'hui" && !layerStack.length && !document.activeElement.matches('input,textarea')) render({ keepAnim: true }); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { applyAutoSavings(); paintBackground(); if (!layerStack.length) render({ keepAnim: true }); } });

// ---------- Démarrage ----------
applyTheme();
applyAutoSavings();
render();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
