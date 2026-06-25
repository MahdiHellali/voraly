# Voraly Sync Engine — Extension Chrome (MV3)

Synchronise les KPIs de freelancing (Fiverr, Upwork, Malt) vers le dashboard
Voraly, **sans friction et sans risque de ban**.

## Architecture : background silent fetch (PRD §2)

Cycle 100% en tâche de fond, **sans aucune ouverture de page** par l'utilisateur :

```
voraly.net  ──postMessage(token)──►  content script (voraly-bridge.js)
                                          └─► service worker stocke le token

Alarme 6h + jitter 0-25 min (service-worker.js)
   ├─ GET  /api/platforms/active (Bearer JWT) ──► ["fiverr","upwork"]
   └─ pour chaque plateforme (délai 5-10 s) :
        ├─ fetch direct credentialed → API interne plateforme (platforms.js)
        ├─ parse JSON → 4 KPIs (parser.js)
        └─ POST /api/platforms/sync (Bearer JWT) ──► backend Voraly
              └─ retry 1/5/15 min via chrome.alarms si échec réseau
   401/403/redirect-login → POST { error:"session_expired" }
```

### ⚠ Avertissement technique à valider AVANT publication

Un `fetch()` cross-site depuis le service worker **n'envoie pas** les cookies de
session `SameSite=Lax/Strict` : Lax n'autorise le cookie que sur une **navigation
top-level**, pas une sous-requête de fond. `credentials:'include'` ne gère que
`SameSite=None`. Donc **si** Fiverr/Upwork/Malt protègent leur session en Lax/Strict
(cas le plus courant) ou exigent un token anti-CSRF, le fetch renverra une page de
login → `session_expired`.

Le code détecte ce cas explicitement (pas de données corrompues). **Avant de
publier, faites le test empirique ci-dessous** : il dit en 2 min si chaque
plateforme est exploitable par fetch background. Si non, l'alternative qui marche
est la lecture in-page (content script) — disponible dans l'historique git.

`User-Agent` / `Referer` ne sont **pas** définis : forbidden headers ignorés par
`fetch()` (le navigateur envoie un UA réel automatiquement).

## Test empirique (2 min, par plateforme)

1. Connectez-vous normalement à la plateforme (ex. Fiverr) dans Chrome.
2. `chrome://extensions/` → Voraly Sync Engine → **Service Worker → Inspect**.
3. Dans la console du SW, collez :
   ```js
   fetch('https://www.fiverr.com/api/v1/me/earnings', {
     credentials: 'include', headers: { Accept: 'application/json' }
   }).then(r => { console.log('status', r.status, 'redirected', r.redirected, r.url); return r.text() })
     .then(t => console.log(t.slice(0, 300)))
   ```
4. **Lecture du résultat :**
   - JSON avec vos vraies données → ✅ fetch background OK pour cette plateforme.
   - `status 401/403`, redirection vers `/login`, ou HTML → ❌ cookie non transmis
     (SameSite) : le background fetch ne marchera pas, basculez sur l'in-page.

## Structure

```
voraly-extension/
├── manifest.json
├── icons/                       (16/48/128 — placeholders violet Voraly)
├── src/
│   ├── background/service-worker.js   Cycle 6h + jitter + retry (alarmes)
│   ├── content/voraly-bridge.js       Capture token (origine stricte)
│   └── lib/
│       ├── config.js     backend URL, endpoints plateformes, staleness 6h, backoff
│       ├── storage.js    chrome.storage.local + staleness + file de retry
│       ├── backend.js    /active, /sync (Bearer JWT)
│       ├── platforms.js  fetch direct credentialed + détection session_expired
│       ├── parser.js     JSON plateforme → 4 KPIs
│       └── logger.js     logs sans données sensibles
├── PRIVACY.md
├── build.sh / build.ps1
└── README.md
```

## Étape requise côté dashboard (voraly.net)

L'extension attend ce message émis par votre app (le JWT est l'`access_token`
de la session Supabase). Émettez-le au montage **ET** sur `onAuthStateChange`,
pour que le token rafraîchi (événement `TOKEN_REFRESHED`, ~toutes les heures)
soit ré-injecté dans l'extension — c'est le mécanisme de renouvellement (il n'y
a volontairement pas de refresh côté extension) :

```ts
// Ex. dans un Client Component monté sur le dashboard (useEffect)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const emit = (session: { access_token: string; expires_at?: number } | null) => {
  if (!session) return
  window.postMessage(
    {
      type: 'VORALY_AUTH_TOKEN',
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
    },
    'https://voraly.net', // origine stricte, jamais "*"
  )
}

supabase.auth.getSession().then(({ data }) => emit(data.session))
const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => emit(session))
// cleanup: sub.subscription.unsubscribe()
```

## Calibrer endpoints + parsers (reverse-engineering)

Deux choses à confirmer par DevTools (uniquement si le test empirique ci-dessus
est ✅ pour la plateforme) :

1. **L'URL de l'API** dans `config.js > PLATFORM_ENDPOINTS` — DevTools → Network →
   filtre Fetch/XHR sur la page earnings → repérez la requête qui renvoie les
   chiffres → copiez son URL.
2. **La forme du JSON** dans `parser.js > PARSERS[platform]` — onglet Response de
   cette requête → ajustez les chemins (`d?.earnings?.total`, …).

Tant que ce n'est pas calibré, le SW logge un avertissement et **rien n'est
envoyé** (pas de données corrompues).

## Tests locaux

1. **Backend** : pour pointer en local, mettez `BACKEND_URL = 'http://localhost:3000'`
   dans `src/lib/config.js` et ajoutez `"http://localhost:3000/*"` aux
   `host_permissions` du manifest. Lancez `npm run dev` dans `voraly-web/`.
2. **Charger l'extension** : `chrome://extensions/` → activez *Mode développeur*
   → *Charger l'extension non empaquetée* → sélectionnez `voraly-extension/`.
3. **Token** : ouvrez voraly.net (ou localhost), connectez-vous. Vérifiez dans
   `chrome://extensions/ → Service Worker → Inspect → Application → Storage` que
   `voraly_token` est présent.
4. **Déclencher le cycle sans attendre 6h** : dans la console du Service Worker :
   ```js
   chrome.alarms.create('voraly-sync', { when: Date.now() + 1000 })
   ```
   Puis lisez les logs : `[platform] métriques : …` + `sync OK`, ou
   `[platform] session expirée …` si le cookie n'est pas transmis.
5. **Dashboard** : la connexion passe à `last_sync_at` récent → « Synchronisé il
   y a X min » (ou badge `session_expired`).

## Build pour le Chrome Web Store

```bash
bash build.sh   # produit voraly-extension.zip à la racine
```

Checklist pré-publication : voir `PRIVACY.md`, icônes 16/48/128 ✅, description,
captures d'écran, version testée localement.
