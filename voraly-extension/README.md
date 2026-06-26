# Voraly Sync Engine — Extension Chrome (MV3)

Connecte les plateformes de freelancing (Fiverr, Upwork, Malt) au dashboard
Voraly via un flow de connexion **« OAuth-like »**, **sans friction et sans
risque de ban**.

## Architecture finale (Phase 1 + 2 hardened)

### Phase 1 — Popup login « OAuth-like »

```
voraly.net  ──postMessage(VORALY_AUTH_TOKEN)──►  content script (voraly-bridge.js)
                                                     └─► service worker stocke le JWT

User clique « Connecter Fiverr » sur /dashboard/platforms
   └─ le service worker ouvre une popup vers la plateforme (PLATFORM_LOGIN_URLS)
        └─ le freelance se connecte réellement (session navigateur normale)
             └─ content script (platform-login.js) détecte la session via un
                fetch SAME-ORIGIN léger (/me, /info.json…) sur l'origine courante
                  └─ état « connecté » stocké en chrome.storage.local
                       └─ la popup se referme automatiquement
```

### Phase 2 — Durcissement sécurité (rewrite)

Le cycle de **fetch credentialed en tâche de fond** (alarme 6h → API interne
plateforme → POST /sync) a été **retiré** : un `fetch()` cross-site depuis le
service worker n'envoie pas les cookies `SameSite=Lax/Strict`, et marteler les
APIs internes des plateformes expose à un risque de ban.

- ❌ **Retiré** : background credentialed fetch, alarmes, retry, endpoints
  plateformes, parsing KPIs.
- ✅ **Conservé** : popup login + détection de session same-origin (zéro
  friction, zéro risque de ban).
- ✅ **Backend durci** : rate-limit serveur 5h (`/api/platforms/sync`), CORS en
  allowlist (`voraly.net` + `chrome-extension://*`, plus de `*`), RLS intacte.

### Phase 3 (future) — Sync des métriques sans risque de ban

La route `POST /api/platforms/sync` existe et est durcie, mais **n'a pas de
caller** dans l'extension actuelle. Pour réactiver la synchronisation des KPIs
sans le risque de ban :

1. Extraire les KPIs **en same-origin** (dans `platform-login.js` ou un nouveau
   content script injecté sur la page earnings de la plateforme).
2. Appeler le backend depuis ce contexte same-origin.
3. À ce moment, réintroduire un parser JSON/DOM et le helper d'envoi backend
   (disponibles dans l'historique git, commit antérieur à ce rewrite).

## Structure

```
voraly-extension/
├── manifest.json                  permissions:[storage], host:[voraly.net]
├── icons/                         (16/48/128)
├── src/
│   ├── background/service-worker.js   Flow popup login + stockage token
│   ├── content/voraly-bridge.js       Capture du token (origine stricte)
│   ├── content/platform-login.js      Détection de session same-origin
│   └── lib/
│       ├── config.js     backend URL, URLs login plateformes, clés storage
│       ├── storage.js    chrome.storage.local (token, connexions, popups)
│       ├── backend.js    validité du token Bearer
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

## Tests locaux

1. **Backend** : pour pointer en local, mettez `BACKEND_URL = 'http://localhost:3000'`
   dans `src/lib/config.js` et ajoutez `"http://localhost:3000/*"` aux
   `host_permissions` du manifest. Lancez `npm run dev` dans `voraly-web/`.
   **Pensez à reverter ces deux changements avant tout commit.**
2. **Charger l'extension** : `chrome://extensions/` → activez *Mode développeur*
   → *Charger l'extension non empaquetée* → sélectionnez `voraly-extension/`.
3. **Token** : ouvrez voraly.net (ou localhost), connectez-vous. Vérifiez dans
   `chrome://extensions/ → Service Worker → Inspect → Application → Storage` que
   `voraly_token` est présent.
4. **Connexion plateforme** : sur `/dashboard/platforms`, cliquez « Connecter
   Fiverr ». La popup s'ouvre, connectez-vous ; elle se referme et la plateforme
   passe à « Connecté ».

## Build pour le Chrome Web Store

```bash
bash build.sh   # produit voraly-extension.zip à la racine
```

Checklist pré-publication : voir `PRIVACY.md`, icônes 16/48/128 ✅, description,
captures d'écran, version testée localement.
