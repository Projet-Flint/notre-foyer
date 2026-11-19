// Code d'accès : chacun crée son code à 4 chiffres, demandé à l'ouverture de l'app.
// Les codes restent dans ce téléphone (ni exportés, ni partagés), seulement sous forme d'empreinte.
'use strict';

const LOCK_KEY = 'notrefoyer.lock';
const LOCK = { codes: (() => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || {}; } catch (e) { return {}; } })(), hiddenAt: 0, open: false };
const saveLock = () => { try { localStorage.setItem(LOCK_KEY, JSON.stringify(LOCK.codes)); } catch (e) {} };
const hasCode = n => !!LOCK.codes[n];
async function pinHash(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const newSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');

/** Pavé numérique en plein écran. mode 'unlock' | 'set' */
function pinPad({ title, sub, people, who, onDone, onCancel, forgot, bio }) {
  const el = document.createElement('div');
  el.className = 'lockscreen'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  let pin = '', cur = who;
  const draw = () => {
    el.innerHTML = `<div class="lockbox">
      ${people && people.length > 1 ? `<div class="lockpeople">${people.map(n => `<button class="press ${n === cur ? 'on' : ''}" data-who="${esc(n)}">${avatar(n, 54)}<span>${esc(n)}</span></button>`).join('')}</div>`
        : `<div class="lockav">${avatar(cur, 72)}</div>`}
      <h2>${esc(typeof title === 'function' ? title(cur) : title)}</h2><p class="lbl">${esc(sub || '')}</p>
      <div class="dots4">${[0, 1, 2, 3].map(i => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="press" data-k="${n}">${n}</button>`).join('')}
        <button class="press small" data-k="x">${onCancel ? 'Annuler' : forgot ? 'Oublié ?' : ''}</button><button class="press" data-k="0">0</button><button class="press small" data-k="del" aria-label="Effacer">⌫</button></div>
      ${bio && bio.has(cur) ? `<button class="press faceid" data-bio="1">${ic('faceid', 22)}<span>Face ID</span></button>` : ''}</div>`;
  };
  draw();
  el.addEventListener('click', async e => {
    const w = e.target.closest('[data-who]'); if (w) { cur = w.dataset.who; pin = ''; draw(); return; }
    if (e.target.closest('[data-bio]')) { if (await bio.run(cur)) { el.classList.add('out'); setTimeout(() => el.remove(), 260); } return; }
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'x') { if (onCancel) { el.remove(); onCancel(); } else if (forgot) forgot(cur); return; }
    if (k === 'del') { pin = pin.slice(0, -1); draw(); return; }
    if (pin.length >= 4) return;
    pin += k; haptic(); draw();
    if (pin.length === 4) {
      const ok = await onDone(pin, cur);
      if (ok) { el.classList.add('out'); setTimeout(() => el.remove(), 260); }
      else { el.querySelector('.dots4').classList.add('shake'); haptic('error'); setTimeout(() => { pin = ''; draw(); }, 450); }
    }
  });
  document.body.appendChild(el);
  if (bio && bio.auto && bio.has(cur)) setTimeout(async () => { if (el.isConnected && await bio.run(cur, true)) { el.classList.add('out'); setTimeout(() => el.remove(), 260); } }, 350);
  return el;
}

function unlocked(n) { LOCK.open = false; if (n !== H.me) { S.settings.me = n; changed(); } }

// ---------- Face ID (passkey de l'iPhone, gardée dans ce téléphone et le trousseau iCloud) ----------
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const bioSupported = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
async function bioCheck(n, silent) {
  const c = LOCK.codes[n]; if (!c || !c.cred) return false;
  try {
    const r = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: unb64(c.cred) }], userVerification: 'required', timeout: 60000 } });
    const flags = new Uint8Array(r.response.authenticatorData)[32];
    return r && b64(r.rawId) === c.cred && !!(flags & 4); // 4 = l'iPhone a bien vérifié le visage (ou le code de l'iPhone)
  } catch (e) { if (!silent) toast('Face ID n\'a pas fonctionné, tapez votre code'); return false; }
}
A.bioOn = async () => {
  const me = H.me, c = LOCK.codes[me]; if (!c) return;
  try {
    const r = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'Notre Foyer' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'Notre Foyer · ' + me, displayName: me },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' }, timeout: 60000 } });
    c.cred = b64(r.rawId); saveLock(); haptic('success'); toast('Face ID activé'); render();
  } catch (e) { toast(e && e.name === 'NotAllowedError' ? 'Activation annulée' : 'Face ID indisponible sur cet appareil'); }
};
A.bioOff = () => { const c = LOCK.codes[H.me]; if (c) { delete c.cred; saveLock(); toast('Face ID retiré'); render(); } };

function lockNow() {
  const people = [H.p1, H.p2].filter(hasCode);
  if (!people.length || LOCK.open) return;
  LOCK.open = true;
  const who = hasCode(H.me) ? H.me : people[0];
  pinPad({ title: n => 'Bonjour ' + n, sub: 'Tapez votre code', people, who,
    onDone: async (pin, n) => { const c = LOCK.codes[n]; const ok = (await pinHash(pin, c.salt)) === c.hash;
      if (ok) unlocked(n); return ok; },
    bio: { auto: true, has: n => !!(LOCK.codes[n] && LOCK.codes[n].cred), run: async (n, silent) => { const ok = await bioCheck(n, silent); if (ok) unlocked(n); return ok; } },
    forgot: n => dialog({ title: 'Code oublié', danger: true, ok: 'Tout effacer',
      text: `Pour protéger les données, le seul moyen est d'effacer ce téléphone. Si le partage entre téléphones est activé, vos données reviendront en rejoignant le foyer avec son code (visible sur l'autre téléphone).`,
      onOk: () => { localStorage.clear(); location.reload(); } }) });
}

// ---------- Réglages ----------
function lockSettingsHtml() {
  const me = H.me, on = hasCode(me);
  return section("Code d'accès", on
    ? `<div class="row"><span style="color:var(--accent)">${ic('lock', 20)}</span><div class="main"><div class="t">Code de ${esc(me)} activé</div><div class="s">Demandé à l'ouverture de l'app</div></div></div>
       ${bioSupported() ? (LOCK.codes[me].cred
         ? `<button class="row press" data-a="bioOff" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('faceid', 20)}</span><div class="main"><div class="t">Face ID activé</div><div class="s">Touchez pour le retirer</div></div></button>`
         : `<button class="row press" data-a="bioOn" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('faceid', 20)}</span><div class="main"><div class="t">Déverrouiller avec Face ID</div><div class="s">Le code reste en secours</div></div></button>`) : ''}
       <button class="row press" data-a="lockSet" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('pencil', 20)}</span><span class="main t">Changer mon code</span></button>
       <button class="row press danger" data-a="lockOff" style="width:100%;text-align:left">${ic('trash', 20)}<span class="main">Retirer mon code</span></button>`
    : `<button class="row press" data-a="lockSet" style="width:100%;text-align:left"><span style="color:var(--accent)">${ic('lock', 20)}</span><div class="main"><div class="t">Créer mon code</div><div class="s">4 chiffres, rien que pour ${esc(me)}</div></div></button>`,
    'Chacun crée son code sur son téléphone. Il reste dans ce téléphone et n\'est jamais envoyé.');
}
A.lockSet = () => {
  const me = H.me;
  pinPad({ title: 'Choisissez votre code', sub: '4 chiffres faciles à retenir', who: me, onCancel: () => {},
    onDone: async first => {
      setTimeout(() => pinPad({ title: 'Confirmez le code', sub: 'Tapez-le une seconde fois', who: me, onCancel: () => {},
        onDone: async again => {
          if (again !== first) { toast('Les deux codes sont différents, recommencez'); return false; }
          const salt = newSalt(); LOCK.codes[me] = Object.assign(LOCK.codes[me] || {}, { salt, hash: await pinHash(first, salt) }); saveLock();
          haptic('success'); toast('Code créé'); render(); return true; } }), 280);
      return true; } });
};
A.lockOff = () => {
  const me = H.me, c = LOCK.codes[me]; if (!c) return;
  pinPad({ title: 'Code actuel', sub: 'Pour retirer le code', who: me, onCancel: () => {},
    onDone: async pin => { const ok = (await pinHash(pin, c.salt)) === c.hash; if (ok) { delete LOCK.codes[me]; saveLock(); toast('Code retiré'); render(); } return ok; } });
};

// À l'ouverture, et au retour dans l'app après plus d'une minute.
lockNow();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') LOCK.hiddenAt = Date.now();
  else if (LOCK.hiddenAt && Date.now() - LOCK.hiddenAt > 60000) lockNow();
});
