// Onglet Travail pour une infirmière : planning des gardes, journée, bilan, notes.
'use strict';

const JOBS = [['cours', 'Cours et leçons'], ['infirmier', 'Infirmière / infirmier'], ['autre', 'Autre métier']];
function jobOf(name) {
  const j = S.settings.jobs && S.settings.jobs[name];
  if (j) return j;
  return name === H.p2 ? 'infirmier' : 'cours';
}
function defaultShifts() {
  return [
    { id: 'M', code: 'M', label: 'Matin', start: '06:45', end: '14:15', pause: 0, color: '#E0A100', work: true },
    { id: 'S', code: 'S', label: 'Soir', start: '13:45', end: '21:15', pause: 0, color: '#E8743B', work: true },
    { id: 'N', code: 'N', label: 'Nuit', start: '21:00', end: '07:00', pause: 0, color: '#5B4BC4', work: true },
    { id: 'J', code: '12h', label: 'Jour 12 h', start: '07:00', end: '19:00', pause: 30, color: '#2F6BD8', work: true },
    { id: 'F', code: 'F', label: 'Formation', start: '09:00', end: '17:00', pause: 60, color: '#D6336C', work: true },
    { id: 'R', code: 'R', label: 'Repos', start: '', end: '', pause: 0, color: '#8A9A94', work: false },
    { id: 'CA', code: 'CA', label: 'Congé', start: '', end: '', pause: 0, color: '#3FA34D', work: false },
    { id: 'RTT', code: 'RTT', label: 'RTT', start: '', end: '', pause: 0, color: '#1E9BD7', work: false },
  ];
}
function nurse() {
  if (!S.nurse) S.nurse = { shifts: defaultShifts(), plan: {}, extra: [], checklist: [
    'Badge', 'Ciseaux', 'Stylo 4 couleurs', 'Montre à trotteuse', 'Garrot', 'Carnet de poche', 'Tenue de rechange', 'Repas et bouteille d\'eau',
  ].map(t => ({ id: uid(), title: t, doneDate: null })) };
  return S.nurse;
}
const shiftType = id => nurse().shifts.find(s => s.id === id);
function shiftOn(key) { const id = S.nurse && S.nurse.plan[key]; return id ? shiftType(id) || null : null; }
const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
function shiftHours(s) { if (!s || !s.work || !s.start) return 0; let d = toMin(s.end) - toMin(s.start); if (d <= 0) d += 1440; return Math.max(0, d - (s.pause || 0)) / 60; }
function shiftWindow(key, s) {
  const d = parseKey(key), a = new Date(d), b = new Date(d);
  a.setMinutes(toMin(s.start)); b.setMinutes(toMin(s.end)); if (b <= a) b.setDate(b.getDate() + 1);
  return [a, b];
}
function frHolidays(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(y, month - 1, day);
  return new Set(['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'].map(x => y + '-' + x)
    .concat([1, 39, 50].map(n => dkey(addDays(easter, n)))));
}
function monthStats(m) {
  const [a, b] = monthRange(m), hol = frHolidays(m.getFullYear()), n = nurse();
  const st = { hours: 0, gardes: 0, nights: 0, weekends: 0, holidays: 0, off: 0, extra: 0, byType: {} };
  for (let d = new Date(a); d < b; d = addDays(d, 1)) {
    const k = dkey(d), s = shiftOn(k); if (!s) continue;
    st.byType[s.id] = (st.byType[s.id] || 0) + 1;
    if (!s.work) { if (s.id !== 'R') st.off++; continue; }
    st.gardes++; st.hours += shiftHours(s);
    if (toMin(s.end) <= toMin(s.start)) st.nights++;
    if (d.getDay() === 0 || d.getDay() === 6) st.weekends++;
    if (hol.has(k)) st.holidays++;
  }
  st.extra = n.extra.filter(x => { const t = parseKey(x.date); return t >= a && t < b; }).reduce((s, x) => s + x.hours, 0);
  st.hours += st.extra;
  return st;
}

const NURSE_SEGS = ["Aujourd'hui", 'Planning', 'Bilan', 'Notes'];
function screenTravailInf() {
  nurse();
  if (!NURSE_SEGS.includes(UI.nseg)) UI.nseg = "Aujourd'hui";
  const seg = UI.nseg;
  const body = seg === "Aujourd'hui" ? infToday() : seg === 'Planning' ? infPlanning() : seg === 'Bilan' ? infBilan() : workNotes() + '<div class="hint">Par prudence, évitez d\'y noter le nom ou les soins d\'un patient : ces notes restent dans le téléphone, mais il peut se perdre.</div>';
  return `<div class="screen">${head(seg === 'Planning' ? 'Mon planning' : 'Travail', cap(longDate(new Date())), seg === 'Planning' ? '' : `<span class="lock glass">${ic('lock', 14, 2)}Visible par vous seul</span>`)}
    ${switcher(NURSE_SEGS, seg, 'nseg', { key: 'nseg', cls: 'small' })}
    <div class="scroll">${body}</div>${seg === 'Notes' ? fab('noteAdd', 'Nouvelle note') : ''}</div>`;
}
A.nseg = d => { UI.nseg = d.v; render(); };

// ----- Aujourd'hui -----
function currentShift() {
  const now = new Date(), tk = todayKey(), yk = dkey(addDays(now, -1));
  const y = shiftOn(yk);
  if (y && y.work && y.start) { const [a, b] = shiftWindow(yk, y); if (now >= a && now < b) return { key: yk, s: y, a, b }; }
  const t = shiftOn(tk);
  if (t && t.work && t.start) { const [a, b] = shiftWindow(tk, t); return { key: tk, s: t, a, b }; }
  return t ? { key: tk, s: t } : null;
}
function infToday() {
  const n = nurse(), now = new Date(), tk = todayKey();
  const cur = currentShift();
  let hero;
  const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h ? `${h} h ${pad(m % 60)}` : `${m} min`; };
  if (cur && cur.s.work && cur.a) {
    const s = cur.s;
    const status = now < cur.a ? `Prise de poste dans ${dur(cur.a - now)}` : now < cur.b ? `En poste · fin dans ${dur(cur.b - now)}` : 'Garde terminée, bon repos';
    const prog = now < cur.a ? 0 : now >= cur.b ? 1 : (now - cur.a) / (cur.b - cur.a);
    hero = `<div class="card sel" style="${selVars(s.color)};padding:16px;border-radius:24px;display:flex;flex-direction:column;gap:6px">
      <span style="font-size:13px;font-weight:600;opacity:.9">${cur.key === tk ? 'Aujourd\'hui' : 'Depuis hier soir'}</span>
      <span style="font-size:30px;font-weight:800;letter-spacing:-.02em">${esc(s.label)}</span>
      <span style="font-weight:600">${esc(s.start)} – ${esc(s.end)} · ${hoursLabel(shiftHours(s))}</span>
      <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden;margin-top:4px"><i style="display:block;height:100%;width:${100 * prog}%;background:#fff;border-radius:3px"></i></div>
      <span style="font-weight:700">${status}</span></div>`;
  } else if (cur) {
    hero = `<div class="card sel" style="${selVars(cur.s.color)};padding:16px;border-radius:24px"><span style="font-size:13px;font-weight:600;opacity:.9">Aujourd'hui</span><div style="font-size:30px;font-weight:800">${esc(cur.s.label)}</div><span style="font-weight:600">Profitez-en !</span></div>`;
  } else {
    hero = `<button class="glass card press" data-a="nseg" data-v="Planning" style="width:100%;text-align:left;padding:16px;display:flex;flex-direction:column;gap:4px"><b style="font-size:17px">Rien de prévu aujourd'hui</b><span class="lbl">Touchez pour remplir votre planning du mois, en 2 touches par jour.</span></button>`;
  }
  const next = []; for (let i = 1; i <= 21 && next.length < 5; i++) { const k = dkey(addDays(now, i)), s = shiftOn(k); if (s) next.push({ k, s }); }
  const st = monthStats(now);
  const list = n.checklist, doneN = list.filter(c => c.doneDate === tk).length;
  return `<div class="sec">${hero}</div>
    <div class="sec grid3">
      <div class="tile glass" style="padding:12px"><span class="lbl">Ce mois</span><b class="num" style="font-size:18px">${hoursLabel(st.hours)}</b></div>
      <div class="tile glass" style="padding:12px"><span class="lbl">Gardes</span><b class="num" style="font-size:18px">${st.gardes}</b></div>
      <div class="tile glass" style="padding:12px"><span class="lbl">Nuits</span><b class="num" style="font-size:18px">${st.nights}</b></div></div>
    ${section('Prochaines gardes<button class="right press" data-a="nseg" data-v="Planning">Planning</button>', next.length ? next.map(({ k, s }) => `<div class="row">
        <span class="avatar" style="width:38px;height:38px;border:0;background:${grad(s.color)};font-size:${s.code.length > 2 ? 11 : 14}px">${esc(s.code)}</span>
        <div class="main"><div class="t">${esc(cap(dayLabel(parseKey(k))))}</div><div class="s">${esc(s.label)}${s.work && s.start ? ' · ' + esc(s.start + ' – ' + s.end) : ''}</div></div></div>`).join('')
      : '<div class="empty">Aucune garde prévue dans les 3 prochaines semaines.</div>')}
    <div class="sec"><div class="sec-h">Avant de partir<span class="right" style="color:var(--text2);font-weight:500">${doneN} sur ${list.length}</span></div><div class="group glass">
      ${list.map(c => swipeRow(`${checkBtn(c.doneDate === tk, 'ckToggle', c.id)}<span class="main t" style="font-weight:500">${esc(c.title)}</span>`, [swipeDel('ckDel', c.id)])
        .replace('class="content row"', `class="content row ${c.doneDate === tk ? 'muted' : ''}"`)).join('')}
      <div class="row"><span style="color:var(--accent)">${ic('plus', 22, 2.2)}</span><input class="plain" id="ckInput" placeholder="Ajouter à la liste" enterkeyhint="done"></div></div>
      <div class="sec-f">La liste se remet à zéro chaque jour.</div></div>
    <div class="sec btnrow"><button class="btn glass press" data-a="extraAdd">${ic('clock', 18)}<span>Heures sup</span></button>
      <button class="btn glass press" data-a="shareSchedule" data-v="infirmier">${ic('share', 18)}<span>Partager mon planning</span></button></div>`;
}
A.ckToggle = d => { const n = nurse(), c = n.checklist.find(x => x.id === d.id); if (!c) return; const tk = todayKey();
  remainingAfter(() => { c.doneDate = c.doneDate === tk ? null : tk; }, () => n.checklist.filter(x => x.doneDate !== tk).length); changed(); };
A.ckDel = d => { const n = nurse(); n.checklist = n.checklist.filter(x => x.id !== d.id); changed(); };
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.id !== 'ckInput') return;
  e.preventDefault(); const v = e.target.value.trim(); if (!v) return;
  nurse().checklist.push({ id: uid(), title: v, doneDate: null }); changed();
  const el = document.getElementById('ckInput'); if (el) el.focus();
});
A.extraAdd = () => sheet({ title: 'Heures supplémentaires', ok: 'Ajouter',
  body: `<div class="group glass"><div class="field"><span class="flabel">Le</span><input type="date" name="date" value="${todayKey()}"></div>
    <div class="field"><span class="flabel">Durée</span><input name="h" inputmode="decimal" placeholder="Ex. 1,5" data-required autofocus style="text-align:right"><span>h</span></div>
    <div class="field"><input name="note" placeholder="Raison (facultatif, ex. relève tardive)"></div></div>`,
  onOk: r => { const h = parseAmount(val(r, 'h')); if (!h) return false; nurse().extra.push({ id: uid(), date: val(r, 'date') || todayKey(), hours: h, note: val(r, 'note') }); toast(`${hoursLabel(h)} ajoutée${h >= 2 ? 's' : ''}`); changed(); } });

// ----- Planning du mois (2 touches : un type, puis les jours) -----
function infPlanning() {
  const n = nurse(), m0 = parseKey(UI.nMonth || todayKey()), m = new Date(m0.getFullYear(), m0.getMonth(), 1);
  if (!UI.brush || (UI.brush !== 'clear' && !shiftType(UI.brush))) UI.brush = n.shifts[0].id;
  const first = weekStart(m), weeks = Math.ceil(daysBetween(first, new Date(m.getFullYear(), m.getMonth() + 1, 1)) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i));
  const hol = frHolidays(m.getFullYear()), st = monthStats(m);
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:2px 4px 8px"><b style="font-size:14px">1. Choisissez · 2. Touchez les jours</b><button class="lbl press" data-a="openShifts" style="font-weight:700;color:var(--accent)">Personnaliser</button></div>
    <div class="hscroll" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0 0 4px">${n.shifts.map(s => { const on = UI.brush === s.id;
      return `<button class="capsule press ${on ? 'sel' : 'glass'}" data-a="brush" data-v="${s.id}" style="${on ? selVars(s.color) : ''};padding:7px 12px"><span style="width:10px;height:10px;border-radius:5px;background:${s.color};${on ? 'box-shadow:0 0 0 2px #fff' : ''}"></span>${esc(s.label)}</button>`; }).join('')}
      <button class="capsule press ${UI.brush === 'clear' ? 'sel' : 'glass'}" data-a="brush" data-v="clear" style="${UI.brush === 'clear' ? selVars('#5C6B73') : ''};padding:7px 12px">${ic('trash', 15)}Effacer</button></div>
    <div class="sec"><div class="glass card" style="padding:10px 10px 12px">
      <div class="daynav" style="margin:0 0 6px"><button class="iconbtn press" data-a="nMonth" data-v="-1" aria-label="Mois précédent">${ic('back', 18, 2.2)}</button>
        <button class="d press" data-a="nMonth" data-v="0">${esc(cap(m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</button>
        <button class="iconbtn press" data-a="nMonth" data-v="1" aria-label="Mois suivant">${ic('chev', 18, 2.2)}</button></div>
      <div class="month">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span class="mh">${x}</span>`).join('')}
      ${cells.map(d => { const k = dkey(d), out = d.getMonth() !== m.getMonth(), s = shiftOn(k);
        return `<button class="mday plan press ${k === todayKey() ? 'today' : ''} ${out ? 'out' : ''}" data-a="paintDay" data-v="${k}" aria-label="${esc(longDate(d))}${s ? ' : ' + esc(s.label) : ''}"
          style="${s ? `background:${grad(s.color)};color:#fff` : ''}"><span class="num">${d.getDate()}</span><span class="code">${s ? esc(s.code) : hol.has(k) ? '★' : ''}</span></button>`; }).join('')}</div></div></div>
    <div class="sec grid3">
      <div class="tile glass" style="padding:12px"><span class="lbl">Heures</span><b class="num" style="font-size:17px">${hoursLabel(st.hours)}</b></div>
      <div class="tile glass" style="padding:12px"><span class="lbl">Gardes</span><b class="num" style="font-size:17px">${st.gardes}</b></div>
      <div class="tile glass" style="padding:12px"><span class="lbl">Week-ends</span><b class="num" style="font-size:17px">${st.weekends}</b></div></div>
    <div class="sec btnrow"><button class="btn glass press" data-a="planCopyWeek">${ic('undo', 18)}<span>Répéter</span></button>
      <button class="btn glass press" data-a="shareSchedule" data-v="infirmier">${ic('share', 18)}<span>Partager</span></button></div>
    <div class="hint">★ jour férié. Les gardes s'affichent aussi dans l'agenda de l'onglet Famille.</div>`;
}
A.brush = d => { UI.brush = d.v; render(); };
A.nMonth = d => { const n = +d.v, s = parseKey(UI.nMonth || todayKey()); UI.nMonth = n === 0 ? todayKey() : dkey(new Date(s.getFullYear(), s.getMonth() + n, 1)); render(); };
A.paintDay = d => {
  const plan = nurse().plan;
  if (UI.brush === 'clear' || plan[d.v] === UI.brush) delete plan[d.v]; else plan[d.v] = UI.brush;
  changed();
};
A.planCopyWeek = () => {
  const m0 = parseKey(UI.nMonth || todayKey());
  const ws = weekStart(m0 < startOfDay(new Date()) && m0.getMonth() === new Date().getMonth() ? new Date() : m0);
  sheet({ title: 'Répéter une semaine', ok: 'Répéter',
    body: `<div class="group glass"><div class="field"><span class="flabel">Semaine modèle (lundi)</span><input type="date" name="from" value="${dkey(ws)}"></div>
      <div class="field"><span class="flabel">Répéter pendant</span><select name="n">${[1, 2, 3, 4, 6, 8].map(x => `<option value="${x}" ${x === 4 ? 'selected' : ''}>${x} semaine${x > 1 ? 's' : ''}</option>`).join('')}</select></div></div>
      <div class="sec-f">Pratique pour un roulement : remplissez une semaine, puis copiez-la sur les semaines suivantes. Les jours déjà remplis sont remplacés.</div>`,
    onOk: r => { const from = weekStart(parseKey(val(r, 'from') || dkey(ws))), times = +val(r, 'n'), plan = nurse().plan;
      for (let w = 1; w <= times; w++) for (let i = 0; i < 7; i++) { const src = dkey(addDays(from, i)), dst = dkey(addDays(from, w * 7 + i)); if (plan[src]) plan[dst] = plan[src]; else delete plan[dst]; }
      toast(`Semaine répétée ${times} fois`); changed(); } });
};
A.planIcs = () => {
  const m0 = parseKey(UI.nMonth || todayKey()), [a, b] = monthRange(m0), ev = [];
  const f = x => x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z';
  for (let d = new Date(a); d < b; d = addDays(d, 1)) { const k = dkey(d), s = shiftOn(k); if (!s || !s.work || !s.start) continue;
    const [x, y] = shiftWindow(k, s);
    ev.push(['BEGIN:VEVENT', 'UID:' + k + '-' + s.id + '@notrefoyer', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(x), 'DTEND:' + f(y), 'SUMMARY:Garde ' + s.label, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Garde ' + s.label, 'TRIGGER:-PT90M', 'END:VALARM', 'END:VEVENT'].join('\r\n')); }
  if (!ev.length) { toast('Aucune garde ce mois-ci'); return; }
  downloadFile('planning.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Notre Foyer//FR', ...ev, 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
};
A.planShare = () => {
  const now = new Date(), lines = [];
  for (let i = 0; i < 14; i++) { const d = addDays(now, i), s = shiftOn(dkey(d)); if (s) lines.push(`${cap(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }))} : ${s.label}${s.work && s.start ? ` (${s.start}–${s.end})` : ''}`); }
  shareText('Mon planning', lines.length ? 'Mon planning des 2 prochaines semaines :\n' + lines.join('\n') : 'Pas de garde prévue dans les 2 prochaines semaines.');
};

// ----- Personnaliser les gardes -----
A.openShifts = () => { UI.view = { name: 'shifts', sel: nurse().shifts[0].id }; render(); };
function viewShifts() {
  const n = nurse(); const s = n.shifts.find(x => x.id === UI.view.sel) || n.shifts[0];
  if (s) UI.view.sel = s.id;
  return `<div class="screen">${backHead('Planning', 'back')}<div class="scroll">
    <h1 style="margin:2px 4px 8px;font-size:30px;font-weight:800">Mes gardes</h1>
    <div class="hscroll">${n.shifts.map(x => `<button class="capsule press ${x.id === (s && s.id) ? 'sel' : 'glass'}" style="${x.id === (s && s.id) ? selVars(x.color) : ''}" data-a="shiftSel" data-id="${x.id}">${esc(x.label)}</button>`).join('')}
      <button class="capsule glass press" data-a="shiftAdd">${ic('plus', 16, 2.2)}Nouveau</button></div>
    ${s ? `<div class="sec"><div class="group glass">
      <div class="field"><span class="flabel">Nom</span><input data-bind="shift.label" value="${esc(s.label)}" style="text-align:right"></div>
      <div class="field"><span class="flabel">Code court</span><input data-bind="shift.code" value="${esc(s.code)}" maxlength="3" style="text-align:right"></div>
      <div class="field col"><span class="flabel">Couleur</span><div class="palette">${PALETTE.concat(['#5B4BC4', '#E8743B', '#8A9A94']).map(c => `<button class="${c.toUpperCase() === s.color.toUpperCase() ? 'on' : ''}" style="background:${c};--c:${c}" data-a="shiftColor" data-v="${c}" aria-label="Couleur ${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="flabel">Je travaille ce jour-là</span><label class="toggle"><input type="checkbox" data-bind="shift.work" ${s.work ? 'checked' : ''}><i></i></label></div>
      ${s.work ? `<div class="field"><span class="flabel">Début</span><input type="time" data-bind="shift.start" value="${s.start || '07:00'}"></div>
      <div class="field"><span class="flabel">Fin</span><input type="time" data-bind="shift.end" value="${s.end || '19:00'}"></div>
      <div class="field"><span class="flabel">Pause non comptée</span><input data-bind="shift.pause" inputmode="numeric" value="${s.pause || 0}" style="text-align:right"><span>min</span></div>` : ''}
    </div>${s.work ? `<div class="sec-f">Temps compté : ${hoursLabel(shiftHours(s))}. Une fin plus tôt que le début veut dire une garde de nuit.</div>` : ''}</div>
    <div class="sec"><button class="btn glass wide press danger" data-a="shiftDel">${ic('trash', 18)}Supprimer cette garde</button></div>` : ''}
    <div class="sec"><button class="btn glass wide press" data-a="shiftsReset">Revenir aux gardes par défaut</button></div>
  </div></div>`;
}
A.shiftSel = d => { UI.view.sel = d.id; render(); };
A.shiftAdd = () => { const s = { id: uid(), code: 'G', label: 'Nouvelle garde', start: '08:00', end: '16:00', pause: 0, color: '#1E6B5C', work: true }; nurse().shifts.push(s); UI.view.sel = s.id; changed(); };
A.shiftColor = d => { const s = shiftType(UI.view.sel); if (s) { s.color = d.v; changed(); } };
A.shiftDel = () => { const n = nurse(), s = shiftType(UI.view.sel); if (!s) return;
  dialog({ title: `Supprimer « ${s.label} » ?`, text: 'Les jours du planning qui l\'utilisent seront vidés.', ok: 'Supprimer', danger: true, onOk: () => {
    n.shifts = n.shifts.filter(x => x.id !== s.id); for (const k in n.plan) if (n.plan[k] === s.id) delete n.plan[k]; UI.view.sel = null; changed(); } }); };
A.shiftsReset = () => dialog({ title: 'Gardes par défaut ?', text: 'Vos réglages de gardes seront remplacés (le planning garde les jours dont la garde existe encore).', ok: 'OK', onOk: () => {
  const n = nurse(); n.shifts = defaultShifts(); for (const k in n.plan) if (!shiftType(n.plan[k])) delete n.plan[k]; UI.view.sel = null; changed(); } });
document.addEventListener('change', e => {
  const b = e.target.dataset && e.target.dataset.bind; if (!b || !b.startsWith('shift.')) return;
  const s = shiftType(UI.view.sel); if (!s) return;
  const f = b.split('.')[1];
  let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim();
  if (f === 'pause') v = parseInt(v, 10) || 0;
  if ((f === 'label' || f === 'code') && !v) { render(); return; }
  s[f] = v; if (f === 'work' && v && !s.start) { s.start = '07:00'; s.end = '19:00'; }
  haptic(); changed();
});

// ----- Bilan -----
function infBilan() {
  const m0 = parseKey(UI.nMonth || todayKey()), m = new Date(m0.getFullYear(), m0.getMonth(), 1);
  const st = monthStats(m), prev = monthStats(addMonths(m, -1)), n = nurse();
  const types = n.shifts.filter(s => st.byType[s.id]);
  const maxC = Math.max(1, ...types.map(s => st.byType[s.id]));
  const extras = n.extra.filter(x => { const t = parseKey(x.date); return t >= m && t < addMonths(m, 1); }).sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="daynav"><button class="iconbtn glass press" data-a="nMonth" data-v="-1" aria-label="Mois précédent">${ic('back', 18, 2.2)}</button>
      <button class="d press" data-a="nMonth" data-v="0">${esc(cap(m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</button>
      <button class="iconbtn glass press" data-a="nMonth" data-v="1" aria-label="Mois suivant">${ic('chev', 18, 2.2)}</button></div>
    <div class="glass card" style="padding:14px 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
      <div><div class="lbl" style="font-weight:600">Heures</div><div class="num" style="font-size:22px;font-weight:800">${hoursLabel(st.hours)}</div></div>
      <div><div class="lbl" style="font-weight:600">Gardes</div><div class="num" style="font-size:22px;font-weight:800">${st.gardes}</div></div>
      <div><div class="lbl" style="font-weight:600">Nuits</div><div class="num" style="font-size:22px;font-weight:800">${st.nights}</div></div>
      <div><div class="lbl" style="font-weight:600">Week-ends</div><div class="num" style="font-size:22px;font-weight:800">${st.weekends}</div></div>
      <div><div class="lbl" style="font-weight:600">Jours fériés</div><div class="num" style="font-size:22px;font-weight:800">${st.holidays}</div></div>
      <div><div class="lbl" style="font-weight:600">Heures sup</div><div class="num" style="font-size:22px;font-weight:800;color:var(--accent)">${hoursLabel(st.extra)}</div></div>
      ${prev.hours ? `<div class="lbl" style="grid-column:span 3;font-weight:600">${st.hours >= prev.hours ? '+' : '−'}${hoursLabel(Math.abs(st.hours - prev.hours))} par rapport à ${monthName(addMonths(m, -1))}</div>` : ''}</div>
    ${section('Répartition', types.length ? types.map(s => `<div class="row" style="gap:10px"><span style="width:84px;font-weight:600;font-size:14px">${esc(s.label)}</span>
        <div style="flex:1;height:12px;border-radius:6px;background:var(--sep);overflow:hidden"><i style="display:block;height:100%;width:${100 * st.byType[s.id] / maxC}%;background:${grad(s.color)};border-radius:6px"></i></div>
        <b class="num" style="width:26px;text-align:right">${st.byType[s.id]}</b></div>`).join('') : '<div class="empty">Remplissez le planning pour voir le bilan.</div>')}
    ${section('Heures supplémentaires<button class="right press" data-a="extraAdd">Ajouter</button>', extras.length ? extras.map(x => swipeRow(`<div class="main"><div class="t">${esc(cap(parseKey(x.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })))}</div>${x.note ? `<div class="s">${esc(x.note)}</div>` : ''}</div><b class="num">+${hoursLabel(x.hours)}</b>`, [swipeDel('extraDel', x.id)])).join('') : '<div class="empty">Aucune ce mois-ci.</div>')}
    <div class="hint">Les week-ends et fériés comptent les jours où une garde commence.</div>`;
}
A.extraDel = d => { const n = nurse(); n.extra = n.extra.filter(x => x.id !== d.id); changed(); };

// ----- Autre métier : journée simple -----
function screenTravailSimple() {
  if (!["Aujourd'hui", 'Notes'].includes(UI.work)) UI.work = "Aujourd'hui";
  const seg = UI.work;
  return `<div class="screen">${head('Travail', cap(longDate(new Date())), `<span class="lock glass">${ic('lock', 14, 2)}Visible par vous seul</span>`)}
    ${switcher(["Aujourd'hui", 'Notes'], seg, 'workSeg', { key: 'works' })}
    <div class="scroll">${seg === 'Notes' ? workNotes() : workToday()}</div>${fab(seg === 'Notes' ? 'noteAdd' : 'workAdd', 'Ajouter')}</div>`;
}
