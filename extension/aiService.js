// ─── Voraly · Service IA Centralisé ─────────────────────────────────────────
// Orchestre les requêtes vers les Supabase Edge Functions.
// Conforme MV3 — aucune dépendance CDN, fetch() natif uniquement.
//
// IMPORTANT : Aucune clé Gemini n'est stockée ici.
// L'Edge Function Supabase est la seule entité qui appelle l'API Gemini.
//
// SÉCURITÉ : chat-refine exige un JWT utilisateur réel (pas la clé anon).
// getUserJWT() récupère le token depuis voraly.me via credentials:'include'.

import { SUPABASE_URL, SUPABASE_ANON_KEY, VORALY_APP_URL } from './supabase-config.js';

// ─── Token JWT management ─────────────────────────────────────────────────────

const TOKEN_CACHE_KEY    = 'voralyUserToken';
const TOKEN_EXPIRY_KEY   = 'voralyUserTokenExpiry';
const TOKEN_TTL_MS       = 50 * 60 * 1000; // 50 min (JWT valid 1h, refresh at 50m)

/**
 * Obtient le JWT de l'utilisateur connecté sur voraly.me.
 * - Utilise le cache chrome.storage.local (50 min TTL)
 * - Si expiré, recharge depuis /api/auth/session (nécessite cookies voraly.me)
 * @returns {Promise<string|null>} access_token ou null si non connecté
 */
async function getUserJWT() {
  // 1. Vérifier le cache
  const cached = await new Promise((resolve) => {
    chrome.storage.local.get([TOKEN_CACHE_KEY, TOKEN_EXPIRY_KEY], resolve);
  });

  if (cached[TOKEN_CACHE_KEY] && cached[TOKEN_EXPIRY_KEY] > Date.now()) {
    return cached[TOKEN_CACHE_KEY];
  }

  // 2. Récupérer depuis l'app web (envoie les cookies Supabase de voraly.me)
  try {
    const res = await fetch(`${VORALY_APP_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;

    const { access_token } = await res.json();
    if (!access_token) return null;

    // 3. Mettre en cache
    await new Promise((resolve) => {
      chrome.storage.local.set({
        [TOKEN_CACHE_KEY]:  access_token,
        [TOKEN_EXPIRY_KEY]: Date.now() + TOKEN_TTL_MS,
      }, resolve);
    });

    return access_token;
  } catch {
    return null;
  }
}

/**
 * Invalide le token en cache (à appeler quand l'utilisateur se déconnecte).
 */
export async function clearUserToken() {
  await new Promise((resolve) => {
    chrome.storage.local.remove([TOKEN_CACHE_KEY, TOKEN_EXPIRY_KEY], resolve);
  });
}

// ─── generate-strategy ────────────────────────────────────────────────────────

/**
 * Génère la stratégie freelance personnalisée via l'Edge Function Supabase.
 * Utilise la clé anon — cette fonction est publique (pas de données utilisateur en DB).
 *
 * @param {Object} formData — Données du formulaire roadmap.
 * @param {string} userId   — Identifiant (ignoré côté serveur, conservé pour rétrocompat).
 * @returns {Promise<Object|null>}
 */
export async function generateFreelancerStrategy(formData, userId) {
  // ── 1. Récupérer les données des plateformes depuis le cache local ─────────
  const platformData = await new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['upworkData', 'fiverrData', 'maltData', 'userName'], (result) => {
        resolve({
          upworkData: result.upworkData || {},
          fiverrData: result.fiverrData || {},
          maltData:   result.maltData   || {},
          userName:   result.userName   || 'Freelance',
        });
      });
    } else {
      resolve({ upworkData: {}, fiverrData: {}, maltData: {}, userName: 'Freelance' });
    }
  });

  // ── 2. Fusionner les données ──────────────────────────────────────────────
  const mergedData = {
    userId,
    formData: {
      objectif:    formData.objectif    || '',
      revenuCible: formData.revenuCible || '',
      situation:   formData.situation   || '',
    },
    platforms: {
      upwork: platformData.upworkData,
      fiverr: platformData.fiverrData,
      malt:   platformData.maltData,
    },
    userName:  platformData.userName,
    locale:    'fr',
    timestamp: new Date().toISOString(),
  };

  // ── 3. Appeler generate-strategy (clé anon — pas de données utilisateur) ──
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-strategy`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(mergedData),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Voraly] Erreur generate-strategy (${response.status}) :`, errText);
      return null;
    }

    const data = await response.json();

    if (
      !data ||
      typeof data.marketingStrategy !== 'string' ||
      !Array.isArray(data.recommendedPlatforms) ||
      !Array.isArray(data.roadmap)
    ) {
      console.error('[Voraly] Réponse IA invalide :', data);
      return null;
    }

    // Mettre en cache
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise((resolve) => {
        chrome.storage.local.set({
          voralyAiData:   data,
          voralyFormData: formData,
        }, resolve);
      });
    }

    return data;
  } catch (err) {
    console.error('[Voraly] Erreur réseau generate-strategy :', err);
    return null;
  }
}

// ─── chat-refine ──────────────────────────────────────────────────────────────

/**
 * Envoie un message de chat à la Supabase Edge Function « chat-refine ».
 * Nécessite que l'utilisateur soit connecté sur voraly.me (JWT réel requis).
 *
 * @param {string} message  — Message de l'utilisateur.
 * @param {Object} context  — Données de la stratégie actuelle.
 * @returns {Promise<{reply: string, messagesRemaining: number}|null>}
 */
export async function sendChatMessage(message, context) {
  // Obtenir le JWT utilisateur (pas la clé anon)
  const userToken = await getUserJWT();

  if (!userToken) {
    console.warn('[Voraly] chat-refine : utilisateur non connecté sur voraly.me.');
    return {
      reply: 'Connectez-vous sur voraly.me pour utiliser la fonction chat.',
      messagesRemaining: 0,
    };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/chat-refine`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        // userId retiré du payload — le serveur l'extrait du JWT
        body: JSON.stringify({ message, context }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré — invalider le cache et informer l'utilisateur
        await clearUserToken();
        return { reply: 'Session expirée. Reconnectez-vous sur voraly.me.', messagesRemaining: 0 };
      }
      if (response.status === 403) {
        return { reply: 'Limite de messages atteinte.', messagesRemaining: 0 };
      }
      const errText = await response.text();
      console.error(`[Voraly] Erreur chat-refine (${response.status}) :`, errText);
      return null;
    }

    const data = await response.json();
    return {
      reply:             data.reply || '',
      messagesRemaining: typeof data.messages_remaining === 'number' ? data.messages_remaining : 0,
    };

  } catch (err) {
    console.error('[Voraly] Erreur réseau chat-refine :', err);
    return null;
  }
}

// ─── Legacy helper (kept for backwards compatibility) ─────────────────────────

/**
 * @deprecated Utiliser getUserJWT() — cet ID aléatoire n'est plus accepté par chat-refine.
 */
export async function getOrCreateUserId() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['voralyUserId'], (result) => {
        if (result.voralyUserId) {
          resolve(result.voralyUserId);
        } else {
          const newId = 'usr_' + Math.random().toString(36).substring(2, 15);
          chrome.storage.local.set({ voralyUserId: newId }, () => resolve(newId));
        }
      });
    } else {
      resolve('usr_local_dev');
    }
  });
}
