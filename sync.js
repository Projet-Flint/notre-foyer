// Synchro automatique entre les téléphones du foyer, avec Firebase (compte gratuit du foyer).
// Chaque élément partagé (un rendez-vous, un article de courses…) est un petit document.
// On garde l'empreinte de la dernière version connue de chaque élément : ce qui a changé ici est envoyé,
// ce qui a changé ailleurs est appliqué ici. En cas de modification des deux côtés, la dernière arrivée gagne.
'use strict';

const FIREBASE_CONFIG = { // espace Firebase du foyer (ces valeurs ne sont pas secrètes, l'accès est protégé par les règles)
  apiKey: 'AIzaSyC-KlQmdvyFsxJjE0cbw6_u7TRDN0nn7GU', authDomain: 'notre-foyer-cba85.firebaseapp.com', projectId: 'notre-foyer-cba85',
  storageBucket: 'notre-foyer-cba85.firebasestorage.app', messagingSenderId: '75161031746', appId: '1:75161031746:web:b3489ab5f4a4e9d46149db',
};
const FB_VER = '10.12.2';
const SYNC_KEY = 'notrefoyer.sync';
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const SYNC = { st: loadSync(), fb: null, status: 'off', ready: false, applying: false, timer: null, unsub: null, pushing: false };
function loadSync() { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch (e) { return {}; } }
function saveSync() { try { localStorage.setItem(SYNC_KEY, JSON.stringify(SYNC.st)); } catch (e) {} }
if (!SYNC.st.device) { SYNC.st.device = uid(); saveSync(); }
const syncAvailable = () => !!FIREBASE_CONFIG;

// ---------- Ce qui est partagé ----------
const SHARED_LISTS = { events: () => S.events, dates: () => S.dates, shopping: () => S.shopping, chores: () => S.chores, maison: () => S.maison,
  contacts: () => S.contacts, projects: () => S.projects, expenses: () => S.fin.expenses };
const SHARED_KV = {
  shopName: [() => S.shopName, v => { S.shopName = v; }],
  notebooks: [() => S.notebooks, v => { S.notebooks = v || []; }],
  budget: [() => S.fin.budget, v => { S.fin.budget = v || 0; }],
  catBudgets: [() => S.fin.catBudgets, v => { S.fin.catBudgets = v || {}; }],
  person1: [() => S.settings.person1, v => { if (v) S.settings.person1 = v; }],
  person2: [() => S.settings.person2, v => { if (v) S.settings.person2 = v; }],
  colors: [() => S.settings.colors, v => { S.settings.colors = v || {}; }],
  jobs: [() => S.settings.jobs || {}, v => { S.settings.jobs = v || {}; }],
  photos: [() => S.settings.photos, v => { S.settings.photos = v || {}; }],
  nurseShifts: [() => S.nurse ? S.nurse.shifts : null, v => { if (v) nurse().shifts = v; }],
};
/** L'état partagé, à plat : clé → valeur */
function sharedItems() {
  const m = new Map();
  for (const [c, get] of Object.entries(SHARED_LISTS)) for (const it of get()) if (it && it.id) m.set(c + ':' + it.id, it);
  for (const [k, v] of Object.entries(S.meals)) if (v) m.set('meal:' + k, v);
  if (S.nurse) for (const [k, v] of Object.entries(S.nurse.plan)) if (v) m.set('plan:' + k, v);
  for (const [k, [get]] of Object.entries(SHARED_KV)) { const v = get(); if (v !== undefined && v !== null) m.set('kv:' + k, v); }
  return m;
}
function applyItem(key, v) {
  const i = key.indexOf(':'), kind = key.slice(0, i), id = key.slice(i + 1);
  if (SHARED_LISTS[kind]) {
    const list = SHARED_LISTS[kind](), at = list.findIndex(x => x.id === id);
    if (v == null) { if (at >= 0) list.splice(at, 1); }
    else if (at >= 0) list[at] = v; else list.push(v);
  } else if (kind === 'meal') { if (v == null) delete S.meals[id]; else S.meals[id] = v; }
  else if (kind === 'plan') { if (v == null) { if (S.nurse) delete S.nurse.plan[id]; } else nurse().plan[id] = v; }
  else if (kind === 'kv' && SHARED_KV[id]) SHARED_KV[id][1](v);
}
function hashOf(v) {
  const s = v == null ? 'null' : JSON.stringify(v); let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + s.length.toString(36);
}
const docId = key => key.replace(/\//g, '_');

// ---------- Firebase ----------
async function fbLoad() {
  if (SYNC.fb) return SYNC.fb;
  const base = new URL('vendor/firebase/', location.href).href; // Firebase 10.12.2, copié dans l'app
  const [app, auth, fs] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => import(base + f)));
  const a = app.initializeApp(FIREBASE_CONFIG), au = auth.getAuth(a);
  await auth.signInAnonymously(au);
  SYNC.fb = { fs, db: fs.getFirestore(a) };
  return SYNC.fb;
}
function setStatus(s) { SYNC.status = s; const el = document.getElementById('syncState'); if (el) el.textContent = syncStatusLabel(); }
function syncStatusLabel() {
  return { off: 'Pas encore relié', connecting: 'Connexion…', on: 'Relié, à jour', sending: 'Envoi…', offline: 'Hors ligne, envoi au retour du réseau', error: 'Problème de connexion' }[SYNC.status] || '';
}
async function syncStart() {
  if (!syncAvailable() || !SYNC.st.code) return;
  setStatus('connecting');
  try {
    const { fs, db } = await fbLoad();
    if (SYNC.unsub) SYNC.unsub();
    SYNC.ready = false;
    SYNC.unsub = fs.onSnapshot(fs.collection(db, 'foyers', SYNC.st.code, 'items'), snap => {
      const meta = SYNC.st.meta || (SYNC.st.meta = {});
      let changedAny = false;
      SYNC.applying = true;
      for (const ch of snap.docChanges()) {
        if (ch.type === 'removed') continue;
        const d = ch.doc.data(); if (!d || !d.key) continue;
        let v = null; if (!d.deleted) try { v = JSON.parse(d.v); } catch (e) { continue; }
        const rh = hashOf(v);
        if (meta[d.key] === rh) continue;           // rien de neuf pour cet élément
        applyItem(d.key, v); meta[d.key] = rh; changedAny = true;
      }
      SYNC.applying = false;
      saveSync();
      if (changedAny) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} render(); }
      if (!SYNC.ready) { SYNC.ready = true; syncPush(); }
      if (SYNC.status !== 'sending') setStatus(navigator.onLine === false ? 'offline' : 'on');
    }, err => { console.warn(err); setStatus('error'); });
  } catch (e) { console.warn(e); setStatus(navigator.onLine === false ? 'offline' : 'error'); }
}
async function syncPush() {
  if (!SYNC.ready || !SYNC.fb || SYNC.pushing) return;
  SYNC.pushing = true;
  try {
    const { fs, db } = SYNC.fb, meta = SYNC.st.meta || (SYNC.st.meta = {});
    const cur = sharedItems(), todo = [];
    for (const [k, v] of cur) { const h = hashOf(v); if (meta[k] !== h) todo.push([k, v, h]); }
    for (const k of Object.keys(meta)) if (!cur.has(k) && meta[k] !== hashOf(null)) todo.push([k, null, hashOf(null)]);
    if (!todo.length) return;
    setStatus('sending');
    for (let i = 0; i < todo.length; i += 400) {
      const batch = fs.writeBatch(db), part = todo.slice(i, i + 400);
      for (const [k, v] of part) {
        const s = v == null ? '' : JSON.stringify(v);
        if (s.length > 900000) { toast('Un élément est trop lourd pour être partagé (photos ?)'); continue; }
        batch.set(fs.doc(db, 'foyers', SYNC.st.code, 'items', docId(k)), { key: k, v: s, deleted: v == null, at: Date.now(), by: SYNC.st.device });
      }
      await batch.commit();
      for (const [k, , h] of part) meta[k] = h;
      saveSync();
    }
    setStatus('on');
  } catch (e) { console.warn(e); setStatus(navigator.onLine === false ? 'offline' : 'error'); }
  finally { SYNC.pushing = false; }
}
// Chaque enregistrement local déclenche un envoi, un peu plus tard.
const _localSave = save;
save = function () { _localSave(); if (SYNC.st.code && !SYNC.applying) { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncPush, 900); } };
window.addEventListener('online', () => { if (SYNC.st.code) { SYNC.fb ? syncPush() : syncStart(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && SYNC.st.code) syncPush(); });

// ---------- Relier les téléphones ----------
function newCode() { const r = crypto.getRandomValues(new Uint8Array(16)); let s = ''; for (let i = 0; i < 16; i++) s += CODE_ABC[r[i] % CODE_ABC.length]; return s.match(/.{4}/g).join('-'); }
const cleanCode = c => (c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[O]/g, '0').match(/.{1,4}/g)?.join('-') || '';
A.syncCreate = () => {
  dialog({ title: 'Créer le foyer partagé', text: 'Les données de ce téléphone (agenda, courses, tâches, dates, maison, contacts, projets, dépenses, gardes) seront envoyées dans votre espace Firebase. Ensuite, reliez l\'autre téléphone avec le code.', ok: 'Créer',
    onOk: () => { SYNC.st.code = newCode(); SYNC.st.meta = {}; saveSync(); syncStart(); changed(); setTimeout(A.syncShowCode, 400); } });
};
A.syncShowCode = () => {
  const code = SYNC.st.code; if (!code) return;
  sheet({ title: 'Code du foyer', cancel: 'Fermer', ok: 'Envoyer',
    body: `<div class="glass card" style="text-align:center;padding:22px 12px"><div class="lbl">Sur l'autre téléphone : Réglages, Partage, « Rejoindre un foyer », puis ce code</div>
      <div class="num" style="font-size:26px;font-weight:800;letter-spacing:.06em;margin-top:12px;user-select:all;-webkit-user-select:all">${esc(code)}</div></div>
      <div class="sec-f">Gardez ce code pour vous deux : il donne accès aux données du foyer.</div>`,
    onOk: () => { shareText('Code Notre Foyer', `Code de notre foyer dans l'app Notre Foyer :\n${code}\n\n(Réglages › Partage › Rejoindre un foyer)`); return false; } });
};
A.syncJoin = () => {
  dialog({ title: 'Rejoindre un foyer', text: 'Tapez le code affiché sur l\'autre téléphone. Ce qui est déjà dans ce téléphone sera ajouté au foyer.', placeholder: 'XXXX-XXXX-XXXX-XXXX', ok: 'Rejoindre',
    onOk: v => { const c = cleanCode(v); if (c.replace(/-/g, '').length !== 16) { toast('Code incomplet : 16 caractères'); return; }
      SYNC.st.code = c; SYNC.st.meta = {}; saveSync(); syncStart(); changed();
      setTimeout(() => menu('Ce téléphone est celui de…', [H.p1, H.p2].map(n => ({ label: n, icon: 'person', fn: () => { S.settings.me = n; changed(); toast('Foyer rejoint !'); } }))), 2500); } });
};
A.syncStop = () => {
  dialog({ title: 'Arrêter le partage ?', text: 'Ce téléphone garde ses données, mais ne recevra plus les changements de l\'autre.', ok: 'Arrêter', danger: true,
    onOk: () => { if (SYNC.unsub) SYNC.unsub(); SYNC.unsub = null; SYNC.ready = false; delete SYNC.st.code; delete SYNC.st.meta; saveSync(); setStatus('off'); changed(); } });
};
A.syncNow = () => { SYNC.fb ? syncPush() : syncStart(); toast('Synchronisation…'); };
function syncSettingsHtml() {
  if (!syncAvailable()) return section('Partage entre téléphones', `<div class="row"><span style="color:var(--text2)">${ic('people', 20)}</span><div class="main"><div class="t">Bientôt</div><div class="s">La synchro arrive dès que l'espace Firebase du foyer est branché.</div></div></div>`);
  if (!SYNC.st.code) return section('Partage entre téléphones', `
      <button class="row press" data-a="syncCreate" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('plus', 20)}</span><div class="main"><div class="t">Créer le foyer partagé</div><div class="s">Sur le premier téléphone</div></div></button>
      <button class="row press" data-a="syncJoin" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('people', 20)}</span><div class="main"><div class="t">Rejoindre un foyer</div><div class="s">Sur le deuxième, avec le code</div></div></button>`,
    'Courses, agenda, tâches, dates, maison, contacts, projets, dépenses et gardes se mettent à jour sur vos deux téléphones. Les leçons et les notes de travail restent sur chaque téléphone.');
  return section('Partage entre téléphones', `
      <div class="row"><span style="color:var(--accent)">${ic('people', 20)}</span><div class="main"><div class="t">Foyer partagé</div><div class="s" id="syncState">${esc(syncStatusLabel())}</div></div><button class="lbl press" data-a="syncNow" style="color:var(--accent);font-weight:600">Actualiser</button></div>
      <button class="row press" data-a="syncShowCode" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('share', 20)}</span><span class="main t">Voir le code pour l'autre téléphone</span></button>
      <button class="row press danger" data-a="syncStop" style="width:100%;text-align:left">${ic('trash', 20)}<span class="main">Arrêter le partage sur ce téléphone</span></button>`);
}
setTimeout(syncStart, 300);
