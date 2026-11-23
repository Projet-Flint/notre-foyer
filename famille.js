// Onglet Famille : Agenda, Courses, Tâches, Dates, Maison, Contacts.
'use strict';

const UI = {
  tab: 'famille', section: 'Agenda', day: todayKey(), choreFilter: 'Toutes', notebook: DEFAULT_NOTEBOOKS[0], contactSearch: '',
  view: null,          // vue poussée (Réglages, fiche élève, détail projet…)
  work: 'Aujourd\'hui', workDay: todayKey(), selType: null, linkStudent: null,
  projFilter: 'En cours', finMonth: dkey(new Date()), finWho: 'Commun', bilanMonth: dkey(new Date()),
};
const A = {};   // actions déclenchées par data-a="…"
const SECTIONS = ['Agenda', 'Courses', 'Tâches', 'Dates', 'Maison', 'Contacts'];

function changed(opts) { save(); render(opts); }
// Bouton « Supprimer » en bas d'une feuille de modification (avec confirmation).
function sheetDelBtn(label) { return `<div class="sec"><button type="button" class="btn glass wide press danger" data-sheet-del>${ic('trash', 18)}${esc(label)}</button></div>`; }
function bindSheetDel(r, title, fn) {
  const b = r.querySelector('[data-sheet-del]'); if (!b) return;
  b.addEventListener('click', () => dialog({ title, ok: 'Supprimer', danger: true, onOk: () => { closeLayer(r); fn(); } }));
}
const editSwipe = (a, id) => ({ a, id, icon: 'pencil', label: 'Modifier', color: THEME.accent });

// ================= Écran Famille =================
function screenFamille() {
  const idx = SECTIONS.indexOf(UI.section);
  return `<div class="screen">
    <div class="head"><div><h1>Famille</h1></div>
      <div style="display:flex;gap:8px"><button class="iconbtn glass press" data-a="openSearch" aria-label="Rechercher">${ic('search', 21)}</button>
      <button class="iconbtn glass press" data-a="openSettings" aria-label="Réglages">${ic('gear', 22)}</button></div></div>
    ${switcher(SECTIONS, UI.section, 'section', { key: 'famille', cls: 'six' })}
    <div class="pager" data-pager>
      <div class="pages" style="transform:translateX(${-idx * 100}%)">
        ${SECTIONS.map(s => `<div class="page" data-page="${s}">${pageFamille(s)}</div>`).join('')}
      </div>
    </div>
  </div>`;
}
function pageFamille(s) {
  switch (s) {
    case 'Agenda': return pageAgenda();
    case 'Courses': return pageCourses();
    case 'Tâches': return pageTaches();
    case 'Dates': return pageDates();
    case 'Maison': return pageMaison();
    case 'Contacts': return pageContacts();
  }
}
A.section = d => { if (UI.section === d.v) return; UI.section = d.v; render(); };

// ================= Agenda =================
function eventsOn(key) {
  return S.events.filter(e => e.start.slice(0, 10) === key)
    .sort((a, b) => (a.allDay ? -1 : 0) - (b.allDay ? -1 : 0) || a.start.localeCompare(b.start));
}
function datesOn(key) { const d = parseKey(key); return S.dates.filter(x => { const o = parseKey(x.date); return o.getMonth() === d.getMonth() && o.getDate() === d.getDate(); }); }
function dayDots(k) {
  const ev = eventsOn(k).slice(0, 3).map(e => `<i style="background:${H.color(e.who)}"></i>`);
  if (datesOn(k).length) ev.push('<i style="background:var(--orange)"></i>');
  return ev.slice(0, 4).join('');
}
function pageAgenda() {
  const today = startOfDay(new Date()), sel = parseKey(UI.day);
  const mode = UI.agendaMode || 'Semaine';
  let top;
  if (mode === 'Semaine') {
    const off = daysBetween(today, sel);
    const first = off >= 0 && off <= 6 ? today : weekStart(sel);
    const days = Array.from({ length: 7 }, (_, i) => addDays(first, i));
    top = section(first === today ? 'Cette semaine' : 'Semaine du ' + first.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
      `<div class="week">${days.map(d => { const k = dkey(d); const sh = typeof shiftOn === 'function' ? shiftOn(k) : null;
        return `<button class="press ${k === UI.day ? 'on' : ''}" data-a="pickDay" data-v="${k}">
        <span class="wd">${esc(d.toLocaleDateString('fr-FR', { weekday: 'short' }))}</span><span class="dn">${d.getDate()}</span>
        <span class="dots">${dayDots(k)}</span>${sh ? `<span class="shiftbar" style="background:${sh.color}"></span>` : ''}</button>`; }).join('')}</div>`);
  } else {
    const m = new Date(sel.getFullYear(), sel.getMonth(), 1), first = weekStart(m);
    const weeks = Math.ceil((daysBetween(first, new Date(m.getFullYear(), m.getMonth() + 1, 1))) / 7);
    const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i));
    top = `<div class="sec"><div class="glass card" style="padding:10px 10px 12px">
      <div class="daynav" style="margin:0 0 6px"><button class="iconbtn press" data-a="agendaMonth" data-v="-1" aria-label="Mois précédent">${ic('back', 18, 2.2)}</button>
        <button class="d press" data-a="agendaMonth" data-v="0">${esc(cap(m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</button>
        <button class="iconbtn press" data-a="agendaMonth" data-v="1" aria-label="Mois suivant">${ic('chev', 18, 2.2)}</button></div>
      <div class="month">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span class="mh">${x}</span>`).join('')}
      ${cells.map(d => { const k = dkey(d), out = d.getMonth() !== m.getMonth(); const sh = typeof shiftOn === 'function' ? shiftOn(k) : null;
        return `<button class="mday press ${k === UI.day ? 'on' : ''} ${k === todayKey() ? 'today' : ''} ${out ? 'out' : ''}" data-a="pickDay" data-v="${k}" aria-label="${esc(longDate(d))}">
          <span class="num">${d.getDate()}</span><span class="dots">${dayDots(k)}</span>${sh ? `<span class="shiftbar" style="background:${sh.color}" title="${esc(sh.label)}"></span>` : ''}</button>`; }).join('')}</div></div></div>`;
  }
  const list = eventsOn(UI.day);
  const sh = typeof shiftOn === 'function' ? shiftOn(UI.day) : null;
  let rows = '';
  if (sh) rows += `<div class="row"><span class="time">${sh.work ? esc(sh.start) : 'Repos'}</span><span class="vbar" style="background:${sh.color}"></span><div class="main"><div class="t">${esc(sh.label)}</div><div class="s">${sh.work ? esc(sh.start + ' – ' + sh.end) + ' · ' : ''}${nurseName() === H.me ? 'mon planning' : 'planning de ' + esc(nurseName())}</div></div>${chip(nurseName())}</div>`;
  rows += datesOn(UI.day).map(x => `<div class="row"><span class="time" style="color:var(--orange)">${ic('gift', 20)}</span><span class="vbar" style="background:var(--orange)"></span><div class="main press" data-a="dateEdit" data-id="${x.id}"><div class="t">${esc(x.title)}</div><div class="s">${esc(x.kind)}</div></div></div>`).join('');
  rows += list.map(e => swipeRow(
    `<span class="time">${e.allDay ? 'Journée' : esc(e.start.slice(11, 16))}</span>
     <span class="vbar" style="background:${H.color(e.who)}"></span>
     <div class="main" data-a="eventEdit" data-id="${e.id}"><div class="t">${esc(e.title)}</div>${e.location ? `<div class="s">${esc(e.location)}</div>` : ''}</div>
     ${chip(e.who)}`,
    [editSwipe('eventEdit', e.id), { a: 'eventIcs', id: e.id, icon: 'calendar', label: 'Calendrier', color: THEME.both }, swipeDel('eventDel', e.id)],
    `data-long="eventMenu" data-id="${e.id}"`)).join('');
  if (!rows) rows = `<div class="empty">Rien de prévu ce jour-là.</div>`;
  return `<div class="scroll">
    <div class="sec" style="display:flex;gap:8px;align-items:center"><div style="flex:1;min-width:0">${switcher(['Semaine', 'Mois'], mode, 'agendaMode', { key: 'agmode', cls: 'inline small' })}</div>
      <button class="iconbtn glass press" data-a="shareSchedule" data-v="agenda" aria-label="Partager l'agenda">${ic('share', 18)}</button></div>
    ${top}
    ${section(esc(cap(dayLabel(sel))), rows, list.length ? 'Touchez un rendez-vous pour le modifier, ou glissez-le vers la gauche.' : '')}
  </div>
  <button class="fab btn prim press halo" data-a="eventAdd" aria-label="Ajouter un rendez-vous">${ic('plus', 26, 2.2)}</button>`;
}
A.agendaMode = d => { UI.agendaMode = d.v; render(); };
A.agendaMonth = d => { const n = +d.v; if (n === 0) UI.day = todayKey(); else { const s = parseKey(UI.day); UI.day = dkey(new Date(s.getFullYear(), s.getMonth() + n, 1)); } render(); };
A.pickDay = d => { UI.day = d.v; render(); };
A.eventDel = d => { S.events = S.events.filter(e => e.id !== d.id); changed(); };
A.eventIcs = d => {
  const e = S.events.find(x => x.id === d.id); if (!e) return;
  downloadFile('rendez-vous.ics', icsFor({ title: e.title, start: e.allDay ? parseKey(e.start.slice(0, 10)) : new Date(e.start), allDay: e.allDay, location: e.location, alarmDaysBefore: e.allDay ? null : 0 }), 'text/calendar');
};
A.eventMenu = d => {
  const e = S.events.find(x => x.id === d.id); if (!e) return;
  menu(e.title, [
    { label: 'Modifier', icon: 'pencil', fn: () => eventSheet(e) },
    { label: 'Ajouter au Calendrier de l\'iPhone', icon: 'calendar', fn: () => A.eventIcs(d) },
    { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.eventDel(d) },
  ]);
};
A.eventAdd = () => eventSheet(null);
A.eventEdit = d => { const e = S.events.find(x => x.id === d.id); if (e) eventSheet(e); };
function whoSeg(name, current) { return seg(name, H.everyone, current, n => H.color(n)); }
function eventSheet(e) {
  const date = e ? e.start.slice(0, 10) : UI.day, time = e && !e.allDay ? e.start.slice(11, 16) : '12:00';
  sheet({
    title: e ? 'Modifier le RDV' : 'Nouveau rendez-vous', ok: e ? 'Enregistrer' : 'Ajouter',
    body: `<div class="group glass">
      <div class="field"><input name="title" placeholder="Quoi ? (ex. rendez-vous pédiatre)" value="${esc(e ? e.title : '')}" data-required ${e ? '' : 'autofocus'}></div>
      <div class="field"><span class="flabel">Quand</span><input type="date" name="date" value="${date}"></div>
      <div class="field" data-timefield ${e && e.allDay ? 'hidden' : ''}><span class="flabel">Heure</span><input type="time" name="time" value="${time}"></div>
      <div class="field"><span class="flabel">Toute la journée</span>${toggleHtml('allDay', e && e.allDay)}</div>
    </div>
    <div class="sec"><div class="sec-h">Pour qui</div>${whoSeg('who', e ? e.who : BOTH)}</div>
    <div class="sec"><div class="group glass"><div class="field"><input name="location" placeholder="Où ? (facultatif)" value="${esc(e ? e.location || '' : '')}"></div></div></div>
    ${e ? sheetDelBtn('Supprimer le rendez-vous') : ''}`,
    onMount: r => {
      r.querySelector('[name=allDay]').addEventListener('change', ev => { r.querySelector('[data-timefield]').hidden = ev.target.checked; });
      if (e) bindSheetDel(r, `Supprimer « ${e.title} » ?`, () => A.eventDel({ id: e.id }));
    },
    onOk: r => {
      const allDay = val(r, 'allDay'), dt = val(r, 'date') || UI.day;
      const item = e || { id: uid() };
      Object.assign(item, { title: val(r, 'title'), allDay, start: dt + 'T' + (allDay ? '00:00' : (val(r, 'time') || '12:00')), who: segVal(r, 'who'), location: val(r, 'location') });
      if (!e) S.events.push(item);
      UI.day = dt; changed();
    },
  });
}

// ================= Courses =================
function pageCourses() {
  const open = S.shopping.filter(x => !x.done), cart = S.shopping.filter(x => x.done);
  let html = `<div class="sec"><div class="group glass"><div class="row">
      <input class="plain" id="shopInput" placeholder="Ajouter : lait, œufs et pain" enterkeyhint="done" autocomplete="off">
      <button class="press micbtn" data-a="shopDictate" aria-label="Dicter les courses">${ic('mic', 22)}</button>
      <button class="press" data-a="shopAdd" style="color:var(--accent)" aria-label="Ajouter">${ic('plus', 26, 2.4)}</button></div></div></div>
    <div class="sec"><div class="btnrow">
      <button class="btn glass press" data-a="openMeals">${ic('fork', 18)}<span>Repas de la semaine</span></button>
      <button class="btn glass press" data-a="openShop">${ic('location', 18)}<span>${esc(S.shopName || 'Mon magasin')}</span></button>
    </div></div>`;
  if (!open.length) html += section('Tout est pris', `<div class="empty">${S.shopping.length ? 'Tout est dans le panier.' : 'La liste est vide.'}</div>`);
  for (const [key, label, icon] of AISLES) {
    const items = open.filter(x => aisleOf(x) === key);
    if (!items.length) continue;
    html += section(`${ic(icon, 16)}${esc(label)}`, items.map(shopRow).join(''));
  }
  if (cart.length) {
    html += section(`${ic('cart', 16)}Dans le panier`, cart.map(shopRow).join('') +
      `<button class="row danger" data-a="shopClear" style="width:100%">Retirer les articles cochés</button>`,
      'Les articles sont rangés par rayon. Appui long sur un article pour changer son rayon, glissez-le vers la gauche pour le cocher ou le supprimer.');
  }
  if (S.shopping.length) html += `<div class="sec"><button class="btn glass wide press" data-a="shopShare">${ic('share', 18)}Envoyer la liste</button></div>`;
  return `<div class="scroll">${html}</div>`;
}
function shopRow(x) {
  return swipeRow(`${checkBtn(x.done, 'shopToggle', x.id)}<div class="main"><div class="t" style="font-weight:500">${esc(x.title)}</div></div>`,
    [swipeDone('shopToggle', x.id, x.done, 'Pris', 'Remettre'), swipeDel('shopDel', x.id)],
    `data-long="shopMenu" data-id="${x.id}"`).replace('class="content row"', `class="content row ${x.done ? 'muted' : ''}"`);
}
A.shopAdd = () => {
  const input = document.getElementById('shopInput'); if (!input) return;
  const name = input.value.trim(); if (!name) { input.focus(); return; }
  S.shopping.push({ id: uid(), title: name, done: false });
  input.value = ''; changed();
  const again = document.getElementById('shopInput'); if (again) again.focus();
};
function remainingAfter(fn, count) { const before = count(); fn(); const after = count(); if (before > 0 && after === 0) setTimeout(confetti, 150); }
A.shopToggle = d => {
  const x = S.shopping.find(i => i.id === d.id); if (!x) return;
  remainingAfter(() => { x.done = !x.done; x.doneAt = x.done ? Date.now() : null; }, () => S.shopping.filter(i => !i.done).length);
  if (x.done) haptic('success');
  changed();
};
A.shopDel = d => { S.shopping = S.shopping.filter(i => i.id !== d.id); changed(); };
A.shopClear = () => { S.shopping = S.shopping.filter(i => !i.done); changed(); };
A.shopMenu = d => {
  const x = S.shopping.find(i => i.id === d.id); if (!x) return;
  const cur = aisleOf(x);
  menu(`Rayon de « ${x.title} »`, AISLES.map(([k, l, i]) => ({ label: (k === cur ? '✓ ' : '') + l, icon: i, fn: () => { x.aisle = k; changed(); } })));
};
A.shopShare = () => {
  const open = S.shopping.filter(x => !x.done);
  let text = 'Courses :\n';
  for (const [k, l] of AISLES) { const it = open.filter(x => aisleOf(x) === k); if (it.length) text += `\n${l}\n` + it.map(x => '• ' + x.title).join('\n') + '\n'; }
  shareText('Liste de courses', open.length ? text : 'La liste de courses est vide.');
};
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'shopInput') { e.preventDefault(); A.shopAdd(); } });

A.openMeals = () => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  sheet({
    title: 'Repas de la semaine', cancel: 'Fermer', ok: 'Enregistrer', full: true,
    body: days.map(d => { const k = dkey(d), m = S.meals[k] || {};
      return `<div class="sec"><div class="sec-h">${esc(cap(dayLabel(d)))}</div><div class="group glass">
        <div class="field"><input name="t-${k}" placeholder="Dîner (ex. lasagnes)" value="${esc(m.title || '')}"></div>
        <div class="field"><input name="i-${k}" placeholder="Ingrédients, séparés par des virgules" value="${esc(m.ingredients || '')}" style="font-size:15px"></div></div></div>`; }).join('') +
      `<div class="sec"><button class="btn prim wide press" data-meals-add>${ic('cart', 18)}Ajouter les ingrédients aux courses</button><div class="sec-f" data-meals-msg></div></div>`,
    onMount: r => {
      const store = () => { for (const d of days) { const k = dkey(d), t = val(r, 't-' + k), i = val(r, 'i-' + k); if (t || i) S.meals[k] = { title: t, ingredients: i }; else delete S.meals[k]; } save(); };
      r._store = store;
      r.querySelector('[data-meals-add]').addEventListener('click', () => {
        store();
        const already = new Set(S.shopping.filter(x => !x.done).map(x => x.title.trim().toLowerCase()));
        let n = 0;
        for (const d of days) { const m = S.meals[dkey(d)]; if (!m || !m.ingredients) continue;
          for (const ing of m.ingredients.split(',').map(s => s.trim()).filter(Boolean)) {
            const k = ing.toLowerCase(); if (already.has(k)) continue; already.add(k);
            S.shopping.push({ id: uid(), title: ing, done: false }); n++; } }
        haptic('success');
        r.querySelector('[data-meals-msg]').textContent = n ? `${n} ingrédient${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} aux courses.` : 'Tout était déjà sur la liste.';
        changed();
      });
    },
    onOk: r => { r._store(); changed(); },
  });
};
A.openShop = () => {
  sheet({
    title: 'Mon magasin', cancel: 'Fermer', ok: 'OK',
    body: `<div class="group glass"><div class="field">${ic('search', 18)}<input name="shop" placeholder="Nom du magasin ou adresse" value="${esc(S.shopName)}" autofocus></div></div>
      <div class="sec"><button class="btn glass wide press" data-shop-maps>${ic('location', 18)}Voir l'itinéraire dans Plans</button></div>
      <div class="sec-f">La version web ne peut pas sonner en arrivant au magasin (l'app iPhone le fera). Ici, le magasin s'affiche sur le bouton et ouvre l'itinéraire.</div>`,
    onMount: r => r.querySelector('[data-shop-maps]').addEventListener('click', () => {
      const q = val(r, 'shop') || 'supermarché'; location.href = 'https://maps.apple.com/?q=' + encodeURIComponent(q);
    }),
    onOk: r => { S.shopName = val(r, 'shop'); changed(); },
  });
};

// ================= Tâches =================
function pageTaches() {
  const chores = S.chores, p1 = H.p1, p2 = H.p2;
  const weekAgo = Date.now() - 7 * 86400000;
  const done = chores.filter(c => c.done && (c.doneAt || 0) > weekAgo);
  const c1 = done.filter(c => c.who === p1).length, c2 = done.filter(c => c.who === p2).length, cb = done.filter(c => c.who === BOTH).length;
  const total = Math.max(c1 + c2, 1);
  const msg = c1 + c2 === 0 ? 'Les tâches terminées cette semaine apparaîtront ici.'
    : Math.abs(c1 - c2) <= 1 ? 'Bel équilibre cette semaine, bravo à vous deux.'
    : `${c1 > c2 ? p1 : p2} en a fait un peu plus cette semaine.`;
  const balance = `<div class="tile glass" style="gap:10px">
      <div style="display:flex;align-items:center;gap:6px;font-weight:600;font-size:15px">${ic('scale', 18)}Bilan de la semaine<span class="lbl" style="margin-left:auto;font-weight:600">${done.length} faite${done.length > 1 ? 's' : ''}</span></div>
      <div class="bar" style="opacity:${c1 + c2 ? 1 : .25}"><i style="width:${Math.max(4, 100 * c1 / total)}%;background:${H.color(p1)}"></i><i style="flex:1;background:${H.color(p2)}"></i></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700"><span style="color:${H.color(p1)}">${esc(p1)} : ${c1}</span>${cb ? `<span style="color:${H.color(BOTH)}">Ensemble : ${cb}</span>` : ''}<span style="color:${H.color(p2)}">${esc(p2)} : ${c2}</span></div>
      <div class="lbl" style="font-size:13px">${esc(msg)}</div></div>`;
  const score = name => { const horizon = dkey(addDays(new Date(), 6)); const mine = chores.filter(c => c.who === name && (c.done ? (c.doneAt || 0) > weekAgo : (!c.due || c.due <= horizon))); const d = mine.filter(c => c.done).length;
    return `<div class="tile glass">${chip(name)}<div style="display:flex;align-items:baseline;gap:4px"><span class="big">${d}/${mine.length}</span><span class="lbl" style="font-size:14px">faites</span></div>
      <div class="progress"><i style="width:${mine.length ? 100 * d / mine.length : 0}%;background:${H.color(name)}"></i></div></div>`; };
  const filters = [['Toutes', 'Toutes'], ...H.everyone.map(n => [n, n])];
  if (!filters.some(f => f[0] === UI.choreFilter)) UI.choreFilter = 'Toutes';
  const list = chores.filter(c => UI.choreFilter === 'Toutes' || c.who === UI.choreFilter)
    .filter(c => !c.done || (c.doneAt || 0) > weekAgo)
    .sort((a, b) => (a.done - b.done) || (a.due || '9').localeCompare(b.due || '9'));
  const rows = list.length ? list.map(c => {
    const due = !c.done && c.due ? ' · ' + cap(dayLabel(parseKey(c.due))) : '';
    const late = !c.done && c.due && c.due < todayKey();
    return swipeRow(`${checkBtn(c.done, 'choreToggle', c.id)}<div class="main" data-a="choreEdit" data-id="${c.id}"><div class="t">${esc(c.title)}</div><div class="s" ${late ? 'style="color:var(--orange)"' : ''}>${esc(c.freq + due)}</div></div>
      <button class="press" data-a="choreWho" data-id="${c.id}">${chip(c.who)}</button>`,
      [editSwipe('choreEdit', c.id), { a: 'choreGive', id: c.id, icon: 'swap', label: "À l'autre", color: THEME.both }, swipeDone('choreToggle', c.id, c.done), swipeDel('choreDel', c.id)],
      `data-long="choreMenu" data-id="${c.id}"`).replace('class="content row"', `class="content row ${c.done ? 'muted' : ''}"`);
  }).join('') : '<div class="empty">Aucune tâche ici.</div>';
  return `<div class="scroll">
    <div class="sec"><div class="sec-h">Qui fait quoi</div>${balance}<div class="grid2" style="margin-top:12px">${score(p1)}${score(p2)}</div></div>
    <div class="sec">${switcher(filters, UI.choreFilter, 'choreFilter', { key: 'chores', cls: 'inline small' })}
    <div class="group glass">${rows}</div>
    <div class="sec-f">Touchez une tâche pour la modifier. Glissez vers la gauche pour cocher, supprimer ou donner la tâche à l'autre. Touchez un prénom pour choisir.</div></div>
  </div>
  <button class="fab btn prim press halo" data-a="choreAdd" aria-label="Nouvelle tâche">${ic('plus', 26, 2.2)}</button>`;
}
A.choreFilter = d => { UI.choreFilter = d.v; render(); };
A.choreToggle = d => {
  const c = S.chores.find(x => x.id === d.id); if (!c) return;
  remainingAfter(() => toggleRecurring(S.chores, c, 'freq'), () => S.chores.filter(x => !x.done && (!x.due || x.due <= todayKey())).length);
  if (c.done) haptic('success');
  changed();
};
A.choreDel = d => { S.chores = S.chores.filter(x => x.id !== d.id); changed(); };
A.choreGive = d => { const c = S.chores.find(x => x.id === d.id); if (c) { c.who = H.other(c.who); changed(); } };
A.choreWho = d => { const c = S.chores.find(x => x.id === d.id); if (!c) return;
  menu('Qui s\'en charge ?', H.everyone.map(n => ({ label: n, style: `color:${H.color(n)}`, fn: () => { c.who = n; changed(); } }))); };
A.choreMenu = d => { const c = S.chores.find(x => x.id === d.id); if (!c) return;
  menu(c.title, [{ label: 'Modifier', icon: 'pencil', fn: () => choreSheet(c) }, { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.choreDel(d) }]); };
A.choreAdd = () => choreSheet(null);
A.choreEdit = d => { const c = S.chores.find(x => x.id === d.id); if (c) choreSheet(c); };
function choreSheet(c) {
  sheet({
    title: c ? 'Modifier la tâche' : 'Nouvelle tâche', ok: c ? 'Enregistrer' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="title" placeholder="Tâche (ex. sortir les poubelles)" value="${esc(c ? c.title : '')}" data-required ${c ? '' : 'autofocus'}></div></div>
      <div class="sec"><div class="sec-h">Qui s'en charge</div>${whoSeg('who', c ? c.who : (UI.choreFilter !== 'Toutes' ? UI.choreFilter : H.me))}</div>
      <div class="sec"><div class="group glass">
        <div class="field"><span class="flabel">Fréquence</span><select name="freq">${FREQS.map(f => `<option ${f === (c ? c.freq : 'Chaque semaine') ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
        <div class="field"><span class="flabel">${c ? 'Prochaine fois le' : 'À partir du'}</span><input type="date" name="due" value="${c && c.due ? c.due : todayKey()}"></div></div></div>
      ${c ? sheetDelBtn('Supprimer la tâche') : ''}`,
    onMount: r => { if (c) bindSheetDel(r, `Supprimer « ${c.title} » ?`, () => A.choreDel({ id: c.id })); },
    onOk: r => {
      const item = c || { id: uid(), done: false };
      Object.assign(item, { title: val(r, 'title'), who: segVal(r, 'who'), freq: val(r, 'freq'), due: val(r, 'due') || todayKey() });
      if (!c) S.chores.push(item);
      changed();
    },
  });
}

// ================= Dates =================
function pageDates() {
  const list = S.dates.map(d => ({ d, next: nextOccurrence(d.date) })).sort((a, b) => a.next - b.next);
  const rows = list.length ? list.map(({ d, next }) => {
    const days = daysBetween(new Date(), next);
    const delay = (DELAYS.find(x => x[0] === d.delay) || [0, ''])[1];
    const details = [next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }), d.kind, delay ? 'rappel ' + delay : ''].filter(Boolean).join(' · ');
    const years = d.kind === 'Anniversaire' && d.year ? next.getFullYear() - d.year : null;
    return swipeRow(`<div style="width:56px;text-align:center;color:${days <= 7 ? 'var(--orange)' : 'inherit'}">
        <div style="font-size:22px;font-weight:700" class="num">${days === 0 ? 'Auj.' : days}</div>${days > 0 ? `<div class="lbl" style="font-size:11px">${days > 1 ? 'jours' : 'jour'}</div>` : ''}</div>
      <div class="main"><div class="t">${esc(d.title)}${years ? ` <span class="lbl">(${years} ans)</span>` : ''}</div><div class="s">${esc(details)}</div></div>`,
      [{ a: 'dateIcs', id: d.id, icon: 'calendar', label: 'Calendrier', color: THEME.both }, swipeDel('dateDel', d.id)],
      `data-long="dateMenu" data-id="${d.id}"`);
  }).join('') : '<div class="empty">Ajoutez les anniversaires et les échéances à ne pas oublier.</div>';
  return `<div class="scroll">${section('Prochaines dates', rows, 'Les dates reviennent chaque année. Pour recevoir le rappel sur l\'iPhone, glissez une date vers la gauche puis touchez « Calendrier ».')}</div>
  <button class="fab btn prim press halo" data-a="dateAdd" aria-label="Ajouter une date">${ic('plus', 26, 2.2)}</button>`;
}
A.dateDel = d => { S.dates = S.dates.filter(x => x.id !== d.id); changed(); };
A.dateIcs = d => { const x = S.dates.find(i => i.id === d.id); if (!x) return;
  downloadFile('date.ics', icsFor({ title: x.title, start: nextOccurrence(x.date), allDay: true, yearly: true, alarmDaysBefore: x.delay }), 'text/calendar'); };
A.dateMenu = d => { const x = S.dates.find(i => i.id === d.id); if (!x) return;
  menu(x.title, [{ label: 'Modifier', icon: 'pencil', fn: () => dateSheet(x) }, { label: 'Ajouter au Calendrier de l\'iPhone', icon: 'calendar', fn: () => A.dateIcs(d) },
    { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.dateDel(d) }]); };
A.dateAdd = () => dateSheet(null);
A.dateEdit = d => { const x = S.dates.find(i => i.id === d.id); if (x) dateSheet(x); };
function dateSheet(x) {
  sheet({
    title: x ? 'Modifier la date' : 'Nouvelle date', ok: x ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="title" placeholder="Quoi ? (ex. anniversaire de papa)" value="${esc(x ? x.title : '')}" data-required autofocus></div>
      <div class="field"><span class="flabel">Le</span><input type="date" name="date" value="${x ? x.date : todayKey()}"></div></div>
      <div class="sec"><div class="group glass">
      <div class="field"><span class="flabel">Catégorie</span><select name="kind">${DATE_KINDS.map(k => `<option ${k === (x ? x.kind : 'Anniversaire') ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
      <div class="field"><span class="flabel">Me le rappeler</span><select name="delay">${DELAYS.map(([v, l]) => `<option value="${v}" ${v === (x ? x.delay : 7) ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="sec-f">Pour un anniversaire, mettez l'année de naissance si vous la connaissez : l'âge s'affichera.</div></div>`,
    onOk: r => {
      const item = x || { id: uid() };
      const date = val(r, 'date') || todayKey();
      Object.assign(item, { title: val(r, 'title'), date, kind: val(r, 'kind'), delay: +val(r, 'delay'), year: parseKey(date).getFullYear() < new Date().getFullYear() ? parseKey(date).getFullYear() : null });
      if (!x) S.dates.push(item);
      changed();
    },
  });
}

// ================= Maison =================
function notebooks() {
  const res = [];
  for (const n of DEFAULT_NOTEBOOKS.concat(S.notebooks, S.maison.map(m => m.notebook))) if (n && !res.includes(n)) res.push(n);
  return res;
}
function notebookIcon(n) { return n === 'Cadeaux de Noël' ? 'gift' : n === 'Loyer et charges' ? 'house' : n === 'Enfants' ? 'child' : 'folder'; }
function pageMaison() {
  const nbs = notebooks();
  if (!nbs.includes(UI.notebook)) UI.notebook = nbs[0];
  const nb = UI.notebook, items = S.maison.filter(m => m.notebook === nb);
  const color = H.color(H.me);
  const bar = `<div class="hscroll">${nbs.map(n => `<button class="capsule glass press ${n === nb ? 'sel' : ''}" style="${n === nb ? selVars(color) : ''}" data-a="pickNotebook" data-v="${esc(n)}" ${!DEFAULT_NOTEBOOKS.includes(n) ? `data-long="notebookMenu"` : ''}>${ic(notebookIcon(n), 17)}${esc(n)}</button>`).join('')}
    <button class="capsule glass press" data-a="addNotebook" aria-label="Nouveau carnet" style="padding:9px 11px">${ic('plus', 18, 2.2)}</button></div>`;
  const open = items.filter(m => !m.done);
  const total = open.reduce((s, m) => s + (m.amount || 0), 0);
  const dated = open.filter(m => m.due).sort((a, b) => a.due.localeCompare(b.due));
  let summary = '';
  if (total > 0 || dated.length) {
    summary = `<div class="sec"><div class="grid2">${total > 0 ? `<div class="tile glass"><span class="lbl">Total restant</span><span class="big">${eur(total)}</span><span class="lbl">${open.length} élément${open.length > 1 ? 's' : ''}</span></div>` : ''}
      ${dated.length ? `<div class="tile glass"><span class="lbl">Prochaine échéance</span><span style="font-weight:700;font-size:17px">${esc(cap(dayLabel(parseKey(dated[0].due))))}</span><span class="lbl" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(dated[0].title)}</span></div>` : ''}</div></div>`;
  }
  const empty = { 'Cadeaux de Noël': 'Notez les idées de cadeaux, pour qui, et leur prix.', 'Loyer et charges': 'Ajoutez le loyer avec son montant et sa date : il revient chaque mois.', 'Enfants': 'Vaccins, inscriptions, tailles de vêtements, nounou… tout ce qui concerne les enfants.' }[nb] || 'Ce carnet est vide. Touchez « + » pour ajouter un élément.';
  const rows = items.length ? items.map(m => {
    const parts = [];
    if (m.amount != null) parts.push(eur(m.amount));
    if (m.due) parts.push(cap(dayLabel(parseKey(m.due))));
    if (m.monthly) parts.push('chaque mois');
    const href = m.link ? (m.link.startsWith('http') ? m.link : 'https://' + m.link) : null;
    return swipeRow(`${checkBtn(m.done, 'maisonToggle', m.id)}<div class="main"><div class="t">${esc(m.title)}</div>${parts.length ? `<div class="s">${esc(parts.join(' · '))}</div>` : ''}</div>
      ${href ? `<a class="round glass press halo" href="${esc(href)}" target="_blank" rel="noopener" aria-label="Ouvrir le lien">${ic('link', 16, 2)}</a>` : ''}
      ${m.forWhom ? chip(m.forWhom) : ''}`,
      [swipeDone('maisonToggle', m.id, m.done), swipeDel('maisonDel', m.id)], `data-long="maisonMenu" data-id="${m.id}"`)
      .replace('class="content row"', `class="content row ${m.done ? 'muted' : ''}"`);
  }).join('') : `<div class="empty">${esc(empty)}</div>`;
  return `<div class="scroll"><div class="sec">${bar}</div>${summary}
    ${section(esc(nb), rows, nb === 'Loyer et charges' ? 'Le suivi des paiements et du budget est dans l\'onglet Finances. Ici, vous gardez les échéances.' : '')}</div>
    <button class="fab btn prim press halo" data-a="maisonAdd" aria-label="Ajouter dans ${esc(nb)}">${ic('plus', 26, 2.2)}</button>`;
}
A.pickNotebook = d => { UI.notebook = d.v; render(); };
A.addNotebook = () => dialog({ title: 'Nouveau carnet', placeholder: 'Ex. : vacances, voiture, animaux', ok: 'Créer', onOk: name => {
  if (!name) return; if (!S.notebooks.includes(name)) S.notebooks.push(name); UI.notebook = name; changed(); } });
A.notebookMenu = (d, el) => { const n = el.dataset.v;
  menu(n, [{ label: 'Renommer', icon: 'pencil', fn: () => dialog({ title: 'Renommer le carnet', placeholder: '', value: n, onOk: v => { if (!v) return;
      S.notebooks = S.notebooks.map(x => x === n ? v : x); if (!S.notebooks.includes(v)) S.notebooks.push(v); S.maison.forEach(m => { if (m.notebook === n) m.notebook = v; }); UI.notebook = v; changed(); } }) },
    { label: 'Supprimer le carnet et son contenu', icon: 'trash', danger: true, fn: () => dialog({ title: 'Supprimer « ' + n + ' » ?', text: 'Tout ce qu\'il contient sera effacé.', ok: 'Supprimer', danger: true, onOk: () => {
      S.notebooks = S.notebooks.filter(x => x !== n); S.maison = S.maison.filter(m => m.notebook !== n); changed(); } }) }]); };
A.maisonToggle = d => { const m = S.maison.find(x => x.id === d.id); if (!m) return;
  remainingAfter(() => toggleRecurring(S.maison, m, 'freq'), () => S.maison.filter(x => x.notebook === m.notebook && !x.done).length);
  if (m.done) haptic('success'); changed(); };
A.maisonDel = d => { S.maison = S.maison.filter(x => x.id !== d.id); changed(); };
A.maisonMenu = d => { const m = S.maison.find(x => x.id === d.id); if (!m) return;
  menu(m.title, [{ label: 'Modifier', icon: 'pencil', fn: () => maisonSheet(m) }, { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.maisonDel(d) }]); };
A.maisonAdd = () => maisonSheet(null);
function maisonSheet(m) {
  const nb = m ? m.notebook : UI.notebook, rent = nb === 'Loyer et charges';
  const ph = { 'Cadeaux de Noël': 'Idée de cadeau (ex. Lego pour Léa)', 'Loyer et charges': 'Ex. : loyer, électricité, internet', 'Enfants': 'Ex. : rappel vaccin, inscription au judo' }[nb] || 'Quoi ?';
  const hasDue = m ? !!m.due : rent, monthly = m ? !!m.monthly : rent;
  sheet({
    title: m ? 'Modifier' : 'Nouvel élément', ok: m ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="title" placeholder="${esc(ph)}" value="${esc(m ? m.title : '')}" data-required autofocus></div>
      <div class="field"><span class="flabel">Carnet</span><select name="notebook">${notebooks().map(n => `<option ${n === nb ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div></div>
      <div class="sec"><div class="group glass">
      <div class="field"><input name="amount" inputmode="decimal" placeholder="Montant en € (facultatif)" value="${m && m.amount != null ? String(m.amount).replace('.', ',') : ''}"></div>
      <div class="field"><input name="forWhom" placeholder="Pour qui (facultatif, ex. Léa)" value="${esc(m ? m.forWhom || '' : '')}"></div>
      <div class="field"><input name="link" type="url" inputmode="url" autocapitalize="off" placeholder="Lien (facultatif, ex. page du produit)" value="${esc(m ? m.link || '' : '')}"></div></div></div>
      <div class="sec"><div class="group glass">
      <div class="field"><span class="flabel">Avec une date</span>${toggleHtml('hasDue', hasDue)}</div>
      <div class="field" data-due ${hasDue ? '' : 'hidden'}><span class="flabel">Le</span><input type="date" name="due" value="${m && m.due ? m.due : todayKey()}"></div>
      <div class="field" data-due ${hasDue ? '' : 'hidden'}><span class="flabel">Revient chaque mois</span>${toggleHtml('monthly', monthly)}</div></div></div>`,
    onMount: r => r.querySelector('[name=hasDue]').addEventListener('change', e => r.querySelectorAll('[data-due]').forEach(f => f.hidden = !e.target.checked)),
    onOk: r => {
      const item = m || { id: uid(), done: false };
      const has = val(r, 'hasDue');
      Object.assign(item, { title: val(r, 'title'), notebook: val(r, 'notebook'), amount: parseAmount(val(r, 'amount')), forWhom: val(r, 'forWhom'), link: val(r, 'link'),
        due: has ? val(r, 'due') || todayKey() : null, monthly: has && val(r, 'monthly') });
      item.freq = item.monthly ? 'Chaque mois' : 'Une seule fois';
      if (!m) S.maison.push(item);
      UI.notebook = item.notebook; changed();
    },
  });
}

// ================= Contacts =================
const hasContactPicker = 'contacts' in navigator && 'ContactsManager' in window;
function pageContacts() {
  const q = UI.contactSearch.trim().toLowerCase();
  const all = S.contacts.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const list = all.filter(c => !q || fold(c.name).includes(fold(q)) || fold(c.role).includes(fold(q)));
  const digits = p => (p || '').replace(/[^+0-9]/g, '');
  const rows = !all.length ? '<div class="empty">Ajoutez la nounou, le pédiatre, l\'école, les voisins… Vous les retrouverez ici.</div>'
    : !list.length ? '<div class="empty">Aucun contact ne correspond.</div>'
    : list.map(c => swipeRow(`${initials(c.name)}<div class="main" data-a="contactEdit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc([c.role, c.phone].filter(Boolean).join(' · '))}</div></div>
      <div style="display:flex;gap:8px">
      ${c.phone ? `<a class="round glass press halo" href="tel:${esc(digits(c.phone))}" aria-label="Appeler ${esc(c.name)}">${ic('phone', 16, 2)}</a>
      <a class="round glass press halo" href="sms:${esc(digits(c.phone))}" aria-label="Message à ${esc(c.name)}">${ic('message', 16, 2)}</a>` : ''}
      ${c.email ? `<a class="round glass press halo" href="mailto:${esc(c.email)}" aria-label="Écrire à ${esc(c.name)}">${ic('mail', 16, 2)}</a>` : ''}</div>`,
      [{ a: 'contactVcf', id: c.id, icon: 'personplus', label: 'Mes contacts', color: THEME.both }, swipeDel('contactDel', c.id)])).join('');
  return `<div class="scroll">
    <div class="sec"><div class="btnrow">
      ${hasContactPicker ? `<button class="btn glass press" data-a="contactPick">${ic('personplus', 18)}<span>Depuis mes contacts</span></button>` : ''}
      <button class="btn glass press" data-a="contactAdd">${ic('pencil', 18)}<span>Nouvelle fiche</span></button></div></div>
    ${all.length ? `<div class="sec"><div class="group glass"><div class="row">${ic('search', 18)}<input class="plain" id="contactSearch" placeholder="Chercher un nom ou un rôle" value="${esc(UI.contactSearch)}"></div></div></div>` : ''}
    ${section('Contacts du foyer', rows, all.length ? 'Touchez un nom pour modifier la fiche. Glissez vers la gauche pour l\'ajouter aux Contacts de l\'iPhone.' : '')}
  </div>`;
}
document.addEventListener('input', e => {
  if (e.target.id === 'contactSearch') {
    UI.contactSearch = e.target.value;
    const pos = e.target.selectionStart; render();
    const el = document.getElementById('contactSearch'); if (el) { el.focus(); el.setSelectionRange(pos, pos); }
  }
});
A.contactDel = d => { S.contacts = S.contacts.filter(c => c.id !== d.id); changed(); };
A.contactEdit = d => contactSheet(S.contacts.find(c => c.id === d.id));
A.contactAdd = () => contactSheet(null);
A.contactPick = async () => {
  try {
    const res = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true });
    for (const c of res) S.contacts.push({ id: uid(), name: (c.name && c.name[0]) || 'Sans nom', phone: (c.tel && c.tel[0]) || '', email: (c.email && c.email[0]) || '', role: '' });
    if (res.length) { changed(); toast(res.length > 1 ? res.length + ' contacts ajoutés' : 'Contact ajouté'); }
  } catch (e) { /* annulé */ }
};
A.contactVcf = d => { const c = S.contacts.find(x => x.id === d.id); if (c) vcf(c); };
function vcf(c) {
  const parts = c.name.split(' '), first = parts.shift() || '', last = parts.join(' ');
  const card = ['BEGIN:VCARD', 'VERSION:3.0', `N:${last};${first};;;`, `FN:${c.name}`, c.role ? `TITLE:${c.role}` : '', c.phone ? `TEL;TYPE=CELL:${c.phone}` : '', c.email ? `EMAIL:${c.email}` : '', 'END:VCARD'].filter(Boolean).join('\r\n');
  downloadFile((c.name || 'contact').replace(/[^\w\- ]/g, '') + '.vcf', card, 'text/vcard');
}
function contactSheet(c) {
  sheet({
    title: c ? 'Fiche contact' : 'Nouvelle fiche', ok: c ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="name" placeholder="Nom" autocomplete="name" value="${esc(c ? c.name : '')}" data-required ${c ? '' : 'autofocus'}></div>
      <div class="field"><input name="role" placeholder="Rôle (ex. nounou, pédiatre)" value="${esc(c ? c.role : '')}"></div></div>
      <div class="sec"><div class="group glass"><div class="field"><input name="phone" type="tel" placeholder="Téléphone" value="${esc(c ? c.phone : '')}"></div>
      <div class="field"><input name="email" type="email" autocapitalize="off" placeholder="E-mail" value="${esc(c ? c.email : '')}"></div></div></div>
      ${c ? '' : `<div class="sec"><div class="group glass"><div class="field"><span class="flabel">Ajouter aussi à mes contacts</span>${toggleHtml('also', false)}</div></div>
      <div class="sec-f">L'iPhone vous montrera la fiche à enregistrer dans Contacts.</div></div>`}`,
    onOk: r => {
      const item = c || { id: uid() };
      Object.assign(item, { name: val(r, 'name'), role: val(r, 'role'), phone: val(r, 'phone'), email: val(r, 'email') });
      if (!c) S.contacts.push(item);
      if (!c && val(r, 'also')) setTimeout(() => vcf(item), 450);
      changed();
    },
  });
}
