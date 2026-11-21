// Thème « Bold » (maquette C) : fond noir uni, typo très grasse, tuiles pleines en aplat de couleur.
'use strict';

const isBold = () => document.documentElement.dataset.style === 'bold';
const BOLD = { blue: '#4A74DE', orange: '#D9774F', violet: '#8C70DB', white: '#F3F4F6' };

/** Ce qui se passe aujourd'hui, à partir de maintenant : rendez-vous, garde, leçons. */
function todayTimeline() {
  const now = new Date(), tk = todayKey(), d0 = startOfDay(now), items = [];
  for (const e of eventsOn(tk)) if (!e.allDay) { const s = new Date(e.start); items.push({ at: s, title: e.title, sub: [e.who !== BOTH ? e.who : 'Nous deux', e.location].filter(Boolean).join(' · '), color: H.color(e.who), a: 'goAgenda' }); }
  if (typeof shiftOn === 'function') { const s = shiftOn(tk); if (s && s.work && s.start) { const [a, b] = shiftWindow(tk, s); items.push({ at: a, end: b, title: 'Garde ' + s.label, sub: nurseName() + ' · ' + s.start + ' – ' + s.end, color: s.color, a: 'goTabWork' }); } }
  if (jobOf(H.me) === 'cours') for (const l of lessonsBetween(d0, addDays(d0, 1))) { const t = typeById(l.type), s = new Date(l.start), stu = l.student && S.work.students.find(x => x.id === l.student);
    items.push({ at: s, end: new Date(+s + t.dur * 3600000), title: stu ? stu.name : t.full, sub: (stu ? t.full + ' · ' : H.me + ' · ') + durLabel(t.dur), color: t.color, a: 'goTabWork' }); }
  return items.filter(x => (x.end || new Date(+x.at + 3600000)) > now).sort((a, b) => a.at - b.at);
}
function screenAccueilBold() {
  const now = new Date(), tk = todayKey();
  const wd = now.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase();
  const todo = S.chores.filter(c => !c.done && c.due && c.due <= tk);
  const spent = expensesOf(now, 'Commun').reduce((s, e) => s + e.amount, 0), budget = S.fin.budget;
  const proj = S.projects.filter(p => p.deadline && projectStatus(p) !== 'Terminés' && parseKey(p.deadline) >= startOfDay(now)).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const tl = todayTimeline(), next = tl[0], later = tl.slice(1, 6);
  const shopN = S.shopping.filter(x => !x.done).length;
  const soon = S.dates.map(d => ({ d, n: nextOccurrence(d.date) })).filter(x => daysBetween(now, x.n) <= 14).sort((a, b) => a.n - b.n);
  return `<div class="screen"><div class="scroll bh">
    <div class="bh-top">
      <div class="bh-date"><div class="bh-wd">${esc(wd)}</div><div class="bh-dn">${now.getDate()}</div></div>
      <div class="bh-hello">
        <div class="bh-actions"><button class="iconbtn press" data-a="openSearch" aria-label="Rechercher">${ic('search', 21)}</button>
          <button class="press" data-a="openSettings" aria-label="Réglages" style="display:flex">${avatar(H.p1, 34)}<span style="margin-left:-10px">${avatar(H.p2, 34)}</span></button></div>
        <div class="bh-month">${esc(now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase())}</div>
        <div class="bh-name">Salut ${esc(H.me)}</div></div>
    </div>
    <div class="bh-grid">
      <button class="bt tall press" data-a="${next ? next.a : 'goAgenda'}" style="background:${BOLD.blue}"><span class="bt-l">Prochain</span>
        ${next ? `<span class="bt-time num">${hm(next.at).replace(/^0/, '')}</span><span class="bt-t">${esc(next.title)}</span><span class="bt-s">${esc(next.sub)}</span>`
          : `<span class="bt-time" style="font-size:30px">Libre</span><span class="bt-s">Rien d'autre aujourd'hui</span>`}</button>
      <button class="bt press" data-a="goTaches" style="background:${BOLD.orange}"><span class="bt-l">Tâches</span><span class="bt-big num">${todo.length}</span></button>
      <button class="bt press light" data-a="goTab" data-v="finances" style="background:${BOLD.white}"><span class="bt-l">Budget</span>
        ${budget > 0 ? `<span class="bt-mid num" style="${budget - spent < 0 ? 'color:#C0392B' : ''}">${eur(Math.round(budget - spent))}</span>` : `<span class="bt-mid" style="font-size:20px">À régler</span>`}</button>
    </div>
    ${proj ? `<button class="bt wide press" data-a="openProject" data-id="${proj.id}" style="background:${BOLD.violet}"><div style="min-width:0"><span class="bt-l">${esc(proj.name)}</span>
        <span class="bt-s">${esc(parseKey(proj.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))}${proj.goal ? ' · ' + Math.round(100 * Math.min(1, (proj.saved || 0) / proj.goal)) + ' % épargné' : ' · ' + Math.round(100 * projectProgress(proj)) + ' % fait'}</span></div>
        <span class="bt-j num">J-${daysBetween(now, parseKey(proj.deadline))}</span></button>` : ''}
    ${later.length ? `<div class="bh-sec">Plus tard</div>${later.map(x => `<button class="bh-row press" data-a="${x.a}"><b class="num">${hm(x.at).replace(/^0/, '')}</b><span>${esc(x.title)}</span><i style="background:${x.color}"></i></button>`).join('')}` : ''}
    <div class="bh-grid2">
      <button class="bt dark press" data-a="goCourses"><span class="bt-l">Courses</span><span class="bt-mid num">${shopN}</span><span class="bt-s">à acheter</span></button>
      <button class="bt dark press" data-a="${S.meals[tk] ? 'openMeals' : 'goDates'}">${S.meals[tk] ? `<span class="bt-l">Ce soir</span><span class="bt-t">${esc(S.meals[tk].title || '…')}</span>`
        : soon.length ? `<span class="bt-l">${esc(soon[0].d.kind || 'Date')}</span><span class="bt-t">${esc(soon[0].d.title)}</span><span class="bt-s">${daysBetween(now, soon[0].n) === 0 ? "Aujourd'hui" : 'Dans ' + daysBetween(now, soon[0].n) + ' j'}</span>`
        : `<span class="bt-l">Dates</span><span class="bt-s">Aucune date à venir</span>`}</button>
    </div>
    ${recapCardHtml()}
  </div></div>`;
}
