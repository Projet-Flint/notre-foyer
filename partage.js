// Partager son emploi du temps (semaine ou mois) : en message, en image ou en fichier calendrier.
'use strict';

const SHARE_SOURCES = {
  agenda: { title: 'Agenda', ref: () => parseKey(UI.day) },
  cours: { title: 'Mes horaires', ref: () => parseKey(UI.workDay) },
  infirmier: { title: 'Mon planning', ref: () => parseKey(UI.nMonth || todayKey()) },
};
/** Les éléments à partager entre deux dates, triés par jour puis par heure. */
function scheduleItems(src, a, b) {
  const items = [];
  const inRange = d => d >= a && d < b;
  if (src === 'agenda' || src === 'infirmier') {
    for (let d = new Date(a); d < b; d = addDays(d, 1)) {
      const k = dkey(d), s = typeof shiftOn === 'function' ? shiftOn(k) : null;
      if (s) {
        const it = { day: new Date(d), title: (src === 'agenda' ? 'Garde : ' : '') + s.label, color: s.color, code: s.code, allDay: !s.work || !s.start };
        if (!it.allDay) { const [x, y] = shiftWindow(k, s); it.start = x; it.end = y; it.time = s.start + ' – ' + s.end; }
        items.push(it);
      }
      if (src === 'agenda') for (const x of datesOn(k)) items.push({ day: new Date(d), title: x.title, color: '#E8743B', allDay: true, sub: x.kind });
    }
  }
  if (src === 'agenda') {
    for (const e of S.events) {
      const d = e.allDay ? parseKey(e.start.slice(0, 10)) : new Date(e.start);
      if (!inRange(startOfDay(d))) continue;
      const it = { day: startOfDay(d), title: e.title, color: H.color(e.who), allDay: e.allDay, sub: [e.who !== BOTH ? e.who : '', e.location].filter(Boolean).join(' · ') };
      if (!e.allDay) { it.start = d; it.end = new Date(+d + 3600000); it.time = hm(d); }
      items.push(it);
    }
  }
  if (src === 'cours') {
    for (const l of lessonsBetween(a, b)) {
      const t = typeById(l.type), s = new Date(l.start), e = new Date(+s + t.dur * 3600000);
      const stu = l.student && S.work.students.find(x => x.id === l.student);
      items.push({ day: startOfDay(s), title: t.full, sub: stu ? stu.name : '', color: t.color, start: s, end: e, time: hm(s) + ' – ' + hm(e) });
    }
  }
  return items.sort((x, y) => x.day - y.day || (x.allDay ? -1 : 0) - (y.allDay ? -1 : 0) || (x.start || 0) - (y.start || 0));
}
function rangeFor(kind, ref) {
  if (kind === 'semaine') { const a = weekStart(ref); return [a, addDays(a, 7), 'semaine du ' + a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })]; }
  const [a, b] = monthRange(ref); return [a, b, a.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })];
}

A.shareSchedule = d => {
  const src = d.v, ref = SHARE_SOURCES[src].ref();
  const ws = weekStart(ref);
  menu('Que voulez-vous partager ?', [
    { label: 'La semaine du ' + ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), icon: 'calendar', fn: () => shareFormat(src, 'semaine', ref) },
    { label: 'Le mois de ' + monthName(ref), icon: 'calendar', fn: () => shareFormat(src, 'mois', ref) },
  ]);
};
function shareFormat(src, kind, ref) {
  const [a, b, label] = rangeFor(kind, ref);
  const items = scheduleItems(src, a, b);
  if (!items.length) { toast('Rien de prévu sur cette période'); return; }
  const who = src === 'agenda' ? 'Notre agenda' : (src === 'infirmier' ? 'Planning de ' : 'Horaires de ') + H.me;
  const title = `${who} · ${label}`;
  setTimeout(() => menu('Comment l\'envoyer ?', [
    { label: 'En image', icon: 'camera', fn: () => shareImage(src, kind, a, b, items, title) },
    { label: 'En message', icon: 'message', fn: () => shareText(title, scheduleText(items, title)) },
    { label: 'Pour un calendrier (.ics)', icon: 'calendar', fn: () => downloadFile(fileName(title) + '.ics', scheduleIcs(items), 'text/calendar') },
  ]), 420);
}
const fileName = t => fold(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'planning';
function scheduleText(items, title) {
  let out = title + '\n', last = '';
  for (const it of items) {
    const k = dkey(it.day);
    if (k !== last) { out += '\n' + cap(it.day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) + '\n'; last = k; }
    out += '• ' + (it.time ? it.time + ' ' : '') + it.title + (it.sub ? ' (' + it.sub + ')' : '') + '\n';
  }
  return out.trim();
}
function scheduleIcs(items) {
  const f = x => x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z';
  const fd = x => x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate());
  const clean = s => String(s).replace(/[,;\n]/g, ' ');
  const ev = items.map(it => ['BEGIN:VEVENT', 'UID:' + uid() + '@notrefoyer', 'DTSTAMP:' + f(new Date()),
    ...(it.start ? ['DTSTART:' + f(it.start), 'DTEND:' + f(it.end)] : ['DTSTART;VALUE=DATE:' + fd(it.day), 'DTEND;VALUE=DATE:' + fd(addDays(it.day, 1))]),
    'SUMMARY:' + clean(it.title), ...(it.sub ? ['DESCRIPTION:' + clean(it.sub)] : []), 'END:VEVENT'].join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Notre Foyer//FR', ...ev, 'END:VCALENDAR'].join('\r\n');
}

/** Image du planning : liste par jour, ou grille du mois pour un planning de gardes. */
function shareImage(src, kind, a, b, items, title) {
  const W = 1080, P = 56, dark = false;
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  const font = (w, s) => `${w} ${s}px -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif`;
  const grid = src === 'infirmier' && kind === 'mois';
  let H0;
  const days = []; for (let d = new Date(a); d < b; d = addDays(d, 1)) days.push(new Date(d));
  const byDay = {}; items.forEach(it => (byDay[dkey(it.day)] = byDay[dkey(it.day)] || []).push(it));
  if (grid) { const weeks = Math.ceil(daysBetween(weekStart(a), b) / 7); H0 = 260 + weeks * 150 + 180; }
  else { const shown = days.filter(d => byDay[dkey(d)]); H0 = 240 + shown.reduce((s, d) => s + 70 + byDay[dkey(d)].length * 76, 0) + 90; }
  cv.width = W; cv.height = H0;
  // fond façon app
  const bg = ctx.createLinearGradient(0, 0, W, H0); bg.addColorStop(0, '#EEF4F1'); bg.addColorStop(1, '#F3EEEA'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H0);
  [[.1, .05, '#5CC3AC'], [1, .45, '#7FA6F0'], [0, .85, '#F0957C'], [.95, 1, '#B39CF0']].forEach(([x, y, c]) => {
    const g = ctx.createRadialGradient(x * W, y * H0, 0, x * W, y * H0, W * .6); g.addColorStop(0, rgba(c, .45)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H0); });
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const glass = (x, y, w, h, r) => { rr(x, y, w, h, r); ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.fill(); ctx.strokeStyle = 'rgba(20,60,50,.18)'; ctx.lineWidth = 2; ctx.stroke(); };
  ctx.fillStyle = '#3F4D48'; ctx.font = font(600, 30); ctx.fillText('NOTRE FOYER', P, 92);
  ctx.fillStyle = '#14201C'; ctx.font = font(800, 54);
  const [t1, t2] = title.split(' · '); ctx.fillText(t1, P, 158); ctx.font = font(600, 36); ctx.fillStyle = '#1E6B5C'; ctx.fillText(cap(t2), P, 206);
  let y = 250;
  if (grid) {
    const cw = (W - 2 * P) / 7, first = weekStart(a), weeks = Math.ceil(daysBetween(first, b) / 7);
    ctx.font = font(700, 26); ctx.fillStyle = '#3F4D48'; ctx.textAlign = 'center';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((l, i) => ctx.fillText(l, P + cw * i + cw / 2, y + 20));
    y += 44;
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(first, i), k = dkey(d), x = P + cw * (i % 7), yy = y + Math.floor(i / 7) * 150, it = (byDay[k] || [])[0];
      const out = d < a || d >= b;
      ctx.globalAlpha = out ? .3 : 1;
      if (it) { const g = ctx.createLinearGradient(x, yy, x + cw, yy + 136); g.addColorStop(0, mix(it.color, '#FFFFFF', .3)); g.addColorStop(1, it.color); rr(x + 5, yy, cw - 10, 136, 22); ctx.fillStyle = g; ctx.fill(); }
      else glass(x + 5, yy, cw - 10, 136, 22);
      ctx.fillStyle = it ? '#fff' : '#14201C'; ctx.font = font(700, 34); ctx.fillText(String(d.getDate()), x + cw / 2, yy + 52);
      if (it) { ctx.font = font(800, 30); ctx.fillText(it.code || it.title.slice(0, 3), x + cw / 2, yy + 100); }
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
    y += weeks * 150 + 20;
    const legend = nurse().shifts.filter(s => items.some(it => it.code === s.code));
    let lx = P; ctx.font = font(600, 26);
    for (const s of legend) {
      const txt = `${s.code} ${s.label}${s.work && s.start ? ' ' + s.start + '–' + s.end : ''}`, w = ctx.measureText(txt).width + 50;
      if (lx + w > W - P) { lx = P; y += 48; }
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(lx + 12, y + 18, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#14201C'; ctx.fillText(txt, lx + 32, y + 28); lx += w + 16;
    }
  } else {
    for (const d of days) {
      const list = byDay[dkey(d)]; if (!list) continue;
      ctx.fillStyle = '#3F4D48'; ctx.font = font(700, 28); ctx.fillText(cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })).toUpperCase(), P + 8, y + 40);
      y += 60; glass(P, y, W - 2 * P, list.length * 76 + 10, 30); y += 5;
      for (const it of list) {
        ctx.fillStyle = '#14201C'; ctx.font = font(700, 30); ctx.fillText(it.allDay ? 'Journée' : (it.time || '').split(' – ')[0], P + 28, y + 48);
        rr(P + 170, y + 14, 8, 48, 4); ctx.fillStyle = it.color; ctx.fill();
        ctx.fillStyle = '#14201C'; ctx.font = font(600, 32); ctx.fillText(it.title.slice(0, 38), P + 200, y + (it.sub ? 38 : 50));
        if (it.sub) { ctx.fillStyle = '#5B6964'; ctx.font = font(500, 24); ctx.fillText(it.sub.slice(0, 50), P + 200, y + 66); }
        y += 76;
      }
      y += 10;
    }
  }
  ctx.fillStyle = '#5B6964'; ctx.font = font(500, 24); ctx.textAlign = 'center'; ctx.fillText('Envoyé depuis Notre Foyer', W / 2, H0 - 36); ctx.textAlign = 'left';
  cv.toBlob(blob => {
    const file = new File([blob], fileName(title) + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title }).catch(() => {});
    else { const url = URL.createObjectURL(blob); openLayer(`<div class="dialog" style="width:calc(100% - 24px);top:50%;max-height:85%;overflow:auto"><img src="${url}" style="width:100%;display:block" alt="${esc(title)}"><p style="margin:10px">Appui long sur l'image pour l'enregistrer ou la partager.</p></div>`); }
  }, 'image/png');
}
