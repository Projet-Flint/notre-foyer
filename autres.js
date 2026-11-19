// Onglets Accueil, Travail, Projets, Finances, et Réglages.
'use strict';

function head(title, kicker, right = '') {
  return `<div class="head"><div>${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ''}<h1>${esc(title)}</h1></div>${right}</div>`;
}
function backHead(label, action, right = '') {
  return `<div class="head" style="align-items:center"><button class="backbtn glass press" data-a="${action}">${ic('back', 18, 2.2)}${esc(label)}</button>${right}</div>`;
}
A.back = () => { UI.view = UI.view && UI.view.parent ? UI.view.parent : null; render(); };
const fab = (action, label) => `<button class="fab btn prim press halo" data-a="${action}" aria-label="${esc(label)}">${ic('plus', 26, 2.2)}</button>`;

// ================= Accueil =================
function screenAccueil() {
  const now = new Date(), tk = todayKey();
  const events = eventsOn(tk);
  const todo = S.chores.filter(c => (!c.done && c.due && c.due <= tk) || (c.done && c.doneAt && dkey(new Date(c.doneAt)) === tk));
  const doneN = todo.filter(c => c.done).length;
  const shopN = S.shopping.filter(x => !x.done).length;
  const soon = S.dates.map(d => ({ d, n: nextOccurrence(d.date) })).filter(x => daysBetween(now, x.n) <= Math.max(14, x.d.delay || 0)).sort((a, b) => a.n - b.n);
  const [ms, me] = monthRange(now);
  const spent = expensesOf(now, 'Commun').reduce((s, e) => s + e.amount, 0);
  const budget = S.fin.budget;
  const proj = S.projects.filter(p => p.deadline && projectStatus(p) !== 'Terminés' && parseKey(p.deadline) >= startOfDay(now)).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const meals = S.meals[tk];
  const lessonsToday = lessonStats(lessonsBetween(startOfDay(now), addDays(startOfDay(now), 1)));

  const evRows = events.length ? events.map(e => `<div class="row" style="padding:9px 0"><b class="time" style="width:48px">${e.allDay ? 'Jour' : esc(e.start.slice(11, 16))}</b><span class="vbar" style="height:28px;background:${H.color(e.who)}"></span><span class="main t">${esc(e.title)}</span>${chip(e.who)}</div>`).join('')
    : '<div class="lbl" style="padding:8px 0 12px;font-size:14px">Rien de prévu aujourd\'hui.</div>';
  const taskRows = todo.length ? todo.slice(0, 5).map(c => `<div class="row ${c.done ? 'muted' : ''}" style="padding:8px 0">${checkBtn(c.done, 'choreToggle', c.id)}<span class="main t">${esc(c.title)}</span>${chip(c.who)}</div>`).join('')
    : '<div class="lbl" style="padding:8px 0 12px;font-size:14px">Aucune tâche prévue aujourd\'hui.</div>';
  const cardHead = (t, right, action) => `<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-size:16px;font-weight:700">${t}</h2>${right ? `<button class="lbl press" data-a="${action}" style="font-weight:600;color:var(--accent)">${right}</button>` : ''}</div>`;

  let tiles = '';
  tiles += budget > 0
    ? `<button class="tile glass press" data-a="goTab" data-v="finances" style="text-align:left"><span class="lbl">Budget restant</span><span class="big" style="${budget - spent < 0 ? 'color:var(--danger)' : ''}">${eur(Math.round(budget - spent))}</span>
        <div class="progress"><i style="width:${Math.min(100, 100 * spent / budget)}%;background:var(--accent)"></i></div><span class="lbl">sur ${eur(budget)} · ${daysBetween(now, me)} jours</span></button>`
    : `<button class="tile glass press" data-a="goTab" data-v="finances" style="text-align:left"><span class="lbl">Budget du mois</span><span style="font-weight:700;font-size:15px">À régler</span><span class="lbl">Touchez pour le définir dans Finances</span></button>`;
  tiles += proj
    ? `<button class="tile glass press" data-a="openProject" data-id="${proj.id}" style="text-align:left"><span class="lbl" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(proj.name)}</span>
        <div style="display:flex;align-items:baseline;gap:6px"><span class="big" style="color:${H.color(proj.who || BOTH)}">J-${daysBetween(now, parseKey(proj.deadline))}</span><span class="lbl">${esc(parseKey(proj.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))}</span></div>
        ${proj.goal ? `<div class="progress"><i style="width:${Math.min(100, 100 * (proj.saved || 0) / proj.goal)}%;background:${THEME.both}"></i></div><span class="lbl">${eur(proj.saved || 0)} sur ${eur(proj.goal)}</span>` : `<span class="lbl">${Math.round(100 * projectProgress(proj))} % fait</span>`}</button>`
    : `<button class="tile glass press" data-a="goTab" data-v="projets" style="text-align:left"><span class="lbl">Prochain projet</span><span style="font-weight:700;font-size:15px">Aucun pour l'instant</span><span class="lbl">Le compte à rebours s'affichera ici</span></button>`;

  return `<div class="screen">${head('Bonjour ' + H.me, cap(longDate(now)), `<button class="press" data-a="openSettings" aria-label="Réglages" style="display:flex">${avatar(H.p1, 36)}<span style="margin-left:-10px">${avatar(H.p2, 36)}</span></button>`)}
    <div class="scroll">
      <div class="sec"><div class="glass card" style="padding:14px 16px 6px">${cardHead('Agenda du jour', 'Voir tout', 'goAgenda')}${evRows}</div></div>
      <div class="sec"><div class="glass card" style="padding:14px 16px 6px">${cardHead('Tâches du jour', todo.length ? `${doneN} sur ${todo.length} faites` : 'Voir tout', 'goTaches')}${taskRows}</div></div>
      <div class="sec grid2">${tiles}</div>
      <div class="sec grid2">
        <button class="tile glass press" data-a="goCourses" style="text-align:left"><span class="lbl">Courses</span><span class="big">${shopN}</span><span class="lbl">article${shopN > 1 ? 's' : ''} à acheter</span></button>
        <button class="tile glass press" data-a="${meals ? 'openMeals' : 'goTabWork'}" style="text-align:left">${meals
          ? `<span class="lbl">Dîner ce soir</span><span style="font-weight:700;font-size:17px">${esc(meals.title || '…')}</span><span class="lbl">Repas de la semaine</span>`
          : `<span class="lbl">Travail aujourd'hui</span><span class="big">${hoursLabel(lessonsToday.h + workedSeconds(startOfDay(now), addDays(startOfDay(now), 1)) / 3600)}</span><span class="lbl">${lessonsToday.n} leçon${lessonsToday.n > 1 ? 's' : ''}</span>`}</button>
      </div>
      ${soon.length ? `<div class="sec"><div class="glass card" style="padding:14px 16px 6px">${cardHead('Dates à venir', 'Voir tout', 'goDates')}
        ${soon.slice(0, 3).map(({ d, n }) => { const k = daysBetween(now, n); return `<div class="row" style="padding:8px 0"><span style="width:44px;font-weight:800;color:var(--orange)" class="num">${k === 0 ? 'Auj.' : 'J-' + k}</span><span class="main t">${esc(d.title)}</span><span class="lbl">${esc(n.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))}</span></div>`; }).join('')}</div></div>` : ''}
    </div></div>`;
}
A.goTab = d => { UI.tab = d.v; UI.view = null; render(); };
A.goTabWork = () => { UI.tab = 'travail'; UI.view = null; render(); };
A.goAgenda = () => { UI.tab = 'famille'; UI.section = 'Agenda'; UI.day = todayKey(); UI.view = null; render(); };
A.goTaches = () => { UI.tab = 'famille'; UI.section = 'Tâches'; UI.view = null; render(); };
A.goCourses = () => { UI.tab = 'famille'; UI.section = 'Courses'; UI.view = null; render(); };
A.goDates = () => { UI.tab = 'famille'; UI.section = 'Dates'; UI.view = null; render(); };

// ================= Travail =================
const WORK_SEGS = ["Aujourd'hui", 'Horaires', 'Élèves', 'Notes'];
const PRIOS = { Haute: ['rgba(184,58,43,.14)', '#B5392A'], Moyenne: ['rgba(183,121,31,.16)', '#93600F'], Basse: ['rgba(20,60,50,.1)', 'var(--text2)'] };
function screenTravail() {
  const seg = UI.work;
  const lock = `<span class="lock glass">${ic('lock', 14, 2)}Visible par vous seul</span>`;
  let body = '', fabHtml = '';
  if (seg === "Aujourd'hui") { body = workToday(); fabHtml = fab('workAdd', 'Nouvelle priorité ou note'); }
  else if (seg === 'Horaires') body = workHoraires();
  else if (seg === 'Élèves') { body = workEleves(); fabHtml = fab('studentAdd', 'Nouvel élève'); }
  else { body = workNotes(); fabHtml = fab('noteAdd', 'Nouvelle note'); }
  return `<div class="screen">${head(seg === 'Horaires' ? 'Mes horaires' : 'Travail', cap(longDate(new Date())), seg === 'Horaires' ? '' : lock)}
    ${switcher(WORK_SEGS, seg, 'workSeg', { key: 'work', cls: 'small' })}
    <div class="scroll">${body}</div>${fabHtml}</div>`;
}
A.workSeg = d => { UI.work = d.v; render(); };

function workToday() {
  const t0 = startOfDay(new Date()), t1 = addDays(t0, 1), tk = todayKey();
  const dayHours = (a, b) => workedSeconds(a, b) / 3600 + lessonStats(lessonsBetween(a, b)).h;
  const todayH = dayHours(t0, t1), lessonH = lessonStats(lessonsBetween(t0, t1)).h;
  const ws = weekStart(t0);
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i); return { d, h: dayHours(d, addDays(d, 1)) }; }).filter((x, i) => i < 5 || x.h > 0);
  const maxH = Math.max(6, ...week.map(x => x.h));
  const running = !!S.work.running;
  const prios = S.work.priorities.filter(p => !p.done || p.doneDate === tk).sort((a, b) => a.done - b.done || ['Haute', 'Moyenne', 'Basse'].indexOf(a.prio) - ['Haute', 'Moyenne', 'Basse'].indexOf(b.prio));
  const doneN = prios.filter(p => p.done).length;
  const notes = S.work.notes.slice().sort((a, b) => b.at - a.at).slice(0, 2);
  return `<div class="sec"><div class="glass card" style="padding:14px 16px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;min-width:0"><div class="lbl" style="font-weight:600">Temps travaillé aujourd'hui</div>
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="num" style="font-size:28px;font-weight:800;letter-spacing:-.02em">${hoursLabel(todayH)}</span><button class="press" data-a="openBilan" style="font-size:12.5px;font-weight:700;color:var(--accent)">Bilan du mois ›</button></div>
        ${lessonH ? `<div class="lbl">dont ${hoursLabel(lessonH)} de leçons</div>` : ''}
        <div class="days5">${week.map(x => { const isT = dkey(x.d) === tk; return `<div><i style="height:${Math.max(4, 30 * x.h / maxH)}px;background:${isT ? H.color(H.me) : x.h ? rgba(H.color(H.me), .45) : 'var(--sep)'}"></i><span style="font-size:10px;${isT ? 'font-weight:700' : 'color:var(--text2)'}">${x.d.toLocaleDateString('fr-FR', { weekday: 'narrow' })}</span></div>`; }).join('')}</div></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <button class="btn prim press halo" data-a="timerToggle" aria-label="${running ? 'Mettre en pause' : 'Démarrer'}" style="width:60px;height:60px;padding:0;border-radius:30px">${ic(running ? 'pause' : 'play', 24)}</button>
        <span class="lbl">${running ? 'En cours' : workedSeconds(t0, t1) > 0 ? 'En pause' : 'Démarrer'}</span></div></div></div>
    <div class="sec"><div class="glass card" style="padding:6px 0 0">
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 16px 2px"><h2 style="margin:0;font-size:16px;font-weight:700">Priorités du jour</h2><span class="lbl">${prios.length ? `${doneN} sur ${prios.length}` : ''}</span></div>
      <div class="group">${prios.length ? prios.map(p => swipeRow(`${checkBtn(p.done, 'prioToggle', p.id)}<span class="main t">${esc(p.title)}</span><span class="prio" style="background:${PRIOS[p.prio][0]};color:${PRIOS[p.prio][1]}">${p.prio}</span>`,
        [swipeDel('prioDel', p.id)], `data-long="prioMenu" data-id="${p.id}"`).replace('class="content row"', `class="content row ${p.done ? 'muted' : ''}"`)).join('')
        : '<div class="empty">Touchez « + » pour noter vos priorités du jour.</div>'}</div></div></div>
    <div class="sec"><div class="sec-h">Notes rapides<button class="right press" data-a="workSeg" data-v="Notes">Tout voir</button></div>
      ${notes.length ? `<div class="grid2">${notes.map(n => `<button class="note-card glass press" data-a="noteEdit" data-id="${n.id}"><b>${esc(n.title || 'Note')}</b><span>${esc(n.body)}</span></button>`).join('')}</div>`
        : '<div class="glass card empty">Aucune note pour l\'instant.</div>'}</div>`;
}
A.timerToggle = () => {
  if (S.work.running) { S.work.sessions.push({ start: S.work.running, end: Date.now() }); S.work.running = null; toast('Pause'); }
  else { S.work.running = Date.now(); toast('C\'est parti'); }
  changed();
};
A.workAdd = () => menu(null, [{ label: 'Nouvelle priorité', icon: 'flag', fn: () => prioSheet(null) }, { label: 'Nouvelle note', icon: 'note', fn: () => noteSheet(null) }]);
A.prioToggle = d => { const p = S.work.priorities.find(x => x.id === d.id); if (!p) return;
  remainingAfter(() => { p.done = !p.done; p.doneDate = p.done ? todayKey() : null; }, () => S.work.priorities.filter(x => !x.done).length);
  if (p.done) haptic('success'); changed(); };
A.prioDel = d => { S.work.priorities = S.work.priorities.filter(x => x.id !== d.id); changed(); };
A.prioMenu = d => { const p = S.work.priorities.find(x => x.id === d.id); if (!p) return;
  menu(p.title, [{ label: 'Modifier', icon: 'pencil', fn: () => prioSheet(p) }, { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.prioDel(d) }]); };
function prioSheet(p) {
  sheet({ title: p ? 'Modifier' : 'Nouvelle priorité', ok: p ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="title" placeholder="Ex. : finir le rapport mensuel" value="${esc(p ? p.title : '')}" data-required autofocus></div></div>
      <div class="sec"><div class="sec-h">Importance</div>${seg('prio', ['Haute', 'Moyenne', 'Basse'], p ? p.prio : 'Moyenne')}</div>`,
    onOk: r => { const it = p || { id: uid(), done: false }; Object.assign(it, { title: val(r, 'title'), prio: segVal(r, 'prio') }); if (!p) S.work.priorities.push(it); changed(); } });
}

// ----- Horaires -----
function workHoraires() {
  const w = S.work, day = parseKey(UI.workDay), d0 = startOfDay(day), d1 = addDays(d0, 1);
  if (!w.types.length) return `<div class="glass card empty">Aucun type de cours. <button class="press" data-a="openTypes" style="color:var(--accent);font-weight:600">Personnaliser</button></div>`;
  if (!w.types.some(t => t.id === UI.selType)) UI.selType = w.types[0].id;
  const st = (a, b) => lessonStats(lessonsBetween(a, b));
  const sd = st(d0, d1), ws = weekStart(day), sw = st(ws, addDays(ws, 7)), [ma, mb] = monthRange(day), sm = st(ma, mb);
  const isToday = UI.workDay === todayKey();
  const lessons = lessonsBetween(d0, d1);
  const S0 = w.dayStart, E0 = w.dayEnd, ROW = 34;
  const hours = []; for (let h = S0; h < E0; h++) hours.push(h);
  const blocks = lessons.map(l => { const t = typeById(l.type), s = new Date(l.start), h = s.getHours() + s.getMinutes() / 60;
    const stu = l.student ? S.work.students.find(x => x.id === l.student) : null;
    return `<button class="block pop" data-a="lessonMenu" data-id="${l.id}" style="top:${14 + (h - S0) * ROW + 2}px;height:${Math.max(18, t.dur * ROW - 4)}px;background:${grad(t.color)}">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(stu ? stu.name : t.full)}</span><small>${fmtH(h)} – ${fmtH(h + t.dur)}</small></button>`; }).join('');
  const now = new Date(), nowH = now.getHours() + now.getMinutes() / 60;
  const link = UI.linkStudent && S.work.students.find(x => x.id === UI.linkStudent);
  return `<div class="daynav"><button class="iconbtn glass press" data-a="workDay" data-v="-1" aria-label="Jour précédent">${ic('back', 18, 2.2)}</button>
      <button class="d press" data-a="workDay" data-v="0">${esc(cap(dayLabel(day)))}</button>
      <button class="iconbtn glass press" data-a="workDay" data-v="1" aria-label="Jour suivant">${ic('chev', 18, 2.2)}</button></div>
    <div class="glass" style="border-radius:20px;padding:10px 12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
      ${[[isToday ? "Aujourd'hui" : 'Ce jour', sd], ['Semaine', sw], [cap(monthName(day)), sm]].map(([l, s], i) => `<div style="${i ? 'border-left:1px solid var(--sep);padding-left:10px' : ''}"><div class="lbl" style="font-weight:600">${l}</div><div style="font-size:17px;font-weight:800" class="num">${hoursLabel(s.h)}</div><div style="font-size:13px;font-weight:700;color:var(--accent)" class="num">${eur(Math.round(s.e))}</div></div>`).join('')}</div>
    ${w.types.some(t => t.fav) ? `<div style="display:flex;gap:8px;margin-top:10px">${w.types.filter(t => t.fav).map(t => `<button class="fav press" data-a="lessonNow" data-id="${t.id}" style="background:${grad(t.color)}">${ic('star', 15)}<span>${esc(t.label)} maintenant</span></button>`).join('')}</div>` : ''}
    ${link ? `<div class="banner glass" style="margin-top:10px">${ic('person', 18)}<span style="flex:1">Touchez une heure pour la leçon de <b>${esc(link.name)}</b>.</span><button class="press" data-a="cancelLink" style="color:var(--accent);font-weight:600">Annuler</button></div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 4px 8px"><b style="font-size:14px">1. Choisissez · 2. Touchez une heure</b><button class="lbl press" data-a="openTypes" style="font-weight:700;color:var(--accent)">Personnaliser</button></div>
    <div class="types">${w.types.map(t => { const on = t.id === UI.selType;
      return `<button class="type press ${on ? 'on' : ''}" data-a="pickType" data-id="${t.id}" style="${on ? `background:${grad(t.color)};box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 14px ${rgba(t.color, .4)}` : ''}"><span>${esc(t.label)}</span><small>${durLabel(t.dur)} · ${t.rate} €/h</small></button>`; }).join('')}</div>
    <div class="planning glass" style="margin-top:12px">
      ${hours.map(h => `<button class="hour" data-a="hourTap" data-v="${h}" aria-label="Ajouter à ${h} h"><span>${h}:00</span></button>`).join('')}
      ${isToday && nowH >= S0 && nowH <= E0 ? `<div class="nowline" style="top:${14 + (nowH - S0) * ROW}px"></div>` : ''}
      ${blocks}
    </div>
    <div class="hint">Touchez le haut d'une case pour l'heure pile, le bas pour la demie. Touchez une leçon pour la lier à un élève ou la retirer.</div>`;
}
A.workDay = d => { const n = +d.v; UI.workDay = n === 0 ? todayKey() : dkey(addDays(parseKey(UI.workDay), n)); render(); };
A.pickType = d => { UI.selType = d.id; render(); };
A.cancelLink = () => { UI.linkStudent = null; render(); };
function clash(startH, dur, day, ignoreId) {
  const d0 = startOfDay(day);
  return lessonsBetween(d0, addDays(d0, 1)).some(l => { if (l.id === ignoreId) return false; const s = new Date(l.start), h = s.getHours() + s.getMinutes() / 60, o = typeById(l.type).dur; return startH < h + o - 1e-6 && h < startH + dur - 1e-6; });
}
function addLesson(t, startH, day, student) {
  if (clash(startH, t.dur, day)) { toast('Ce créneau est déjà pris'); return false; }
  const d = startOfDay(day); d.setMinutes(Math.round(startH * 60));
  S.work.lessons.push({ id: uid(), type: t.id, start: d.toISOString(), student: student || null });
  UI.linkStudent = null;
  haptic('success'); changed();
  const stu = student && S.work.students.find(x => x.id === student);
  toast(`${t.full} à ${fmtH(startH)}${stu ? ' avec ' + stu.name : ''} ajoutée`);
  return true;
}
function withStudent(t, cb) {
  if (UI.linkStudent) return cb(UI.linkStudent);
  if (!t.ask || !S.work.students.length) return cb(null);
  menu('Pour quel élève ?', S.work.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(s => ({ label: s.name, icon: 'person', fn: () => cb(s.id) }))
    .concat([{ label: 'Sans élève', fn: () => cb(null) }]));
}
A.hourTap = (d, el, ev) => {
  const t = typeById(UI.selType); let h = +d.v;
  const r = el.getBoundingClientRect();
  if (ev && ev.clientY - r.top > r.height / 2) h += .5;
  if (h + t.dur > S.work.dayEnd + 1e-6) { toast('Trop tard pour un ' + t.full.toLowerCase()); return; }
  if (clash(h, t.dur, parseKey(UI.workDay))) { toast('Ce créneau est déjà pris'); return; }
  withStudent(t, stu => addLesson(t, h, parseKey(UI.workDay), stu));
};
A.lessonNow = d => {
  const t = typeById(d.id), now = new Date();
  const h = now.getHours() + Math.round(now.getMinutes() / 5) * 5 / 60;
  UI.workDay = todayKey();
  withStudent(t, stu => addLesson(t, h, now, stu));
};
A.lessonMenu = d => {
  const l = S.work.lessons.find(x => x.id === d.id); if (!l) return;
  const t = typeById(l.type), s = new Date(l.start);
  const stu = l.student && S.work.students.find(x => x.id === l.student);
  menu(`${t.full} · ${hm(s)}${stu ? ' · ' + stu.name : ''}`, [
    { label: stu ? 'Changer d\'élève' : 'Lier à un élève', icon: 'person', fn: () => {
      if (!S.work.students.length) { toast('Ajoutez d\'abord un élève dans « Élèves »'); return; }
      menu('Quel élève ?', S.work.students.map(x => ({ label: x.name, fn: () => { l.student = x.id; changed(); } })).concat(stu ? [{ label: 'Aucun élève', fn: () => { l.student = null; changed(); } }] : []));
    } },
    { label: 'Changer de type', icon: 'swap', fn: () => menu('Type de leçon', S.work.types.map(x => ({ label: x.full, fn: () => {
      if (clash(s.getHours() + s.getMinutes() / 60, x.dur, s, l.id)) { toast('Ce créneau est déjà pris'); return; } l.type = x.id; changed(); } }))) },
    { label: 'Retirer la leçon', icon: 'trash', danger: true, fn: () => { S.work.lessons = S.work.lessons.filter(x => x.id !== l.id); changed(); toast(t.full + ' retirée'); } },
  ]);
};

// ----- Personnaliser mes cours -----
A.openTypes = () => { UI.view = { name: 'types', sel: UI.selType }; render(); };
const DURS = [[0.75, '45 min'], [1, '1 h'], [1.5, '1 h 30'], [2, '2 h'], [3, '3 h']];
function viewTypes() {
  const w = S.work; let t = w.types.find(x => x.id === UI.view.sel) || w.types[0];
  if (t) UI.view.sel = t.id;
  const hoursOpt = (cur, from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i).map(h => `<option value="${h}" ${h === cur ? 'selected' : ''}>${h}:00</option>`).join('');
  return `<div class="screen">${backHead('Horaires', 'back')}<div class="scroll">
    <h1 style="margin:2px 4px 8px;font-size:30px;font-weight:800">Mes cours</h1>
    <div class="hscroll">${w.types.map(x => `<button class="capsule glass press ${x.id === (t && t.id) ? 'sel' : ''}" style="${x.id === (t && t.id) ? selVars(x.color) : ''}" data-a="typeSel" data-id="${x.id}">${esc(x.label)}</button>`).join('')}
      <button class="capsule glass press" data-a="typeAdd">${ic('plus', 16, 2.2)}Nouveau type</button></div>
    ${t ? `<div class="sec"><div class="group glass">
      <div class="field"><span class="flabel">Nom court</span><input data-bind="type.label" value="${esc(t.label)}" style="text-align:right"></div>
      <div class="field"><span class="flabel">Nom complet</span><input data-bind="type.full" value="${esc(t.full)}" style="text-align:right"></div>
      <div class="field col"><span class="flabel">Couleur</span><div class="palette">${PALETTE.map(c => `<button class="${c.toUpperCase() === t.color.toUpperCase() ? 'on' : ''}" style="background:${c};--c:${c}" data-a="typeColor" data-v="${c}" aria-label="Couleur ${c}"></button>`).join('')}</div></div>
      <div class="field col"><span class="flabel">Durée</span><div class="seg" data-bindseg="type.dur">${DURS.map(([v, l]) => `<button type="button" class="${v === t.dur ? 'on' : ''}" data-a="typeDur" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="flabel">Tarif horaire</span><input data-bind="type.rate" inputmode="decimal" value="${t.rate}" style="text-align:right;color:var(--accent);font-weight:700"><span class="lbl">€ / heure</span></div></div></div>
    <div class="sec"><div class="group glass">
      <div class="field"><span class="flabel">Favori : un appui lance la leçon</span><label class="toggle"><input type="checkbox" data-bind="type.fav" ${t.fav ? 'checked' : ''}><i></i></label></div>
      <div class="field"><span class="flabel">Demander le nom de l'élève</span><label class="toggle"><input type="checkbox" data-bind="type.ask" ${t.ask ? 'checked' : ''}><i></i></label></div>
      <div class="field"><span class="flabel">Compter dans mes heures et mes gains</span><label class="toggle"><input type="checkbox" data-bind="type.count" ${t.count ? 'checked' : ''}><i></i></label></div></div></div>
    <div class="sec"><button class="btn glass wide press danger" data-a="typeDel">${ic('trash', 18)}Supprimer ce type</button></div>` : ''}
    <div class="sec"><div class="sec-h">Ma journée de travail</div><div class="group glass">
      <div class="field"><span class="flabel">Début</span><select data-bind="work.dayStart">${hoursOpt(w.dayStart, 5, 14)}</select></div>
      <div class="field"><span class="flabel">Fin</span><select data-bind="work.dayEnd">${hoursOpt(w.dayEnd, 12, 24)}</select></div></div>
      <div class="sec-f">Ces heures règlent le planning de « Mes horaires ».</div></div>
  </div></div>`;
}
A.typeSel = d => { UI.view.sel = d.id; render(); };
A.typeAdd = () => { const t = { id: uid(), label: 'Nouveau', full: 'Nouvelle leçon', dur: 1, rate: 30, color: PALETTE[(S.work.types.length * 3) % PALETTE.length], fav: false, ask: false, count: true };
  S.work.types.push(t); UI.view.sel = t.id; changed(); };
A.typeColor = d => { const t = typeById(UI.view.sel); t.color = d.v; changed(); };
A.typeDur = d => { const t = typeById(UI.view.sel); t.dur = +d.v; changed(); };
A.typeDel = () => { const t = typeById(UI.view.sel);
  dialog({ title: `Supprimer « ${t.label} » ?`, text: 'Les leçons déjà notées restent dans vos heures.', ok: 'Supprimer', danger: true, onOk: () => { S.work.types = S.work.types.filter(x => x.id !== t.id); UI.view.sel = null; changed(); } }); };
// Champs liés (modifiés directement)
document.addEventListener('change', e => {
  const b = e.target.dataset && e.target.dataset.bind; if (!b) return;
  const [obj, field] = b.split('.');
  let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (obj === 'type') {
    const t = typeById(UI.view.sel);
    if (field === 'rate') v = parseAmount(v) || 0;
    if ((field === 'label' || field === 'full') && !String(v).trim()) { render(); return; }
    t[field] = v;
  } else if (obj === 'work') {
    v = +v; S.work[field] = v;
    if (S.work.dayEnd <= S.work.dayStart) S.work.dayEnd = S.work.dayStart + 1;
  } else if (obj === 'student') {
    const s = S.work.students.find(x => x.id === UI.view.id); if (s) s[field] = v;
  } else if (obj === 'project') {
    const p = S.projects.find(x => x.id === UI.view.id); if (p) { if (field === 'autoValue') { p.auto = p.auto || { on: true, mode: 'fixed' }; p.auto.value = parseAmount(v) || 0; } else p[field] = v; }
  } else if (obj === 'settings') {
    renamePerson(field, String(v).trim());
  }
  haptic(); changed();
});

// ----- Élèves -----
const LEVELS = [['Violet', 'découverte', '#7A5AC8'], ['Rouge', 'débutant', '#E05A4F'], ['Orange', 'intermédiaire', '#E89A3C'], ['Vert', 'confirmé', '#3FA34D'], ['Jaune', 'avancé', '#E0B100']];
function workEleves() {
  const list = S.work.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const rows = list.length ? list.map(s => {
    const ls = S.work.lessons.filter(l => l.student === s.id), lv = LEVELS[(s.level || 1) - 1];
    return `<button class="row press" data-a="openStudent" data-id="${s.id}" style="width:100%;text-align:left">${initials(s.name, H.color(H.me))}<div class="main"><div class="t">${esc(s.name)}</div><div class="s">${esc(lv[0])} · ${ls.length} leçon${ls.length > 1 ? 's' : ''}</div></div>${ic('chev', 16, 2)}</button>`;
  }).join('') : '<div class="empty">Ajoutez vos élèves : niveau, contact du parent, notes de progrès et historique des leçons.</div>';
  return section('Mes élèves', rows, list.length ? 'Une leçon notée dans « Mes horaires » peut être liée à un élève.' : '');
}
A.studentAdd = () => studentSheet(null);
A.openStudent = d => { UI.view = { name: 'eleve', id: d.id }; render(); };
function studentSheet(s) {
  sheet({ title: s ? 'Modifier l\'élève' : 'Nouvel élève', ok: s ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="name" placeholder="Prénom et nom" value="${esc(s ? s.name : '')}" data-required autofocus></div>
      <div class="field"><input name="info" placeholder="Infos (ex. 12 ans, leçons individuelles)" value="${esc(s ? s.info || '' : '')}"></div></div>
      <div class="sec"><div class="sec-h">Contact</div><div class="group glass">
      <div class="field"><input name="parent" placeholder="Parent ou contact (facultatif)" value="${esc(s ? s.parent || '' : '')}"></div>
      <div class="field"><input name="phone" type="tel" placeholder="Téléphone" value="${esc(s ? s.phone || '' : '')}"></div></div></div>
      <div class="sec"><div class="sec-h">Niveau</div>${seg('level', LEVELS.map((l, i) => [i + 1, l[0]]), s ? s.level || 1 : 1)}</div>`,
    onOk: r => { const it = s || { id: uid(), since: todayKey(), notes: '' };
      Object.assign(it, { name: val(r, 'name'), info: val(r, 'info'), parent: val(r, 'parent'), phone: val(r, 'phone'), level: +segVal(r, 'level') });
      if (!s) S.work.students.push(it); changed(); } });
}
function viewEleve() {
  const s = S.work.students.find(x => x.id === UI.view.id);
  if (!s) { UI.view = null; return screenTravail(); }
  const lv = s.level || 1, L = LEVELS[lv - 1];
  const ls = S.work.lessons.filter(l => l.student === s.id).sort((a, b) => b.start.localeCompare(a.start));
  const hours = ls.reduce((a, l) => a + typeById(l.type).dur, 0), now = new Date();
  const tel = (s.phone || '').replace(/[^+0-9]/g, '');
  const since = s.since ? parseKey(s.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '';
  return `<div class="screen">${backHead('Élèves', 'back', `<button class="lbl press" data-a="studentEdit" style="font-weight:600;font-size:15px;color:var(--accent)">Modifier</button>`)}<div class="scroll">
    <div class="sec" style="display:flex;align-items:center;gap:14px">${initials(s.name, H.color(H.me), 64)}<div style="min-width:0"><h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-.02em">${esc(s.name)}</h1><div class="lbl" style="font-size:13px">${esc([s.info, since ? 'depuis ' + since : ''].filter(Boolean).join(' · '))}</div></div></div>
    <div class="sec btnrow">
      <a class="btn glass press" href="${tel ? 'tel:' + esc(tel) : '#'}" ${tel ? '' : 'data-a="noPhone"'} style="flex-direction:column;gap:2px;height:52px;font-size:11.5px;color:var(--text)"><span style="color:var(--accent)">${ic('phone', 18)}</span>Appeler</a>
      <a class="btn glass press" href="${tel ? 'sms:' + esc(tel) : '#'}" ${tel ? '' : 'data-a="noPhone"'} style="flex-direction:column;gap:2px;height:52px;font-size:11.5px;color:var(--text)"><span style="color:var(--accent)">${ic('message', 18)}</span>Message</a>
      <button class="btn press sel" data-a="studentLesson" style="${selVars(H.color(H.me))};flex-direction:column;gap:2px;height:52px;font-size:11.5px">${ic('plus', 18, 2)}Leçon</button></div>
    <div class="sec"><div class="glass card" style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between"><b style="font-size:15px">Niveau</b><span class="lbl" style="font-weight:600;color:${L[2]}">${L[0]} · ${L[1]}</span></div>
      <div style="display:flex;gap:4px">${LEVELS.map((l, i) => `<button class="lvl press" data-a="studentLevel" data-v="${i + 1}" aria-label="Niveau ${l[0]}" style="${i < lv ? `background:${l[2]}` : ''}"></button>`).join('')}</div>
      ${s.parent || s.phone ? `<div class="lbl">${esc([s.parent ? 'Contact : ' + s.parent : '', s.phone].filter(Boolean).join(' · '))}</div>` : ''}</div></div>
    <div class="sec"><div class="glass card" style="padding:12px 16px"><b style="font-size:15px">Notes de progrès</b>
      <textarea class="plain" data-bind="student.notes" rows="3" placeholder="Ce qui progresse, ce qu'il reste à travailler…" style="width:100%;border:0;background:transparent;outline:none;resize:none;margin-top:6px;font-size:15px;line-height:1.45">${esc(s.notes || '')}</textarea></div></div>
    <div class="sec"><div class="glass card" style="padding:4px 16px">
      <div style="display:flex;justify-content:space-between;padding-top:10px"><b style="font-size:15px">Historique</b><span class="lbl">${ls.length} leçon${ls.length > 1 ? 's' : ''} · ${hoursLabel(hours)}</span></div>
      ${ls.length ? ls.slice(0, 30).map(l => { const d = new Date(l.start), t = typeById(l.type);
        return `<div class="row" style="padding:10px 0;min-height:0"><span style="width:8px;height:8px;border-radius:4px;background:${t.color}"></span><span class="main t">${esc(cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })))} · ${hm(d)}</span><span class="lbl">${d > now ? 'Prochaine' : esc(t.label)}</span></div>`; }).join('')
        : '<div class="lbl" style="padding:10px 0 12px">Aucune leçon liée pour l\'instant.</div>'}</div></div>
    <div class="sec"><button class="btn glass wide press danger" data-a="studentDel">${ic('trash', 18)}Supprimer l'élève</button></div>
  </div></div>`;
}
A.noPhone = () => toast('Ajoutez un téléphone avec « Modifier »');
A.studentEdit = () => studentSheet(S.work.students.find(x => x.id === UI.view.id));
A.studentLevel = d => { const s = S.work.students.find(x => x.id === UI.view.id); if (s) { s.level = +d.v; haptic(); changed(); } };
A.studentLesson = () => { UI.linkStudent = UI.view.id; UI.work = 'Horaires'; UI.view = null; render(); };
A.studentDel = () => { const s = S.work.students.find(x => x.id === UI.view.id); if (!s) return;
  dialog({ title: `Supprimer ${s.name} ?`, text: 'Les leçons restent dans vos heures.', ok: 'Supprimer', danger: true, onOk: () => {
    S.work.students = S.work.students.filter(x => x.id !== s.id); S.work.lessons.forEach(l => { if (l.student === s.id) l.student = null; }); UI.view = null; changed(); } }); };

// ----- Notes -----
function workNotes() {
  const notes = S.work.notes.slice().sort((a, b) => b.at - a.at);
  return notes.length ? `<div class="sec grid2">${notes.map(n => `<button class="note-card glass press" data-a="noteEdit" data-id="${n.id}" style="min-height:96px"><b>${esc(n.title || 'Note')}</b><span>${esc(n.body)}</span></button>`).join('')}</div>`
    : '<div class="sec glass card empty">Notez ici les idées, codes, infos à retenir. Touchez « + ».</div>';
}
A.noteAdd = () => noteSheet(null);
A.noteEdit = d => noteSheet(S.work.notes.find(n => n.id === d.id));
function noteSheet(n) {
  sheet({ title: n ? 'Note' : 'Nouvelle note', ok: n ? 'OK' : 'Ajouter',
    body: `<div class="group glass"><div class="field"><input name="title" placeholder="Titre" value="${esc(n ? n.title : '')}" ${n ? '' : 'autofocus'}></div>
      <div class="field"><textarea name="body" rows="7" placeholder="Votre note…" style="min-height:160px">${esc(n ? n.body : '')}</textarea></div></div>
      ${n ? `<div class="sec"><button class="btn glass wide danger" data-note-del>${ic('trash', 18)}Supprimer la note</button></div>` : ''}`,
    onMount: r => { const b = r.querySelector('[data-note-del]'); if (b) b.addEventListener('click', () => { S.work.notes = S.work.notes.filter(x => x.id !== n.id); closeLayer(r); changed(); }); },
    onOk: r => { const title = val(r, 'title'), body = val(r, 'body'); if (!title && !body) return;
      const it = n || { id: uid() }; Object.assign(it, { title, body, at: Date.now() }); if (!n) S.work.notes.push(it); changed(); } });
}

// ----- Bilan du mois -----
A.openBilan = () => { UI.view = { name: 'bilan' }; UI.bilanMonth = dkey(new Date()); render(); };
function viewBilan() {
  const m = parseKey(UI.bilanMonth), [a, b] = monthRange(m), prev = monthRange(addMonths(m, -1));
  const list = lessonsBetween(a, b), st = lessonStats(list), sp = lessonStats(lessonsBetween(prev[0], prev[1]));
  const diff = sp.e > 0 ? Math.round(100 * (st.e - sp.e) / sp.e) : null;
  const byType = S.work.types.map(t => { const l = list.filter(x => x.type === t.id); return { t, h: l.length * t.dur, e: l.length * t.dur * t.rate, n: l.length }; }).filter(x => x.n && x.t.count);
  const totH = byType.reduce((s, x) => s + x.h, 0) || 1;
  const weeks = []; let ws = weekStart(a);
  while (ws < b) { const we = addDays(ws, 7); const l = lessonsBetween(ws < a ? a : ws, we > b ? b : we);
    weeks.push({ label: 'S' + (weeks.length + 1), parts: S.work.types.map(t => ({ c: t.color, h: l.filter(x => x.type === t.id && t.count).length * t.dur })), h: lessonStats(l).h, future: ws > new Date() }); ws = we; }
  const maxW = Math.max(1, ...weeks.map(w => w.h));
  return `<div class="screen">${backHead('Travail', 'back')}<div class="scroll">
    <div class="sec" style="display:flex;align-items:flex-end;justify-content:space-between"><div><div class="kicker" style="font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text2)">Bilan du mois</div><h1 style="margin:4px 0 0;font-size:30px;font-weight:800">${esc(cap(m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</h1></div>
      <div style="display:flex;gap:6px"><button class="iconbtn glass press" data-a="bilanMonth" data-v="-1" aria-label="Mois précédent">${ic('back', 18, 2.2)}</button><button class="iconbtn glass press" data-a="bilanMonth" data-v="1" aria-label="Mois suivant">${ic('chev', 18, 2.2)}</button></div></div>
    <div class="sec"><div class="glass card" style="padding:14px 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
      <div><div class="lbl" style="font-weight:600">Heures</div><div class="num" style="font-size:22px;font-weight:800">${hoursLabel(st.h)}</div></div>
      <div><div class="lbl" style="font-weight:600">Gains estimés</div><div class="num" style="font-size:22px;font-weight:800;color:var(--accent)">${eur(Math.round(st.e))}</div></div>
      <div><div class="lbl" style="font-weight:600">Leçons</div><div class="num" style="font-size:22px;font-weight:800">${st.n}</div></div>
      ${diff != null ? `<div class="lbl" style="grid-column:span 3;color:${diff >= 0 ? 'var(--accent)' : 'var(--orange)'};font-weight:600">${diff >= 0 ? '+' : ''}${diff} % par rapport à ${monthName(prev[0])}</div>` : ''}</div></div>
    <div class="sec"><div class="glass card" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px"><b style="font-size:15px">Par type de cours</b>
      ${byType.length ? `<div class="bar" style="height:14px;border-radius:7px;gap:2px">${byType.map(x => `<i style="width:${100 * x.h / totH}%;background:${grad(x.t.color)};border-radius:0"></i>`).join('')}</div>
      ${byType.map(x => `<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600"><span style="width:10px;height:10px;border-radius:5px;background:${x.t.color}"></span>${esc(x.t.label)} · ${hoursLabel(x.h)} · ${eur(Math.round(x.e))}</div>`).join('')}`
        : '<div class="lbl">Aucune leçon ce mois-ci.</div>'}</div></div>
    <div class="sec"><div class="glass card" style="padding:14px 16px"><b style="font-size:15px">Par semaine</b>
      <div class="wkbars">${weeks.map(w => `<div class="wk"><div class="stack" style="height:${Math.max(4, 90 * w.h / maxW)}px;${w.future ? 'opacity:.55' : ''}">${w.parts.filter(p => p.h).map(p => `<i style="flex:${p.h};background:${p.c}"></i>`).join('')}</div><span class="lbl" style="font-size:11px">${w.label} · ${Math.round(w.h)} h</span></div>`).join('')}</div></div></div>
    <div class="sec"><div class="glass card" style="padding:12px 16px;display:flex;align-items:center;gap:12px">
      <div style="flex:1"><b style="font-size:14px">Envoyer dans Finances</b><div class="lbl" style="margin-top:2px">Les gains estimés s'affichent dans les revenus du mois</div></div>
      <label class="toggle"><input type="checkbox" data-a="toFinances" ${S.work.toFinances ? 'checked' : ''}><i></i></label></div></div>
    <div class="hint">Les gains sont estimés d'après vos tarifs : l'encaissement se fait hors de l'app.</div>
  </div></div>`;
}
A.bilanMonth = d => { UI.bilanMonth = dkey(addMonths(parseKey(UI.bilanMonth), +d.v)); render(); };
A.toFinances = (d, el) => { S.work.toFinances = el.checked; changed(); };

// ================= Projets =================
const PROJ_TABS = ['En cours', 'À venir', 'Terminés'];
function screenProjets() {
  const list = S.projects.filter(p => projectStatus(p) === UI.projFilter);
  const enCours = S.projects.filter(p => projectStatus(p) === 'En cours').length;
  const cards = list.length ? list.map(p => {
    const pr = projectProgress(p), done = p.steps.filter(s => s.done).length;
    const dl = p.deadline ? cap(parseKey(p.deadline).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) : 'Sans échéance';
    const people = p.who === BOTH || !p.who ? [H.p1, H.p2] : [p.who];
    return `<button class="glass card press" data-a="openProject" data-id="${p.id}" style="display:block;width:100%;text-align:left;padding:14px 16px;margin-top:12px">
      <div style="display:flex;align-items:center;gap:10px"><div style="flex:1;min-width:0"><div style="font-size:17px;font-weight:700">${esc(p.name)}</div><div class="lbl" style="font-size:13px">${esc(dl)} · ${done} étape${done > 1 ? 's' : ''} sur ${p.steps.length}</div></div>
        <div style="display:flex">${people.map((n, i) => `<span style="${i ? 'margin-left:-10px' : ''}">${avatar(n, 30)}</span>`).join('')}</div></div>
      <div class="progress" style="margin:12px 0 8px;height:8px;border-radius:4px"><i style="width:${100 * pr}%;background:${grad(H.color(p.who || BOTH))}"></i></div>
      <div class="lbl" style="font-weight:600">${Math.round(100 * pr)} % fait${p.goal ? ` · ${eur(p.saved || 0)} / ${eur(p.goal)} épargnés` : ' · pas de budget'}</div></button>`;
  }).join('') : `<div class="glass card empty" style="margin-top:12px">${UI.projFilter === 'En cours' ? 'Vos projets à deux : vacances, travaux, déménagement… Touchez « + » pour partir d\'un modèle.' : UI.projFilter === 'À venir' ? 'Aucun projet à venir.' : 'Aucun projet terminé pour l\'instant.'}</div>`;
  return `<div class="screen">${head('Projets', 'À deux', `<span class="lbl" style="font-weight:600;padding-bottom:6px">${enCours} en cours</span>`)}
    ${switcher(PROJ_TABS, UI.projFilter, 'projFilter', { key: 'proj' })}
    <div class="scroll">${cards}</div>${fab('projectNew', 'Nouveau projet')}</div>`;
}
A.projFilter = d => { UI.projFilter = d.v; render(); };
A.openProject = d => { UI.tab = 'projets'; UI.view = { name: 'projet', id: d.id }; render(); };
A.projectNew = () => {
  let tpl = 'Vacances';
  const tplGrid = () => `<div class="grid2">${Object.entries(TEMPLATES).map(([k, t]) => `<button type="button" class="tile glass press ${k === tpl ? 'sel' : ''}" data-tpl="${k}" style="text-align:left;${k === tpl ? selVars(THEME.accent) : ''}">
      ${ic(t.icon, 22)}<b style="font-size:15px">${k}</b><small style="font-size:12px;opacity:.85">${t.steps.length ? t.steps.length + ' étapes' : 'à votre façon'}${t.budget ? ' · budget' : ''}</small></button>`).join('')}</div>`;
  const steps = () => TEMPLATES[tpl].steps.map((s, i) => `<div class="field"><span style="flex:1">${esc(s)}</span><label class="toggle"><input type="checkbox" name="step${i}" checked><i></i></label></div>`).join('');
  sheet({ title: 'Nouveau projet', ok: 'Créer', full: true,
    body: `<div class="sec-h">Partir d'un modèle</div><div data-tplgrid>${tplGrid()}</div>
      <div class="sec"><div class="group glass"><div class="field"><input name="name" placeholder="Nom du projet" value="Vacances" data-required></div>
        <div class="field"><span class="flabel">Échéance</span><input type="date" name="deadline"></div>
        <div class="field"><input name="goal" inputmode="decimal" placeholder="Objectif d'épargne en € (facultatif)"></div></div></div>
      <div class="sec"><div class="sec-h">Qui s'en occupe</div>${whoSeg('who', BOTH)}</div>
      <div class="sec" data-stepsec><div class="sec-h">Étapes prêtes à l'emploi</div><div class="group glass" data-steps>${steps()}</div>
        <div class="sec-f">Décochez ce qui ne vous sert pas. Un objectif d'épargne apparaît aussi dans Finances.</div></div>`,
    onMount: r => r.querySelector('[data-tplgrid]').addEventListener('click', e => {
      const b = e.target.closest('[data-tpl]'); if (!b) return; haptic();
      const nameEl = r.querySelector('[name=name]'); if (!nameEl.value || TEMPLATES[nameEl.value]) nameEl.value = b.dataset.tpl === 'Projet vide' ? '' : b.dataset.tpl;
      tpl = b.dataset.tpl; r.querySelector('[data-tplgrid]').innerHTML = tplGrid(); r.querySelector('[data-steps]').innerHTML = steps();
      r.querySelector('[data-stepsec]').hidden = !TEMPLATES[tpl].steps.length; nameEl.dispatchEvent(new Event('input', { bubbles: true }));
    }),
    onOk: r => {
      const who = segVal(r, 'who');
      const p = { id: uid(), name: val(r, 'name'), template: tpl, deadline: val(r, 'deadline') || null, goal: parseAmount(val(r, 'goal')) || 0, saved: 0, who, status: 'En cours',
        steps: TEMPLATES[tpl].steps.filter((s, i) => val(r, 'step' + i)).map(s => ({ id: uid(), title: s, done: false, who })), photos: [], notes: '', description: '', auto: { on: false, mode: 'pct', value: 10 } };
      S.projects.push(p); UI.projFilter = 'En cours'; UI.view = { name: 'projet', id: p.id }; changed();
    } });
};
function viewProjet() {
  const p = S.projects.find(x => x.id === UI.view.id);
  if (!p) { UI.view = null; return screenProjets(); }
  const now = new Date(), pr = projectProgress(p), done = p.steps.filter(s => s.done).length;
  const days = p.deadline ? daysBetween(now, parseKey(p.deadline)) : null;
  const people = p.who === BOTH || !p.who ? [H.p1, H.p2] : [p.who];
  const a = p.auto || { on: false, mode: 'pct', value: 10 };
  const thisWeek = autoAmountForWeek(Object.assign({}, p, { auto: Object.assign({}, a, { on: true }) }), weekStart(now));
  let projection = '';
  if (p.goal && (p.saved || 0) < p.goal && a.on) {
    const perWeek = a.mode === 'fixed' ? (a.value || 0) : Math.round(lessonStats(lessonsBetween(addDays(weekStart(now), -28), weekStart(now))).e / 4 * (a.value || 0) / 100);
    if (perWeek > 0) { const weeks = Math.ceil((p.goal - (p.saved || 0)) / perWeek); projection = `À ce rythme (${eur(perWeek)} par semaine), objectif atteint vers ${addDays(now, weeks * 7).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.`; }
  }
  return `<div class="screen">${backHead('Projets', 'back', `<div style="display:flex;align-items:center;gap:8px"><div style="display:flex">${people.map((n, i) => `<span style="${i ? 'margin-left:-10px' : ''}">${avatar(n, 32)}</span>`).join('')}</div>
      <button class="iconbtn glass press" data-a="projectMenu" aria-label="Options">${ic('pencil', 18)}</button></div>`)}<div class="scroll">
    <div class="sec"><h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-.02em">${esc(p.name)}</h1>
      <textarea data-bind="project.description" rows="2" placeholder="Objectif du projet (ex. une cuisine claire avec un îlot)" style="width:100%;border:0;background:transparent;outline:none;resize:none;margin-top:4px;font-size:15px;color:var(--text2);line-height:1.4">${esc(p.description || '')}</textarea></div>
    ${days != null && days >= 0 && projectStatus(p) !== 'Terminés' ? `<div class="sec"><div class="glass card" style="padding:16px;display:flex;align-items:center;gap:16px">
      <div style="text-align:center;color:${H.color(p.who || BOTH)}"><div class="countdown num">${days}</div><div style="font-weight:700">jour${days > 1 ? 's' : ''}</div></div>
      <div style="flex:1"><div style="font-weight:700">${p.template === 'Vacances' ? 'Départ le' : 'Échéance le'} ${esc(longDate(parseKey(p.deadline)))}</div><div class="lbl">Aussi affiché sur l'Accueil</div></div></div></div>` : ''}
    <div class="sec grid3">
      <div class="tile glass" style="padding:12px"><span class="lbl">Échéance</span><b style="font-size:14px">${p.deadline ? esc(cap(parseKey(p.deadline).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }))) : 'Aucune'}</b></div>
      <div class="tile glass" style="padding:12px"><span class="lbl">Avancement</span><b style="font-size:14px">${Math.round(100 * pr)} %</b></div>
      <button class="tile glass press" data-a="projectWho" style="padding:12px;text-align:left"><span class="lbl">Responsable</span><b style="font-size:14px;color:${H.color(p.who || BOTH)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.who || BOTH)}</b></button></div>
    <div class="sec"><div class="glass card" style="padding:14px 16px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:15px">Budget</b>${p.goal ? `<span class="lbl">Objectif d'épargne dans Finances</span>` : ''}</div>
      ${p.goal ? `<div class="progress" style="height:8px"><i style="width:${Math.min(100, 100 * (p.saved || 0) / p.goal)}%;background:${THEME.both}"></i></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600" class="num">${eur(p.saved || 0)} épargnés sur ${eur(p.goal)}</span>
        <button class="btn glass press" data-a="projectSave" style="min-height:34px;font-size:13px;padding:0 12px">${ic('plus', 14, 2.2)}Verser</button></div>`
        : `<button class="btn glass press" data-a="projectGoal">${ic('wallet', 18)}Fixer un objectif d'épargne</button>`}</div></div>
    ${p.goal ? `<div class="sec"><div class="glass card" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><b style="font-size:15px">Épargne automatique</b><div class="lbl">Une part de vos gains Travail de la semaine va ici, chaque lundi</div></div>
        <label class="toggle"><input type="checkbox" data-a="autoToggle" ${a.on ? 'checked' : ''}><i></i></label></div>
      ${a.on ? `<div class="seg">${[['pct:5', '5 %'], ['pct:10', '10 %'], ['pct:15', '15 %'], ['fixed', 'Montant fixe']].map(([v, l]) => { const on = v === 'fixed' ? a.mode === 'fixed' : (a.mode === 'pct' && 'pct:' + a.value === v);
          return `<button class="${on ? 'on' : ''}" data-a="autoMode" data-v="${v}">${l}</button>`; }).join('')}</div>
        ${a.mode === 'fixed' ? `<div class="field glass" style="border-radius:14px"><span class="flabel">Chaque semaine</span><input data-bind="project.autoValue" inputmode="decimal" value="${a.value || ''}" placeholder="0" style="text-align:right;font-weight:700"><span>€</span></div>` : ''}
        <div style="font-weight:700;color:var(--accent)">+${eur(thisWeek)} cette semaine${a.mode === 'pct' ? ' (estimé)' : ''}</div>
        ${projection ? `<div class="lbl">${esc(projection)}</div>` : ''}` : ''}</div></div>` : ''}
    <div class="sec"><div class="sec-h">Étapes<span class="right" style="color:var(--text2);font-weight:500">${done} sur ${p.steps.length}</span></div><div class="group glass">
      ${p.steps.map(s => swipeRow(`${checkBtn(s.done, 'stepToggle', s.id)}<span class="main t">${esc(s.title)}</span><button class="press" data-a="stepWho" data-id="${s.id}">${chip(s.who || BOTH)}</button>`,
        [swipeDel('stepDel', s.id)], `data-long="stepMenu" data-id="${s.id}"`).replace('class="content row"', `class="content row ${s.done ? 'muted' : ''}"`)).join('')}
      <div class="row"><span style="color:var(--accent)">${ic('plus', 22, 2.2)}</span><input class="plain" id="stepInput" placeholder="Ajouter une étape" enterkeyhint="done"></div></div></div>
    <div class="sec"><div class="sec-h">Inspiration</div><div class="photos">
      ${(p.photos || []).map((ph, i) => `<button class="ph press" data-a="photoMenu" data-v="${i}"><img src="${ph}" alt="Photo d'inspiration ${i + 1}"></button>`).join('')}
      <button class="ph add press" data-a="photoAdd">${ic('camera', 24)}<span>Ajouter des photos</span></button></div></div>
    <div class="sec"><div class="sec-h">Notes</div><div class="glass card" style="padding:10px 14px">
      <textarea data-bind="project.notes" rows="4" placeholder="Idées, numéros, liens, devis…" style="width:100%;border:0;background:transparent;outline:none;resize:none;font-size:15px;line-height:1.45">${esc(p.notes || '')}</textarea></div></div>
  </div></div>`;
}
const curProject = () => S.projects.find(x => x.id === (UI.view && UI.view.id));
A.projectMenu = () => { const p = curProject(); if (!p) return;
  menu(p.name, [
    { label: 'Renommer', icon: 'pencil', fn: () => dialog({ title: 'Nom du projet', placeholder: '', value: p.name, onOk: v => { if (v) { p.name = v; changed(); } } }) },
    { label: 'Changer l\'échéance', icon: 'calendar', fn: () => sheet({ title: 'Échéance', ok: 'OK', body: `<div class="group glass"><div class="field"><span class="flabel">Le</span><input type="date" name="d" value="${p.deadline || ''}"></div></div>`, onOk: r => { p.deadline = val(r, 'd') || null; changed(); } }) },
    { label: 'Objectif d\'épargne', icon: 'wallet', fn: A.projectGoal },
    ...PROJ_TABS.filter(t => t !== projectStatus(p)).map(t => ({ label: 'Mettre dans « ' + t + ' »', icon: 'flag', fn: () => { p.status = t; UI.projFilter = t; if (t === 'Terminés') confetti(); changed(); } })),
    { label: 'Supprimer le projet', icon: 'trash', danger: true, fn: () => dialog({ title: 'Supprimer « ' + p.name + ' » ?', ok: 'Supprimer', danger: true, onOk: () => { S.projects = S.projects.filter(x => x !== p); UI.view = null; changed(); } }) },
  ]); };
A.projectGoal = () => { const p = curProject(); if (!p) return;
  dialog({ title: 'Objectif d\'épargne', text: 'Montant à mettre de côté pour ce projet.', placeholder: 'Ex. 2000', value: p.goal ? String(p.goal) : '', onOk: v => { p.goal = parseAmount(v) || 0; changed(); } }); };
A.projectSave = () => { const p = curProject(); if (!p) return;
  dialog({ title: 'Verser sur « ' + p.name + ' »', text: 'Montant mis de côté (un montant négatif le retire).', placeholder: 'Ex. 50', ok: 'Verser', onOk: v => { const n = parseAmount(v); if (!n) return;
    const before = p.saved || 0; p.saved = Math.max(0, before + n); (p.history = p.history || []).push({ at: todayKey(), amount: n });
    if (p.goal && before < p.goal && p.saved >= p.goal) confetti(); else haptic('success'); changed(); } }); };
A.projectWho = () => { const p = curProject(); if (!p) return; menu('Responsable', H.everyone.map(n => ({ label: n, style: `color:${H.color(n)}`, fn: () => { p.who = n; changed(); } }))); };
A.autoToggle = (d, el) => { const p = curProject(); if (!p) return; p.auto = p.auto || { mode: 'pct', value: 10 }; p.auto.on = el.checked; if (el.checked && !p.auto.last) p.auto.last = dkey(addDays(weekStart(new Date()), -7)); changed(); };
A.autoMode = d => { const p = curProject(); if (!p) return; if (d.v === 'fixed') { p.auto.mode = 'fixed'; p.auto.value = p.auto.mode === 'fixed' ? p.auto.value : 0; } else { p.auto.mode = 'pct'; p.auto.value = +d.v.split(':')[1]; } changed(); };
const findStep = id => { const p = curProject(); return p && p.steps.find(s => s.id === id); };
A.stepToggle = d => { const p = curProject(), s = findStep(d.id); if (!s) return;
  remainingAfter(() => { s.done = !s.done; }, () => p.steps.filter(x => !x.done).length); if (s.done) haptic('success'); changed(); };
A.stepDel = d => { const p = curProject(); p.steps = p.steps.filter(s => s.id !== d.id); changed(); };
A.stepWho = d => { const s = findStep(d.id); if (s) menu('Qui s\'en charge ?', H.everyone.map(n => ({ label: n, style: `color:${H.color(n)}`, fn: () => { s.who = n; changed(); } }))); };
A.stepMenu = d => { const p = curProject(), s = findStep(d.id); if (!s) return; const i = p.steps.indexOf(s);
  menu(s.title, [{ label: 'Renommer', icon: 'pencil', fn: () => dialog({ title: 'Étape', placeholder: '', value: s.title, onOk: v => { if (v) { s.title = v; changed(); } } }) },
    ...(i > 0 ? [{ label: 'Monter', fn: () => { p.steps.splice(i, 1); p.steps.splice(i - 1, 0, s); changed(); } }] : []),
    ...(i < p.steps.length - 1 ? [{ label: 'Descendre', fn: () => { p.steps.splice(i, 1); p.steps.splice(i + 1, 0, s); changed(); } }] : []),
    { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.stepDel(d) }]); };
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.id !== 'stepInput') return;
  e.preventDefault(); const p = curProject(), v = e.target.value.trim(); if (!p || !v) return;
  p.steps.push({ id: uid(), title: v, done: false, who: p.who || BOTH }); changed();
  const el = document.getElementById('stepInput'); if (el) el.focus();
});
A.photoAdd = async () => { const p = curProject(); if (!p) return;
  const files = await pickFile('image/*', true);
  for (const f of files.slice(0, 6)) { try { p.photos.push(await shrinkImage(f, 700, false, .72)); } catch (e) { /* ignorée */ } }
  if (files.length) changed(); };
A.photoMenu = d => { const p = curProject(); const i = +d.v;
  menu(null, [{ label: 'Voir en grand', icon: 'search', fn: () => openLayer(`<div class="dialog" style="width:calc(100% - 24px);top:50%"><img src="${p.photos[i]}" style="width:100%;display:block" alt=""></div>`) },
    { label: 'Retirer la photo', icon: 'trash', danger: true, fn: () => { p.photos.splice(i, 1); changed(); } }]); };

// ================= Finances =================
function screenFinances() {
  const m = parseKey(UI.finMonth), who = UI.finWho;
  const opts = ['Commun', H.p1, H.p2];
  if (!opts.includes(who)) UI.finWho = 'Commun';
  const exps = expensesOf(m, UI.finWho).sort((a, b) => b.date.localeCompare(a.date));
  const spent = exps.reduce((s, e) => s + e.amount, 0);
  const isCommun = UI.finWho === 'Commun', budget = isCommun ? S.fin.budget : 0;
  const [ma, mb] = monthRange(m), now = new Date();
  const left = daysBetween(now, mb);
  const cats = EXP_CATS.map(c => ({ c, spent: exps.filter(e => e.cat === c).reduce((s, e) => s + e.amount, 0), budget: isCommun ? (S.fin.catBudgets[c] || 0) : 0 })).filter(x => x.spent || x.budget);
  const alerts = cats.filter(x => x.budget && x.spent >= .9 * x.budget);
  const income = S.work.toFinances ? lessonStats(lessonsBetween(ma, mb)).e : 0;
  const goals = S.projects.filter(p => p.goal);
  const barColor = x => !x.budget ? 'var(--accent)' : x.spent > x.budget ? 'var(--danger)' : x.spent >= .9 * x.budget ? 'var(--orange)' : 'var(--accent)';
  return `<div class="screen">${head('Finances', cap(m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })), `<button class="lock glass press" data-a="csvImport" style="color:var(--text)">${ic('upload', 14, 2)}Importer CSV</button>`)}
    ${switcher(opts, UI.finWho, 'finWho', { key: 'fin' })}
    <div class="scroll">
      <div class="daynav" style="margin:2px 0 0"><button class="iconbtn glass press" data-a="finMonth" data-v="-1" aria-label="Mois précédent">${ic('back', 18, 2.2)}</button><button class="d press" data-a="finMonth" data-v="0">${esc(cap(monthName(m)))}</button><button class="iconbtn glass press" data-a="finMonth" data-v="1" aria-label="Mois suivant">${ic('chev', 18, 2.2)}</button></div>
      <div class="sec"><div class="glass card" style="padding:16px;display:flex;flex-direction:column;gap:8px">
        ${isCommun ? (budget > 0 ? `<span class="lbl" style="font-weight:600">Reste à dépenser</span><span class="num" style="font-size:36px;font-weight:800;letter-spacing:-.02em;${budget - spent < 0 ? 'color:var(--danger)' : ''}">${eur(Math.round(budget - spent))}</span>
          <div class="progress" style="height:8px"><i style="width:${Math.min(100, 100 * spent / budget)}%;background:${spent > budget ? 'var(--danger)' : 'var(--accent)'}"></i></div>
          <div style="display:flex;justify-content:space-between" class="lbl"><span>${eur(Math.round(spent))} dépensés</span><span>sur ${eur(budget)}${m >= ma && now < mb && now >= ma ? ' · ' + left + ' jours' : ''}</span></div>`
          : `<span class="lbl" style="font-weight:600">Dépenses communes</span><span class="num" style="font-size:32px;font-weight:800">${eur(Math.round(spent))}</span><button class="btn glass press" data-a="finBudgets">${ic('wallet', 18)}Définir le budget du mois</button>`)
          : `<span class="lbl" style="font-weight:600">Dépenses perso de ${esc(UI.finWho)}</span><span class="num" style="font-size:32px;font-weight:800">${eur(Math.round(spent))}</span>`}
        ${alerts.map(x => `<div style="font-weight:600;font-size:13.5px;color:${x.spent > x.budget ? 'var(--danger)' : 'var(--orange)'}">${esc(x.c)} : ${Math.round(100 * x.spent / x.budget)} % du budget atteint</div>`).join('')}</div></div>
      ${cats.length ? section(`Par catégorie${isCommun ? '<button class="right press" data-a="finBudgets">Budgets</button>' : ''}`, cats.map(x => `<div class="row" style="flex-direction:column;align-items:stretch;gap:7px">
          <div style="display:flex;justify-content:space-between"><b>${esc(x.c)}</b><span class="num" style="font-weight:600">${eur(Math.round(x.spent))}${x.budget ? ' / ' + eur(x.budget) : ''}</span></div>
          ${x.budget ? `<div class="progress"><i style="width:${Math.min(100, 100 * x.spent / x.budget)}%;background:${barColor(x)}"></i></div>` : ''}</div>`).join('')) : ''}
      ${income > 0 && isCommun ? section('Revenus', `<button class="row press" data-a="openBilanFromFin" style="width:100%;text-align:left"><span class="round glass">${ic('briefcase', 16)}</span><div class="main"><div class="t">Gains Travail (estimés)</div><div class="s">D'après vos leçons du mois</div></div><b class="num" style="color:var(--accent)">+${eur(Math.round(income))}</b></button>`) : ''}
      ${goals.length && isCommun ? section('Objectifs d\'épargne<span class="right" style="color:var(--text2);font-weight:500">liés aux Projets</span>', goals.map(p => `<button class="row press" data-a="openProject" data-id="${p.id}" style="width:100%;text-align:left;flex-direction:column;align-items:stretch;gap:7px">
          <div style="display:flex;justify-content:space-between"><b>${esc(p.name)}</b><span class="num" style="font-weight:600">${eur(p.saved || 0)} / ${eur(p.goal)}</span></div>
          <div class="progress"><i style="width:${Math.min(100, 100 * (p.saved || 0) / p.goal)}%;background:${THEME.both}"></i></div></button>`).join('')) : ''}
      ${section('Dépenses du mois', exps.length ? exps.map(e => swipeRow(`<div class="main"><div class="t">${esc(e.label || e.cat)}</div><div class="s">${esc([e.cat, parseKey(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), e.paidBy].join(' · '))}</div></div><b class="num">${eur(e.amount, true)}</b>`,
        [swipeDel('expDel', e.id)], `data-long="expMenu" data-id="${e.id}"`)).join('') : '<div class="empty">Aucune dépense ce mois-ci. Touchez « + » pour en noter une.</div>',
        exps.length ? 'Glissez une dépense vers la gauche pour la supprimer, appui long pour la modifier.' : '')}
    </div>${fab('expAdd', 'Nouvelle dépense')}</div>`;
}
A.finWho = d => { UI.finWho = d.v; render(); };
A.finMonth = d => { const n = +d.v; UI.finMonth = n === 0 ? todayKey() : dkey(addMonths(parseKey(UI.finMonth), n)); render(); };
A.openBilanFromFin = () => { UI.tab = 'travail'; UI.view = { name: 'bilan' }; UI.bilanMonth = UI.finMonth; render(); };
A.expDel = d => { S.fin.expenses = S.fin.expenses.filter(e => e.id !== d.id); changed(); };
A.expMenu = d => { const e = S.fin.expenses.find(x => x.id === d.id); if (!e) return;
  menu(e.label || e.cat, [{ label: 'Modifier', icon: 'pencil', fn: () => expSheet(e) }, { label: 'Supprimer', icon: 'trash', danger: true, fn: () => A.expDel(d) }]); };
A.expAdd = () => expSheet(null);
function expSheet(e) {
  const m = parseKey(UI.finMonth);
  const defDate = e ? e.date : (m.getMonth() === new Date().getMonth() && m.getFullYear() === new Date().getFullYear() ? todayKey() : dkey(new Date(m.getFullYear(), m.getMonth(), 1)));
  sheet({ title: e ? 'Modifier la dépense' : 'Nouvelle dépense', ok: e ? 'OK' : 'Ajouter',
    body: `<div style="text-align:center;padding:6px 0 12px"><input name="amount" inputmode="decimal" placeholder="0,00" value="${e ? String(e.amount).replace('.', ',') : ''}" data-required autofocus
        style="width:100%;text-align:center;font-size:44px;font-weight:800;border:0;background:transparent;outline:none;letter-spacing:-.02em"><div class="lbl">euros</div></div>
      <div class="group glass"><div class="field"><input name="label" placeholder="Libellé (ex. boulangerie et marché)" value="${esc(e ? e.label : '')}"></div>
        <div class="field"><span class="flabel">Date</span><input type="date" name="date" value="${defDate}"></div></div>
      <div class="sec"><div class="sec-h">Catégorie</div>${seg('cat', EXP_CATS, e ? e.cat : 'Courses')}</div>
      <div class="sec"><div class="sec-h">Payé par</div>${seg('paidBy', [H.p1, H.p2], e ? e.paidBy : H.me, n => H.color(n))}</div>
      <div class="sec"><div class="sec-h">Budget</div>${seg('scope', ['Commun', 'Perso'], e ? e.scope : (UI.finWho === 'Commun' ? 'Commun' : 'Perso'))}</div>
      <div class="sec-f" data-exp-msg style="font-weight:600"></div>`,
    onMount: r => {
      const upd = () => {
        const amt = parseAmount(val(r, 'amount')) || 0, cat = segVal(r, 'cat'), scope = segVal(r, 'scope'), b = S.fin.catBudgets[cat];
        const msg = r.querySelector('[data-exp-msg]');
        if (scope !== 'Commun' || !b || !amt) { msg.textContent = ''; return; }
        const d = parseKey(val(r, 'date') || todayKey());
        const cur = expensesOf(d, 'Commun').filter(x => x.cat === cat && (!e || x.id !== e.id)).reduce((s, x) => s + x.amount, 0);
        const pc = Math.round(100 * (cur + amt) / b);
        msg.textContent = `Avec cette dépense, ${cat} passe à ${pc} % du budget`;
        msg.style.color = pc > 100 ? 'var(--danger)' : pc >= 90 ? 'var(--orange)' : 'var(--accent)';
      };
      r.addEventListener('input', upd); r.addEventListener('change', upd); upd();
    },
    onOk: r => {
      const amount = parseAmount(val(r, 'amount')); if (!amount || amount <= 0) { toast('Montant invalide'); return false; }
      const it = e || { id: uid() };
      Object.assign(it, { amount: Math.round(amount * 100) / 100, label: val(r, 'label'), date: val(r, 'date') || todayKey(), cat: segVal(r, 'cat'), paidBy: segVal(r, 'paidBy'), scope: segVal(r, 'scope') });
      if (!e) S.fin.expenses.push(it);
      const b = S.fin.catBudgets[it.cat];
      haptic('success'); changed();
      if (it.scope === 'Commun' && b) { const tot = expensesOf(parseKey(it.date), 'Commun').filter(x => x.cat === it.cat).reduce((s, x) => s + x.amount, 0); if (tot >= .9 * b) toast(`${it.cat} : ${Math.round(100 * tot / b)} % du budget`); }
    } });
}
A.finBudgets = () => {
  sheet({ title: 'Budgets du mois', ok: 'OK',
    body: `<div class="group glass"><div class="field"><span class="flabel" style="font-weight:700">Budget commun total</span><input name="total" inputmode="decimal" placeholder="0" value="${S.fin.budget || ''}" style="text-align:right;font-weight:700"><span>€</span></div></div>
      <div class="sec"><div class="sec-h">Par catégorie (facultatif)</div><div class="group glass">
      ${EXP_CATS.map(c => `<div class="field"><span class="flabel">${c}</span><input name="b-${c}" inputmode="decimal" placeholder="—" value="${S.fin.catBudgets[c] || ''}" style="text-align:right"><span>€</span></div>`).join('')}</div>
      <div class="sec-f">Ces montants servent chaque mois. Une alerte apparaît quand une catégorie atteint 90 %.</div></div>`,
    onOk: r => { S.fin.budget = parseAmount(val(r, 'total')) || 0; for (const c of EXP_CATS) { const v = parseAmount(val(r, 'b-' + c)); if (v) S.fin.catBudgets[c] = v; else delete S.fin.catBudgets[c]; } changed(); } });
};
A.csvImport = async () => {
  const [file] = await pickFile('.csv,text/csv,text/plain');
  if (!file) return;
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const guessCat = l => { const f = fold(l);
    if (/carrefour|leclerc|auchan|lidl|intermarche|casino|monoprix|franprix|super u|aldi|boulang|marche/.test(f)) return 'Courses';
    if (/loyer|bail/.test(f)) return 'Loyer';
    if (/sncf|essence|total|carbur|peage|parking|ratp|uber|station/.test(f)) return 'Transport';
    if (/pharma|medecin|docteur|dentist|mutuelle|hopital/.test(f)) return 'Santé';
    if (/cinema|restaurant|resto|netflix|spotify|fnac|bar |cafe/.test(f)) return 'Loisirs';
    if (/ikea|leroy|castorama|brico|edf|engie|eau |orange|free|sfr|bouygues/.test(f)) return 'Maison';
    return 'Autre'; };
  let n = 0;
  for (const line of lines) {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, '').trim());
    let date = null, amount = null, label = '';
    for (const c of cols) {
      let m;
      if (!date && (m = c.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; date = dkey(new Date(y, +m[2] - 1, +m[1])); continue; }
      if (!date && (m = c.match(/^(\d{4})-(\d{2})-(\d{2})/))) { date = `${m[1]}-${m[2]}-${m[3]}`; continue; }
      if (/^[-+]?\s?[\d\s]+([.,]\d{1,2})?\s?€?$/.test(c) && /\d/.test(c)) { const v = parseAmount(c); if (v != null && v !== 0) amount = v; continue; }
      if (c.length > label.length && /[a-zA-Z]/.test(c)) label = c;
    }
    if (!date || amount == null || amount >= 0) continue;
    S.fin.expenses.push({ id: uid(), amount: Math.abs(amount), label: label.slice(0, 60), date, cat: guessCat(label), paidBy: H.me, scope: 'Commun', imported: true });
    n++;
  }
  changed();
  toast(n ? `${n} dépense${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''}` : 'Aucune dépense trouvée dans ce fichier');
};

// ================= Réglages =================
A.openSettings = () => { UI.view = { name: 'reglages', parent: UI.view }; render(); };
function renamePerson(field, v) {
  if (field !== 'person1' && field !== 'person2') return;
  const old = field === 'person1' ? H.p1 : H.p2;
  if (!v || v === old || v === BOTH || v === (field === 'person1' ? H.p2 : H.p1)) return;
  const rep = x => x === old ? v : x;
  S.settings[field] = v;
  if (S.settings.me === old) S.settings.me = v;
  for (const k of ['colors', 'photos']) if (S.settings[k][old] != null) { S.settings[k][v] = S.settings[k][old]; delete S.settings[k][old]; }
  S.events.forEach(e => e.who = rep(e.who)); S.chores.forEach(c => c.who = rep(c.who));
  S.projects.forEach(p => { p.who = rep(p.who); p.steps.forEach(s => s.who = rep(s.who)); });
  S.fin.expenses.forEach(e => e.paidBy = rep(e.paidBy));
  if (UI.choreFilter === old) UI.choreFilter = v; if (UI.finWho === old) UI.finWho = v;
}
function viewReglages() {
  const colorRow = name => { const c = H.color(name);
    return `<div class="row" style="flex-direction:column;align-items:stretch;gap:10px;padding:12px 14px">
      <div style="display:flex;align-items:center;gap:10px"><button class="press" data-a="photoPerson" data-v="${esc(name)}" style="position:relative" aria-label="Choisir la photo de ${esc(name)}">${avatar(name, 44)}
        <span style="position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:9px;background:var(--accent);color:#fff;display:grid;place-items:center">${ic('camera', 11, 2.4)}</span></button>
        ${chip(name)}<span style="flex:1"></span>
        <label class="press" style="width:30px;height:30px;border-radius:15px;overflow:hidden;position:relative;background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" aria-label="Autre couleur"><input type="color" value="${c}" data-color="${esc(name)}" style="position:absolute;inset:0;opacity:0"></label>
        <button class="btn glass press" data-a="colorReset" data-v="${esc(name)}" style="min-height:32px;font-size:12.5px;padding:0 12px">Par défaut</button></div>
      <div class="palette">${PALETTE.map(p => `<button class="${p.toUpperCase() === c.toUpperCase() ? 'on' : ''}" style="background:${p};--c:${p}" data-a="colorSet" data-v="${esc(name)}" data-c="${p}" aria-label="Couleur ${p}"></button>`).join('')}</div></div>`; };
  return `<div class="screen">${backHead('Retour', 'back')}<div class="scroll">
    <h1 style="margin:2px 4px 4px;font-size:32px;font-weight:800">Réglages</h1>
    ${section('Le foyer', `<div class="field"><span class="flabel">Prénom 1</span><input data-bind="settings.person1" value="${esc(H.p1)}" style="text-align:right"></div>
      <div class="field"><span class="flabel">Prénom 2</span><input data-bind="settings.person2" value="${esc(H.p2)}" style="text-align:right"></div>
      <div class="field col"><span class="flabel">Ce téléphone est celui de</span>${seg('me', [H.p1, H.p2], H.me, n => H.color(n)).replace('data-seg="me"', 'data-seg="me" data-a-seg="setMe"')}</div>`,
      'L\'onglet choisi et les boutons prennent la couleur de la personne à qui appartient ce téléphone.')}
    ${section('Couleurs', colorRow(H.p1) + colorRow(H.p2) + colorRow(BOTH), 'Touchez le rond pour choisir une photo. Photo et couleur servent à repérer qui est concerné.')}
    ${section('Apparence', `<div class="field col">${seg('theme', [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']], S.settings.theme || 'auto').replace('data-seg="theme"', 'data-seg="theme" data-a-seg="setTheme"')}</div>`)}
    ${section('Sauvegarde', `<button class="row press link-row" data-a="exportData" style="width:100%">${ic('download', 20)}<span class="main" style="text-align:left">Exporter mes données</span></button>
      <button class="row press link-row" data-a="importData" style="width:100%">${ic('upload', 20)}<span class="main" style="text-align:left">Importer une sauvegarde</span></button>`,
      'Tout est rangé dans ce téléphone, sans compte ni serveur. Exportez de temps en temps pour garder une copie (dans Fichiers ou iCloud Drive), ou pour copier vos données sur un autre téléphone.')}
    ${section('À propos', `<div class="row"><div class="main"><div class="t">Notre Foyer, version web</div><div class="s">Installée depuis Safari. Siri et le widget arriveront avec l'app iPhone.</div></div></div>
      <button class="row press danger" data-a="resetAll" style="width:100%">${ic('trash', 20)}<span class="main" style="text-align:left">Tout effacer sur ce téléphone</span></button>`)}
  </div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a-seg] button[data-segv]'); if (!b) return;
  const segEl = b.closest('[data-a-seg]'), v = b.dataset.segv;
  if (segEl.dataset.aSeg === 'setMe') S.settings.me = v;
  if (segEl.dataset.aSeg === 'setTheme') { S.settings.theme = v; applyTheme(); }
  haptic(); changed();
});
document.addEventListener('input', e => {
  const name = e.target.dataset && e.target.dataset.color; if (!name) return;
  S.settings.colors[name] = e.target.value.toUpperCase(); save();
  clearTimeout(window._colTimer); window._colTimer = setTimeout(() => render(), 250);
});
A.colorSet = (d, el) => { S.settings.colors[d.v] = el.dataset.c; haptic(); changed(); };
A.colorReset = d => { delete S.settings.colors[d.v]; changed(); };
A.photoPerson = async d => {
  if (H.photo(d.v)) { menu(d.v, [{ label: 'Choisir une autre photo', icon: 'camera', fn: () => choosePhoto(d.v) }, { label: 'Retirer la photo', icon: 'trash', danger: true, fn: () => { delete S.settings.photos[d.v]; changed(); } }]); return; }
  choosePhoto(d.v);
};
async function choosePhoto(name) { const [f] = await pickFile('image/*'); if (!f) return; try { S.settings.photos[name] = await shrinkImage(f, 160, true); changed(); } catch (e) { toast('Photo illisible'); } }
A.exportData = () => downloadFile(`notre-foyer-${todayKey()}.json`, JSON.stringify(S), 'application/json');
A.importData = async () => {
  const [f] = await pickFile('.json,application/json'); if (!f) return;
  try {
    const data = JSON.parse(await f.text()); if (!data || !data.settings) throw new Error();
    dialog({ title: 'Remplacer les données ?', text: 'Ce qui est sur ce téléphone sera remplacé par la sauvegarde.', ok: 'Remplacer', danger: true, onOk: () => {
      S = merge(defaults(), data); localStorage.setItem(KEY, JSON.stringify(S)); applyTheme(); UI.view = null; render(); toast('Sauvegarde importée'); } });
  } catch (e) { toast('Ce fichier n\'est pas une sauvegarde Notre Foyer'); }
};
A.resetAll = () => dialog({ title: 'Tout effacer ?', text: 'Toutes les données de ce téléphone seront supprimées. Pensez à exporter avant.', ok: 'Effacer', danger: true, onOk: () => {
  S = defaults(); localStorage.removeItem(KEY); applyTheme(); UI.view = null; UI.tab = 'famille'; render(); } });
