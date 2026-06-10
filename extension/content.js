// ─── Voraly Content Script ────────────────────────────────────────────────────
// Injecté automatiquement sur Fiverr et Upwork via le manifest.json.
// Extrait les KPIs financiers et le nom d'utilisateur depuis le DOM,
// puis les transmet au Service Worker via chrome.runtime.sendMessage.

console.log(
  "%c 🚀 Voraly est connecté à cette page ! %c v1.0 ",
  "background: linear-gradient(135deg, #4f46e5, #8b5cf6); color: #fff; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 6px 0 0 6px;",
  "background: #1e293b; color: #a5b4fc; font-weight: 600; font-size: 13px; padding: 4px 10px; border-radius: 0 6px 6px 0;"
);

// ─── Extraction du nom utilisateur Fiverr ─────────────────────────────────────
// On attend que React ait hydraté le DOM avant de chercher le message de
// bienvenue ("Welcome back, <nom>").

/**
 * Extrait le nom d'utilisateur depuis la page d'accueil Fiverr et l'envoie
 * au Service Worker pour persistance.
 * Cherche un élément contenant "Welcome back," dans son texte affiché.
 */
function extractFiverrData() {
  // Fiverr peut placer le message "Welcome back, ..." dans n'importe quel
  // niveau de titre ou même dans un <span>/<div> — on cherche dans tous.
  const candidates = document.querySelectorAll("h1, h2, h3, h4, span, div");

  let welcomeElement = null;

  for (const el of candidates) {
    // On utilise innerText plutôt que textContent pour ignorer les nœuds
    // cachés en CSS et obtenir le texte tel qu'affiché à l'écran.
    const text = (el.innerText || "").trim();
    if (text.startsWith("Welcome back,")) {
      welcomeElement = el;
      break;
    }
  }

  if (!welcomeElement) {
    console.warn(
      "[Voraly] Aucun élément contenant \"Welcome back,\" n'a été trouvé sur cette page."
    );
    return;
  }

  // Suppression du préfixe "Welcome back, " pour ne conserver que le nom.
  const userName = welcomeElement.innerText
    .trim()
    .replace(/^Welcome back,\s*/i, "")
    .trim();

  console.log(`[Voraly] Nom extrait : "${userName}"`);

  // ── Envoi du message au Service Worker ──
  chrome.runtime.sendMessage(
    { action: "FIVERR_DATA", userName },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Voraly] Erreur SW :", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.ok) {
        console.log("[Voraly] Donnée confirmée reçue par le Service Worker ✅");
      }
    }
  );
}

// ─── Extraction des KPIs financiers — page fiverr.com/earnings ────────────────
// Cible les trois libellés spécifiques à la page Revenus de Fiverr.
// Retourne true si au moins une valeur a été trouvée et envoyée (signal au
// polling pour déclencher clearInterval), false sinon.

/**
 * Utilitaire interne à extractFiverrKPIs.
 * Parcourt un sous-arbre DOM via un TreeWalker de nœuds texte et retourne
 * la première valeur monétaire trouvée (ex. "US$0.00", "$1,234.56", "€ 42").
 * Priorité aux chaînes contenant un symbole monétaire ou un séparateur décimal.
 *
 * @param {Element} root — Racine du sous-arbre à parcourir.
 * @returns {string|null} La valeur monétaire nettoyée, ou null si aucune.
 */
function findMonetaryValue(root) {
  if (root.tagName === "SCRIPT" || root.tagName === "STYLE") return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let best = null;
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.tagName === "SCRIPT" || node.parentElement.tagName === "STYLE") continue;

    const raw = node.textContent.trim();
    // Defensive checks
    if (!raw || raw.length > 20 || raw.includes("{")) continue;
    // Doit contenir au moins un chiffre
    if (!/\d/.test(raw)) continue;

    // Format monétaire prioritaire : contient $ € £ ou un séparateur décimal
    if (/[$€£US]/.test(raw) || /\d+[.,]\d{2}/.test(raw)) {
      const cleanVal = raw.match(/[\$€£A-Z]*\s*[\d,.]+/)?.[0] || raw;
      if (cleanVal.length <= 20 && !cleanVal.includes("{")) {
        return cleanVal.trim();
      }
    }
    // Fallback : nombre seul (sera écrasé si on trouve mieux)
    if (/^[\d\s.,]+$/.test(raw) && !best) best = raw;
  }

  if (best) {
    const cleanBest = best.match(/[\$€£A-Z]*\s*[\d,.]+/)?.[0] || best;
    if (cleanBest.length <= 20 && !cleanBest.includes("{")) {
      return cleanBest.trim();
    }
  }
  return null;
}

/**
 * Tente d'extraire les trois KPIs financiers depuis la page fiverr.com/earnings.
 * Utilise une stratégie de recherche multi-niveaux (sibling → parent → grand-parent)
 * pour chaque libellé cible.
 *
 * @returns {boolean} true si au moins un KPI a été trouvé et envoyé au SW, false sinon.
 */
function extractFiverrKPIs() {
  // ── Libellés cibles sur fiverr.com/earnings (insensible à la casse) ──
  // Chaque entrée : { regex de label, clé dans l'objet kpis }
  const KPI_TARGETS = [
    { pattern: /balance\s+available\s+for\s+use/i,   key: "balance"           },
    { pattern: /payments?\s+being\s+cleared/i,        key: "clearing"          },
    { pattern: /payments?\s+for\s+active\s+orders?/i, key: "activeOrdersValue" },
  ];

  // ── Recherche principale ──
  // On parcourt les éléments les plus susceptibles de contenir un libellé.
  const allElements = document.querySelectorAll(
    "span, div, p, td, th, label, li, h1, h2, h3, h4, h5, h6, text"
  );

  // Résultats accumulés
  const found = { balance: null, clearing: null, activeOrdersValue: null };
  let foundCount = 0;

  for (const el of allElements) {
    // Arrêt anticipé si les trois KPIs sont déjà trouvés
    if (foundCount === KPI_TARGETS.length) break;

    // On compare le texte propre de l'élément courant (innerText inclut les
    // descendants — intentionnel pour les conteneurs label + valeur fusionnés).
    const labelText = (el.innerText || "").trim();

    for (const target of KPI_TARGETS) {
      // Ignorer si ce KPI est déjà trouvé
      if (found[target.key] !== null) continue;
      // Ignorer si le label ne correspond pas
      if (!target.pattern.test(labelText)) continue;

      let value = null;

      // Stratégie 1 : sibling immédiat (élément frère suivant)
      const sibling = el.nextElementSibling;
      if (sibling) value = findMonetaryValue(sibling);

      // Stratégie 2 : premier <span> ou <text> enfant du sibling
      if (!value && sibling) {
        const innerSpan = sibling.querySelector("span, text, strong, b");
        if (innerSpan) value = findMonetaryValue(innerSpan);
      }

      // Stratégie 3 : conteneur parent
      if (!value && el.parentElement) {
        value = findMonetaryValue(el.parentElement);
      }

      // Stratégie 4 : grand-parent
      if (!value && el.parentElement?.parentElement) {
        value = findMonetaryValue(el.parentElement.parentElement);
      }

      if (value) {
        found[target.key] = value.trim();
        foundCount++;
        console.log(`[Voraly] "${target.key}" trouvé :`, found[target.key]);
      }
    }
  }

  // ── Aucune valeur détectée → signal d'échec au polling ──
  if (foundCount === 0) return false;

  // ── Enrichissement de l'objet KPI ──
  const kpis = {
    ...found,
    extractedAt: new Date().toISOString(),
    page: "earnings",
  };

  console.log("[Voraly] KPIs Fiverr (page Revenus) extraits :", kpis);

  // ── Envoi au Service Worker pour persistance chrome.storage.local ──
  chrome.runtime.sendMessage(
    { action: "SAVE_FIVERR_KPIS", payload: kpis },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Voraly] Erreur SW (KPIs) :", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.ok) {
        console.log("[Voraly] KPIs confirmés reçus par le Service Worker ✅");
      }
    }
  );

  // Signal de succès → le polling appellera clearInterval
  return true;
}

// ─── Initialisation Fiverr ────────────────────────────────────────────────────
// Regroupe toutes les logiques d'extraction propres à Fiverr.

/**
 * Point d'entrée pour le domaine fiverr.com.
 * 1. Déclenche l'extraction du nom d'utilisateur après 3 s (hydratation React).
 * 2. Lance un polling robuste toutes les 1,5 s (max 10 tentatives) pour extraire
 *    les KPIs financiers, qui se chargent de manière asynchrone.
 */
function initFiverr() {
  console.log("[Voraly] Domaine Fiverr détecté — démarrage de l'extraction.");

  // Reset du statut de synchronisation au chargement
  chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "fiverr", status: "loading" });

  // 1. Extraction du nom utilisateur — tentative unique après 3 secondes.
  setTimeout(extractFiverrData, 3000);

  // 2. Extraction des KPIs — mécanisme de polling robuste.
  //    Fiverr charge ses données financières en asynchrone via React ; un
  //    simple setTimeout fixe est insuffisant. On réessaie toutes les 1,5 s
  //    jusqu'à ce que les données soient présentes OU que le compteur max
  //    soit atteint (10 tentatives = ~15 secondes max).
  function startKPIPolling() {
    const INTERVAL_MS  = 1500;
    const MAX_ATTEMPTS = 10;
    let   attempts     = 0;

    // Signal : début de la recherche
    chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "fiverr", status: "loading" });

    const intervalId = setInterval(() => {
      attempts++;
      console.log(
        `[Voraly] Recherche des KPIs Fiverr... (tentative ${attempts}/${MAX_ATTEMPTS})`
      );

      const found = extractFiverrKPIs();

      if (found) {
        console.log("[Voraly] KPIs trouvés et envoyés ! Arrêt de la boucle.");
        clearInterval(intervalId);
        // Signal : extraction réussie
        chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "fiverr", status: "success" });
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn(
          `[Voraly] Timeout Fiverr : aucun KPI après ${MAX_ATTEMPTS} tentatives (~${
            (INTERVAL_MS * MAX_ATTEMPTS) / 1000
          }s). Page non reconnue.`
        );
        clearInterval(intervalId);
      }
    }, INTERVAL_MS);
  }

  // Démarrage du polling après un premier délai de 2 s.
  setTimeout(startKPIPolling, 2000);
}

// ─── Initialisation Upwork ────────────────────────────────────────────────────
// Extraction des KPIs depuis upwork.com/my-stats/
// Libellés ciblés : "12-month earnings" et "Job Success Score".

/**
 * Utilitaire interne à extractUpworkKPIs.
 * Cherche la première valeur significative dans un sous-arbre DOM :
 * montants ($0, $1,234), pourcentages, scores alphanumérique courts
 * ("Top Rated", "Rising Talent") ou tiret seul ("-").
 *
 * @param {Element} root — Racine du sous-arbre à parcourir.
 * @returns {string|null} La valeur trouvée ou null.
 */
function findUpworkValue(root) {
  if (root.tagName === "SCRIPT" || root.tagName === "STYLE") return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let best = null;
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.tagName === "SCRIPT" || node.parentElement.tagName === "STYLE") continue;

    const raw = node.textContent.trim();
    // Defensive checks
    if (!raw || raw.length > 20 || raw.includes("{")) continue;

    // Priorité 1 : valeur monétaire ou pourcentage
    if (/[$€£%]/.test(raw) && /\d/.test(raw)) {
      const cleanVal = raw.match(/[\$€£%A-Z]*\s*[\d,.]+/)?.[0] || raw;
      if (cleanVal.length <= 20 && !cleanVal.includes("{")) {
        return cleanVal.trim();
      }
    }
    // Priorité 2 : tiret seul (valeur non définie sur Upwork)
    if (raw === "-") return raw;
    // Priorité 3 : score alphanumérique court ("Top Rated", "Rising Talent")
    if (/\d/.test(raw) && raw.length <= 10 && !best) best = raw;
  }

  if (best) {
    const cleanBest = best.match(/[\$€£%A-Z]*\s*[\d,.]+/)?.[0] || best;
    if (cleanBest.length <= 20 && !cleanBest.includes("{")) {
      return cleanBest.trim();
    }
  }
  return best;
}

/**
 * Point d'entrée pour le domaine upwork.com.
 * Lance un polling robuste (même mécanique que Fiverr) pour extraire les KPIs
 * "12-month earnings" et "Job Success Score" depuis upwork.com/my-stats/.
 */
function initUpwork() {
  console.log("[Voraly] Domaine Upwork détecté — démarrage de l'extraction.");

  // Reset du statut de synchronisation au chargement
  chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "upwork", status: "loading" });

  // ── Libellés cibles (insensible à la casse) ──
  const UPWORK_TARGETS = [
    { pattern: /12[\s\-]*month\s+earnings?/i, key: "earnings12m" },
    { pattern: /job\s+success\s+score/i,       key: "jss"         },
  ];

  /**
   * Tente d'extraire les KPIs Upwork depuis le DOM courant.
   * Utilise la même stratégie multi-niveaux que pour Fiverr.
   *
   * @returns {boolean} true si au moins un KPI a été trouvé et envoyé, false sinon.
   */
  function extractUpworkKPIs() {
    const allElements = document.querySelectorAll(
      "span, div, p, td, th, label, li, h1, h2, h3, h4, h5, h6"
    );

    const found = { earnings12m: null, jss: null };
    let foundCount = 0;

    for (const el of allElements) {
      if (foundCount === UPWORK_TARGETS.length) break;

      const labelText = (el.innerText || "").trim();

      for (const target of UPWORK_TARGETS) {
        if (found[target.key] !== null) continue;
        if (!target.pattern.test(labelText)) continue;

        let value = null;

        // Stratégie 1 : sibling immédiat
        const sibling = el.nextElementSibling;
        if (sibling) value = findUpworkValue(sibling);

        // Stratégie 2 : premier enfant span/strong/b du sibling
        if (!value && sibling) {
          const inner = sibling.querySelector("span, strong, b, p");
          if (inner) value = findUpworkValue(inner);
        }

        // Stratégie 3 : parent
        if (!value && el.parentElement) {
          value = findUpworkValue(el.parentElement);
        }

        // Stratégie 4 : grand-parent
        if (!value && el.parentElement?.parentElement) {
          value = findUpworkValue(el.parentElement.parentElement);
        }

        if (value) {
          found[target.key] = value.trim();
          foundCount++;
          console.log(`[Voraly] Upwork "${target.key}" trouvé :`, found[target.key]);
        }
      }
    }

    if (foundCount === 0) return false;

    const kpis = {
      ...found,
      extractedAt: new Date().toISOString(),
      page: "my-stats",
    };

    console.log("[Voraly] KPIs Upwork extraits :", kpis);

    chrome.runtime.sendMessage(
      { action: "SAVE_UPWORK_KPIS", payload: kpis },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[Voraly] Erreur SW (Upwork KPIs) :", chrome.runtime.lastError.message);
          return;
        }
        if (response && response.ok) {
          console.log("[Voraly] KPIs Upwork confirmés par le Service Worker ✅");
        }
      }
    );

    return true;
  }

  // ── Polling Upwork (même mécanique que Fiverr) ──
  function startUpworkPolling() {
    const INTERVAL_MS  = 1500;
    const MAX_ATTEMPTS = 10;
    let   attempts     = 0;

    // Signal : début de la recherche
    chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "upwork", status: "loading" });

    const intervalId = setInterval(() => {
      attempts++;
      console.log(
        `[Voraly] Recherche des KPIs Upwork... (tentative ${attempts}/${MAX_ATTEMPTS})`
      );

      const found = extractUpworkKPIs();

      if (found) {
        console.log("[Voraly] KPIs Upwork trouvés et envoyés ! Arrêt de la boucle.");
        clearInterval(intervalId);
        // Signal : extraction réussie
        chrome.runtime.sendMessage({ action: "UPDATE_SYNC_STATUS", platform: "upwork", status: "success" });
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn(
          `[Voraly] Timeout Upwork : aucun KPI après ${MAX_ATTEMPTS} tentatives (~${
            (INTERVAL_MS * MAX_ATTEMPTS) / 1000
          }s). Êtes-vous sur upwork.com/my-stats/ ?`
        );
        clearInterval(intervalId);
      }
    }, INTERVAL_MS);
  }

  setTimeout(startUpworkPolling, 2000);
}

// ─── Routeur de domaine ───────────────────────────────────────────────────────
// Détermine quel script d'initialisation lancer selon le domaine courant.
// Évite d'exécuter la logique Fiverr sur Upwork (et vice-versa).

/**
 * IIFE — routeur de domaine.
 * Lit window.location.hostname et délègue à initFiverr() ou initUpwork().
 * Si le domaine n'est pas reconnu, un avertissement est émis et aucune
 * extraction n'est lancée.
 */
(function domainRouter() {
  const host = window.location.hostname;

  if (host.includes("fiverr.com")) {
    initFiverr();
  } else if (host.includes("upwork.com")) {
    initUpwork();
  } else {
    console.log("[Voraly] Domaine non reconnu — aucune extraction lancée.", host);
  }
})();
