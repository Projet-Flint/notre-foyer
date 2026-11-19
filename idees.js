// Recherche dans toute l'app, récap de la semaine, et courses à la dictée.
'use strict';

// ================= Recherche =================

/** Tous les éléments où l'on peut chercher : { cat, icon, title, sub, go } */
function searchIndex() {
  const out = [], add = (cat, icon, title, sub, text, go) => out.push({ cat, icon, title, sub, text: fold([title, sub, text].join(' ')), go });
  const famille = (section, extra) => () => { UI.tab = 'famille'; UI.section = section; UI.view = null; if (extra) extra(); render(); };
  for (const e of S.events) { const k = e.start.slice(0, 10);
    add('Agenda', 'calendar', e.title, cap(parseKey(k).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) + (e.allDay ? '' : ' · ' + e.start.slice(11, 16)), e.location, famille('Agenda', () => { UI.day = k; })); }
  for (const x of S.shopping) add('Courses', 'cart', x.title, x.done ? 'Dans le panier' : 'À acheter', '', famille('Courses'));
  for (const k in S.meals) { const m = S.meals[k]; if (m && (m.title || m.ingredients)) add('Repas', 'fork', m.title || 'Repas', cap(parseKey(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })), m.ingredients, () => A.openMeals()); }
  for (const c of S.chores) if (!c.done) add('Tâches', 'check', c.title, c.who + (c.due ? ' · ' + parseKey(c.due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''), '', famille('Tâches'));
  for (const d of S.dates) add('Dates', 'gift', d.title, d.kind + ' · ' + parseKey(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }), '', famille('Dates'));
  for (const m of S.maison) if (!m.done) add('Maison', 'house', m.title, m.notebook, m.notes || m.link || '', famille('Maison', () => { UI.notebook = m.notebook; }));
  for (const c of S.contacts) add('Contacts', 'person', c.name, [c.role, c.phone].filter(Boolean).join(' · '), c.email, () => { famille('Contacts')(); A.contactEdit({ id: c.id }); });
  for (const s of S.work.students) add('Élèves', 'person', s.name, s.info || 'Élève', '', () => { UI.tab = 'travail'; UI.view = { name: 'eleve', id: s.id }; render(); });
  for (const n of S.work.notes) add('Notes de travail', 'note', n.title || 'Note', (n.body || '').slice(0, 60), n.body, () => { UI.tab = 'travail'; UI.work = 'Notes'; UI.nseg = 'Notes'; UI.view = null; render(); });
  for (const p of S.projects) add('Projets', 'flag', p.name, p.deadline ? 'Pour le ' + parseKey(p.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Projet', (p.steps || []).map(s => s.title).join(' '), () => A.openProject({ id: p.id }));
  for (const e of S.fin.expenses) add('Dépenses', 'card', e.label || e.cat, eur(e.amount) + ' · ' + parseKey(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), e.cat, () => { UI.tab = 'finances'; UI.finMonth = e.date; UI.view = null; render(); });
  return out;
}
A.openSearch = () => {
  let results = [];
  sheet({ title: 'Rechercher', cancel: 'Fermer', full: true,
    body: `<div class="group glass"><div class="row"><span style="color:var(--text2)">${ic('search', 20)}</span><input class="plain" id="q" type="search" placeholder="Courses, rendez-vous, contact, note…" autocomplete="off" enterkeyhint="search"></div></div>
      <div id="qres" style="margin-top:14px"><div class="hint">Cherchez dans l'agenda, les courses, les repas, les tâches, les dates, la maison, les contacts, le travail, les projets et les dépenses.</div></div>`,
    onMount: root => {
      const q = root.querySelector('#q'), box = root.querySelector('#qres'), idx = searchIndex();
      setTimeout(() => q.focus(), 350);
      q.addEventListener('input', () => {
        const words = fold(q.value).split(/\s+/).filter(Boolean);
        if (!words.length) { box.innerHTML = '<div class="hint">Tapez quelques lettres.</div>'; return; }
        results = idx.filter(x => words.every(w => x.text.includes(w))).slice(0, 60);
        if (!results.length) { box.innerHTML = `<div class="glass card empty">Rien trouvé pour « ${esc(q.value)} ».</div>`; return; }
        const groups = {}; results.forEach((r, i) => (groups[r.cat] = groups[r.cat] || []).push([r, i]));
        box.innerHTML = Object.entries(groups).map(([cat, list]) => section(esc(cat), list.map(([r, i]) =>
          `<button class="row press" data-r="${i}" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic(r.icon, 20)}</span><div class="main"><div class="t">${esc(r.title)}</div>${r.sub ? `<div class="s">${esc(r.sub)}</div>` : ''}</div><span style="color:var(--text3)">${ic('chev', 16)}</span></button>`).join(''))).join('');
      });
      box.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; const r = results[+b.dataset.r]; closeLayer(root); haptic(); setTimeout(r.go, 200); });
    } });
};

// ================= Récap de la semaine =================
function weekRecap(ref = new Date()) {
  const today = startOfDay(ref), from = addDays(today, -6), to = addDays(today, 1), next = addDays(today, 8);
  const inPast = t => t >= +from && t < +to;
  const r = { from, today, next };
  r.chores = [H.p1, H.p2].map(n => ({ n, done: S.chores.filter(c => c.done && c.who === n && inPast(c.doneAt || 0)).length }));
  r.choresBoth = S.chores.filter(c => c.done && c.who === BOTH && inPast(c.doneAt || 0)).length;
  r.bought = S.shopping.filter(x => x.done && inPast(x.doneAt || 0)).length;
  r.toBuy = S.shopping.filter(x => !x.done).length;
  r.spent = S.fin.expenses.filter(e => { const t = +parseKey(e.date); return inPast(t) && e.scope !== 'Perso'; }).reduce((s, e) => s + e.amount, 0);
  const [ma] = monthRange(today), spentMonth = expensesOf(today, 'Commun').reduce((s, e) => s + e.amount, 0);
  r.budgetLeft = S.fin.budget > 0 ? S.fin.budget - spentMonth : null;
  r.work = [H.p1, H.p2].map(n => {
    const job = jobOf(n);
    if (job === 'infirmier' && S.nurse) { let h = 0, g = 0, up = [];
      for (let d = new Date(from); d < next; d = addDays(d, 1)) { const s = shiftOn(dkey(d)); if (!s || !s.work) continue;
        if (d < to) { g++; h += shiftHours(s); } else up.push(cap(d.toLocaleDateString('fr-FR', { weekday: 'short' })) + ' ' + s.code); }
      return { n, line: `${g} garde${g > 1 ? 's' : ''} · ${hoursLabel(h)}`, next: up.length ? up.join(', ') : 'Aucune garde prévue' }; }
    if (job === 'cours' && n === H.me) { const st = lessonStats(lessonsBetween(from, to)), nx = lessonStats(lessonsBetween(to, next));
      return { n, line: `${st.n} leçon${st.n > 1 ? 's' : ''} · ${hoursLabel(st.h)} · ${eur(Math.round(st.e))}`, next: nx.n ? `${nx.n} leçon${nx.n > 1 ? 's' : ''} prévue${nx.n > 1 ? 's' : ''}` : 'Rien de prévu' }; }
    return null;
  }).filter(Boolean);
  r.events = S.events.filter(e => { const d = parseKey(e.start.slice(0, 10)); return d >= to && d < next; }).sort((a, b) => a.start.localeCompare(b.start));
  r.meals = Array.from({ length: 7 }, (_, i) => addDays(to, i)).filter(d => S.meals[dkey(d)] && S.meals[dkey(d)].title).length;
  r.dates = S.dates.map(d => ({ d, n: nextOccurrence(d.date) })).filter(x => x.n >= to && x.n < next);
  r.choresNext = S.chores.filter(c => !c.done && c.due && c.due < dkey(next)).length;
  return r;
}
const showRecapCard = () => [0, 1].includes(new Date().getDay()) || (new Date().getDay() === 6 && new Date().getHours() >= 18);
function recapCardHtml() {
  const big = showRecapCard();
  return big
    ? `<div class="sec"><button class="glass card press recapcard" data-a="openRecap" style="width:100%;text-align:left;padding:14px 16px;display:flex;gap:12px;align-items:center">
        <span class="recapico">${ic('star', 22)}</span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px">Récap de la semaine</div><div class="lbl" style="font-size:13px">Ce que vous avez fait, et ce qui arrive</div></div>${ic('chev', 18)}</button></div>`
    : `<div class="sec" style="text-align:center"><button class="lbl press" data-a="openRecap" style="font-weight:600;color:var(--accent);padding:8px">Voir le récap de la semaine</button></div>`;
}
A.openRecap = () => {
  const r = weekRecap(), d = x => x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const tot = r.chores.reduce((s, c) => s + c.done, 0) + r.choresBoth;
  const row = (icon, t, s, color = 'var(--accent)') => `<div class="row"><span style="color:${color}">${ic(icon, 20)}</span><div class="main"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div></div>`;
  const past = [
    row('check', `${tot} tâche${tot > 1 ? 's' : ''} faite${tot > 1 ? 's' : ''}`, r.chores.map(c => `${esc(c.n)} : ${c.done}`).join(' · ') + (r.choresBoth ? ` · ensemble : ${r.choresBoth}` : '')),
    row('cart', `${r.bought} article${r.bought > 1 ? 's' : ''} acheté${r.bought > 1 ? 's' : ''}`, r.toBuy ? `${r.toBuy} encore sur la liste` : 'La liste est vide'),
    row('card', `${eur(Math.round(r.spent))} dépensés`, r.budgetLeft != null ? `Il reste ${eur(Math.round(r.budgetLeft))} dans le budget du mois` : ''),
    ...r.work.map(w => row('briefcase', esc(w.n), esc(w.line), H.color(w.n))),
  ].join('');
  const upcoming = [
    row('calendar', `${r.events.length} rendez-vous`, r.events.slice(0, 4).map(e => esc(cap(parseKey(e.start.slice(0, 10)).toLocaleDateString('fr-FR', { weekday: 'short' })) + ' ' + e.title)).join(' · ')),
    ...r.work.map(w => row('briefcase', esc(w.n), esc(w.next), H.color(w.n))),
    row('fork', `${r.meals} repas sur 7 prévus`, r.meals < 7 ? 'Touchez « Repas de la semaine » dans Courses pour compléter' : 'Toute la semaine est prévue'),
    row('check', `${r.choresNext} tâche${r.choresNext > 1 ? 's' : ''} à faire`, ''),
    ...r.dates.map(x => row('gift', esc(x.d.title), esc(x.d.kind + ' · ' + d(x.n)), 'var(--orange)')),
  ].join('');
  const winner = r.chores[0].done === r.chores[1].done ? null : r.chores[0].done > r.chores[1].done ? r.chores[0].n : r.chores[1].n;
  sheet({ title: 'Récap de la semaine', cancel: 'Fermer', ok: 'Partager',
    body: `<div class="hint" style="margin:0 4px 10px">Du ${d(r.from)} au ${d(r.today)}${winner && tot >= 3 ? ` · Bravo ${esc(winner)}, champion${winner === H.p2 ? '·ne' : ''} des tâches !` : ''}</div>
      ${section('La semaine passée', past)}${section('La semaine qui vient', upcoming)}`,
    onMount: () => { if (tot >= 5) setTimeout(confetti, 450); },
    onOk: () => {
      const strip = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const lines = html => [...new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').querySelectorAll('.row')].map(x => '• ' + [...x.querySelectorAll('.t,.s')].map(y => strip(y.textContent)).filter(Boolean).join(' : '));
      shareText('Récap de la semaine', [`Récap de la semaine (${d(r.from)} – ${d(r.today)})`, '', 'La semaine passée', ...lines(past), '', 'La semaine qui vient', ...lines(upcoming)].join('\n'));
      return false;
    } });
};

// ================= Courses à la dictée =================
/** « lait, œufs et pain » → ['lait', 'œufs', 'pain'] */
function splitItems(text) {
  return text.split(/\s*(?:[,;\n]|\s+et\s+|\s+puis\s+|\s+plus\s+)\s*/i).map(s => s.replace(/[.!?]+$/, '').trim()).filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));
}
A.shopAdd = () => {
  const input = document.getElementById('shopInput'); if (!input) return;
  const items = splitItems(input.value); if (!items.length) { input.focus(); return; }
  for (const title of items) if (!S.shopping.some(x => !x.done && fold(x.title) === fold(title))) S.shopping.push({ id: uid(), title, done: false });
  input.value = ''; changed();
  if (items.length > 1) toast(`${items.length} articles ajoutés`);
  const again = document.getElementById('shopInput'); if (again) again.focus();
};
A.shopDictate = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = document.getElementById('shopInput');
  if (!SR) { if (input) input.focus(); toast('Touchez le micro du clavier, puis dites « lait, œufs et pain »'); return; }
  const rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = false;
  const btn = document.querySelector('[data-a="shopDictate"]'); if (btn) btn.classList.add('listening');
  haptic();
  let finalText = '';
  rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; finalText = t; const i = document.getElementById('shopInput'); if (i) i.value = t; };
  rec.onerror = e => { if (btn) btn.classList.remove('listening'); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('Micro refusé : utilisez le micro du clavier'); if (input) input.focus(); } };
  rec.onend = () => { const b = document.querySelector('[data-a="shopDictate"]'); if (b) b.classList.remove('listening'); if (finalText.trim()) A.shopAdd(); };
  try { rec.start(); toast('Je vous écoute… dites « lait, œufs et pain »'); } catch (e) { if (input) input.focus(); }
};
