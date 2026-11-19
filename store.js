// Données de l'app, rangées dans le téléphone (localStorage).
'use strict';

const KEY = 'notrefoyer.v1';
const BOTH = 'Nous deux';
const THEME = { accent: '#1E6B5C', person1: '#2E6BD9', person2: '#C7573B', both: '#7A59C7' };
const PALETTE = ['#2F6BD8', '#1E9BD7', '#1E6B5C', '#3FA34D', '#E0A100', '#C8573A', '#D6336C', '#7A5AC8', '#5C6B73', '#8D5B3F'];
const DEFAULT_NOTEBOOKS = ['Cadeaux de Noël', 'Loyer et charges', 'Enfants'];
const FREQS = ['Une seule fois', 'Chaque jour', 'Chaque semaine', 'Tous les 15 jours', 'Chaque mois'];
const DELAYS = [[0, 'le jour même'], [1, 'la veille'], [7, '1 semaine avant'], [14, '2 semaines avant'], [30, '1 mois avant']];
const DATE_KINDS = ['Anniversaire', 'Couple', 'Famille', 'Administratif', 'Autre'];
const EXP_CATS = ['Courses', 'Loyer', 'Loisirs', 'Transport', 'Maison', 'Santé', 'Autre'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function defaults() {
  return {
    v: 1,
    settings: { person1: 'Josselin', person2: 'Conjointe', me: 'Josselin', colors: {}, photos: {}, theme: 'auto' },
    events: [], dates: [], shopping: [], shopName: '', meals: {}, chores: [], maison: [], notebooks: [], contacts: [],
    work: {
      types: [
        { id: 'ind', label: 'Individuelle', full: 'Leçon individuelle', dur: 1, rate: 40, color: '#2F6BD8', fav: true, ask: true, count: true },
        { id: 'col', label: 'Collective', full: 'Leçon collective', dur: 1.5, rate: 30, color: '#1E6B5C', fav: true, ask: false, count: true },
        { id: 'stage', label: 'Stage', full: 'Stage', dur: 3, rate: 35, color: '#B7791F', fav: false, ask: false, count: true },
      ],
      dayStart: 8, dayEnd: 21,
      lessons: [], students: [], priorities: [], notes: [], sessions: [], running: null, toFinances: true,
    },
    projects: [],
    fin: { budget: 0, catBudgets: {}, expenses: [] },
  };
}

let S;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    S = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) { S = defaults(); }
}
function merge(base, saved) {
  for (const k in saved) {
    if (saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], saved[k]);
    else base[k] = saved[k];
  }
  return base;
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Mémoire pleine : retirez quelques photos'); }
  }, 60);
}
load();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- Foyer ----------
const H = {
  get p1() { return (S.settings.person1 || '').trim() || 'Josselin'; },
  get p2() { return (S.settings.person2 || '').trim() || 'Conjointe'; },
  get me() { const m = S.settings.me; return (m === H.p1 || m === H.p2) ? m : H.p1; },
  get everyone() { return [H.p1, H.p2, BOTH]; },
  color(name) {
    const c = S.settings.colors[name];
    if (c) return c;
    if (name === H.p1) return THEME.person1;
    if (name === H.p2) return THEME.person2;
    return THEME.both;
  },
  photo(name) { return S.settings.photos[name] || null; },
  other(name) { return name === H.p1 ? H.p2 : name === H.p2 ? H.p1 : H.p1; },
};

// ---------- Couleurs ----------
function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function mix(a, b, t) { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
function rgba(h, a) { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }
function selVars(c) { return `--c:${c};--c-light:${mix(c, '#FFFFFF', .35)};--c-dark:${mix(c, '#000000', .22)};--c-shadow:${rgba(c, .4)}`; }
function grad(c) { return `linear-gradient(150deg,${mix(c, '#FFFFFF', .35)},${c} 55%,${mix(c, '#000000', .22)})`; }

// ---------- Dates ----------
const pad = n => String(n).padStart(2, '0');
function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) { const x = new Date(d); const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; }
function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
function todayKey() { return dkey(new Date()); }
function dayLabel(d) {
  const diff = daysBetween(new Date(), d);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function longDate(d) { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function weekStart(d) { const x = startOfDay(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }
function monthName(d) { return d.toLocaleDateString('fr-FR', { month: 'long' }); }
function eur(x, dec) { return (x || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec ? 2 : (Math.round(x) === x ? 0 : 2) }); }
function parseAmount(s) { if (s == null) return null; const v = parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isNaN(v) ? null : v; }
function hoursLabel(h) { const tot = Math.round(h * 60); const hh = Math.floor(tot / 60), mm = tot % 60; return hh + ' h' + (mm ? ' ' + pad(mm) : ''); }
function durLabel(d) { if (d < 1) return Math.round(d * 60) + ' min'; return hoursLabel(d); }
function fmtH(h) { const m = Math.round((h % 1) * 60); return Math.floor(h) + ':' + pad(m === 60 ? 0 : m); }

// ---------- Rayons ----------
const AISLES = [
  ['fruits', 'Fruits et légumes', 'carrot'], ['boulangerie', 'Boulangerie', 'cake'], ['frais', 'Frais', 'fridge'],
  ['viande', 'Viande et poisson', 'fish'], ['epicerie', 'Épicerie', 'bag'], ['boissons', 'Boissons', 'bottle'],
  ['surgeles', 'Surgelés', 'snow'], ['hygiene', 'Hygiène et beauté', 'comb'], ['entretien', 'Maison et entretien', 'sparkle'],
  ['bebe', 'Bébé', 'stroller'], ['autre', 'Autre', 'basket'],
];
const AISLE_WORDS = {
  fruits: ['pomme', 'poire', 'banane', 'orange', 'citron', 'fraise', 'raisin', 'kiwi', 'melon', 'tomate', 'salade', 'carotte', 'courgette', 'aubergine', 'poivron', 'oignon', 'ail', 'echalote', 'pomme de terre', 'patate', 'champignon', 'concombre', 'avocat', 'brocoli', 'chou', 'epinard', 'haricot vert', 'poireau', 'fruit', 'legume', 'herbe', 'persil', 'basilic', 'coriandre', 'mangue', 'ananas', 'clementine'],
  boulangerie: ['pain', 'baguette', 'brioche', 'croissant', 'viennoiserie', 'pain de mie', 'biscotte', 'gateau'],
  frais: ['lait', 'yaourt', 'yogourt', 'fromage', 'beurre', 'creme', 'oeuf', 'œuf', 'jambon', 'lardon', 'compote', 'dessert', 'skyr', 'mozzarella', 'emmental', 'parmesan', 'pate fraiche', 'pâte feuilletée', 'pate brisee', 'houmous', 'tofu'],
  viande: ['poulet', 'boeuf', 'bœuf', 'steak', 'porc', 'veau', 'agneau', 'dinde', 'viande', 'saucisse', 'poisson', 'saumon', 'thon frais', 'cabillaud', 'crevette', 'hache', 'escalope', 'merguez'],
  epicerie: ['pate', 'pâtes', 'riz', 'farine', 'sucre', 'sel', 'poivre', 'huile', 'vinaigre', 'cafe', 'café', 'the', 'thé', 'chocolat', 'cereale', 'confiture', 'miel', 'conserve', 'thon', 'sauce', 'ketchup', 'moutarde', 'mayonnaise', 'biscuit', 'gateau sec', 'lentille', 'pois chiche', 'semoule', 'epice', 'bouillon', 'chips', 'noix', 'amande', 'compote', 'levure', 'quinoa'],
  boissons: ['eau', 'jus', 'soda', 'coca', 'biere', 'bière', 'vin', 'sirop', 'limonade', 'champagne'],
  surgeles: ['surgele', 'surgelé', 'glace', 'pizza', 'frite', 'glacon', 'poelee'],
  hygiene: ['shampoing', 'shampooing', 'gel douche', 'savon', 'dentifrice', 'brosse a dent', 'deodorant', 'déodorant', 'coton', 'rasoir', 'creme hydratante', 'maquillage', 'papier toilette', 'mouchoir', 'serviette hygienique', 'tampon'],
  entretien: ['lessive', 'liquide vaisselle', 'pastille lave', 'eponge', 'éponge', 'sac poubelle', 'javel', 'nettoyant', 'essuie-tout', 'sopalin', 'ampoule', 'pile', 'aluminium', 'film', 'adoucissant'],
  bebe: ['couche', 'lingette', 'biberon', 'lait bebe', 'petit pot', 'tetine'],
};
const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function guessAisle(name) {
  const n = fold(name); let best = null, len = 0;
  for (const a in AISLE_WORDS) for (const w of AISLE_WORDS[a]) { const f = fold(w); if (n.includes(f) && f.length > len) { best = a; len = f.length; } }
  return best || 'autre';
}
function aisleOf(item) { return item.aisle || guessAisle(item.title); }

// ---------- Récurrences ----------
function nextDue(due, freq) {
  const d = due ? parseKey(due) : startOfDay(new Date());
  switch (freq) {
    case 'Chaque jour': return dkey(addDays(d, 1));
    case 'Chaque semaine': return dkey(addDays(d, 7));
    case 'Tous les 15 jours': return dkey(addDays(d, 14));
    case 'Chaque mois': return dkey(addMonths(d, 1));
  }
  return null;
}
/** Coche ou décoche un élément récurrent : en le cochant, la prochaine occurrence est créée (comme dans Rappels). */
function toggleRecurring(list, item, freqField) {
  const freq = item[freqField];
  if (!item.done) {
    item.done = true; item.doneAt = Date.now();
    if (freq && freq !== 'Une seule fois') {
      const copy = Object.assign({}, item, { id: uid(), done: false, doneAt: null, due: nextDue(item.due, freq), spawned: null });
      item.spawned = copy.id;
      list.splice(list.indexOf(item) + 1, 0, copy);
    }
  } else {
    item.done = false; item.doneAt = null;
    if (item.spawned) {
      const i = list.findIndex(x => x.id === item.spawned && !x.done);
      if (i >= 0) list.splice(i, 1);
      item.spawned = null;
    }
  }
}

// ---------- Dates importantes ----------
function nextOccurrence(dateKey) {
  const d = parseKey(dateKey), today = startOfDay(new Date());
  let n = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (n < today) n = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return n;
}

// ---------- Travail ----------
function typeById(id) { return S.work.types.find(t => t.id === id) || { id, label: 'Leçon', full: 'Leçon', dur: 1, rate: 0, color: '#5C6B73', count: true }; }
function lessonsBetween(a, b) { return S.work.lessons.filter(l => { const t = new Date(l.start); return t >= a && t < b; }); }
function lessonStats(list) {
  let h = 0, e = 0, n = 0;
  for (const l of list) { const t = typeById(l.type); if (!t.count) continue; h += t.dur; e += t.dur * t.rate; n++; }
  return { h, e, n };
}
function workedSeconds(dayStart, dayEnd) {
  let s = 0;
  const all = S.work.sessions.slice();
  if (S.work.running) all.push({ start: S.work.running, end: Date.now() });
  for (const x of all) { const a = Math.max(x.start, +dayStart), b = Math.min(x.end, +dayEnd); if (b > a) s += (b - a) / 1000; }
  return s;
}

// ---------- Projets ----------
const TEMPLATES = {
  'Vacances': { icon: 'sun', steps: ['Choisir la destination et les dates', 'Poser les congés', 'Réserver le logement', 'Réserver le transport', 'Faire garder les animaux', 'Vérifier les papiers d\'identité', 'Préparer les valises', 'Prévenir les voisins'], budget: true },
  'Déménagement': { icon: 'box', steps: ['Donner le préavis', 'Trier et donner', 'Demander des devis de déménageurs', 'Réserver le camion ou les déménageurs', 'Acheter les cartons', 'Changer l\'adresse (La Poste)', 'Transférer électricité et gaz', 'Transférer internet', 'Prévenir la banque et l\'assurance', 'Prévenir la CAF et les impôts', 'Faire les cartons', 'État des lieux de sortie', 'État des lieux d\'entrée', 'Récupérer la caution'], budget: true },
  'Travaux': { icon: 'hammer', steps: ['Définir le besoin', 'Fixer le budget', 'Demander 3 devis', 'Comparer et choisir', 'Signer le devis', 'Commander le matériel', 'Prévoir l\'organisation pendant les travaux', 'Vider la pièce', 'Suivre le chantier', 'Réception des travaux', 'Payer le solde', 'Garder les factures'], budget: true },
  'Projet vide': { icon: 'flag', steps: [], budget: false },
};
function projectProgress(p) { const n = p.steps.length; return n ? p.steps.filter(s => s.done).length / n : (p.status === 'Terminés' ? 1 : 0); }
function projectStatus(p) { if (p.status) return p.status; return 'En cours'; }
/** Épargne automatique : à chaque nouvelle semaine, la part prévue des gains de la semaine passée s'ajoute au projet. */
function applyAutoSavings() {
  const thisWeek = weekStart(new Date());
  let changed = false;
  for (const p of S.projects) {
    const a = p.auto; if (!a || !a.on) continue;
    let from = a.last ? addDays(parseKey(a.last), 7) : null;
    if (!from) { a.last = dkey(addDays(thisWeek, -7)); changed = true; continue; }
    while (from < thisWeek) {
      const amount = autoAmountForWeek(p, from);
      if (amount > 0) { p.saved = (p.saved || 0) + amount; (p.history = p.history || []).push({ at: dkey(from), amount, auto: true }); }
      a.last = dkey(from); from = addDays(from, 7); changed = true;
    }
  }
  if (changed) save();
}
function autoAmountForWeek(p, ws) {
  const a = p.auto; if (!a || !a.on) return 0;
  if (a.mode === 'fixed') return a.value || 0;
  const st = lessonStats(lessonsBetween(ws, addDays(ws, 7)));
  return Math.round(st.e * (a.value || 0) / 100);
}

// ---------- Finances ----------
function monthRange(d) { const a = new Date(d.getFullYear(), d.getMonth(), 1); return [a, new Date(d.getFullYear(), d.getMonth() + 1, 1)]; }
function expensesOf(d, who) {
  const [a, b] = monthRange(d);
  return S.fin.expenses.filter(e => {
    const t = parseKey(e.date);
    if (t < a || t >= b) return false;
    if (!who) return true;
    if (who === 'Commun') return e.scope === 'Commun';
    return e.scope === 'Perso' && e.paidBy === who;
  });
}
