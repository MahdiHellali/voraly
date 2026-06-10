// ─── Voraly Popup Script ──────────────────────────────────────────────────────
// Fichier JS externe requis par la Content Security Policy de Manifest V3.
// Affiche l'état de connexion en temps réel pour chaque plateforme surveillée.

/**
 * Met à jour les chips de statut des plateformes (Upwork / Fiverr) dans le popup.
 * Applique les classes CSS appropriées selon l'URL active et le statut de
 * synchronisation persisté dans chrome.storage.local.
 *
 * @param {string} activeUrl  — URL de l'onglet actif.
 * @param {Object} syncStatus — Objet { upwork: "loading"|"success", fiverr: ... }.
 */
function renderBadges(activeUrl, syncStatus) {
  const chipUpwork = document.getElementById("chip-upwork");
  const chipFiverr = document.getElementById("chip-fiverr");
  if (!chipUpwork || !chipFiverr) return;

  // Réinitialisation des classes d'état
  chipUpwork.classList.remove("disconnected", "loading", "connected");
  chipFiverr.classList.remove("disconnected", "loading", "connected");

  // 1. Logique Upwork
  const isUpwork = activeUrl.includes("upwork.com");
  if (!isUpwork) {
    chipUpwork.classList.add("disconnected");
    chipUpwork.textContent = "Upwork";
  } else {
    const status = syncStatus.upwork || "loading";
    if (status === "success") {
      chipUpwork.classList.add("connected");
      chipUpwork.textContent = "✅ Upwork";
    } else {
      chipUpwork.classList.add("loading");
      chipUpwork.textContent = "⏳ Upwork";
    }
  }

  // 2. Logique Fiverr
  const isFiverr = activeUrl.includes("fiverr.com");
  if (!isFiverr) {
    chipFiverr.classList.add("disconnected");
    chipFiverr.textContent = "Fiverr";
  } else {
    const status = syncStatus.fiverr || "loading";
    if (status === "success") {
      chipFiverr.classList.add("connected");
      chipFiverr.textContent = "✅ Fiverr";
    } else {
      chipFiverr.classList.add("loading");
      chipFiverr.textContent = "⏳ Fiverr";
    }
  }
}

// ── Initialisation : récupération de l'onglet actif et du statut persistant ──
// Applique le thème "connected-mode" et la bannière si l'onglet courant est
// une plateforme reconnue, puis lit syncStatus depuis chrome.storage.local.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeUrl = (tabs && tabs[0] && tabs[0].url) || "";

  // Thème connecté & Bannière
  const isFiverr = activeUrl.includes("fiverr.com");
  const isUpwork = activeUrl.includes("upwork.com");
  if (isFiverr || isUpwork) {
    document.body.classList.add("connected-mode");
    const platform   = isFiverr ? "Fiverr" : "Upwork";
    const bannerText = document.getElementById("banner-text");
    if (bannerText) {
      bannerText.textContent = `${platform} détecté — synchronisation active`;
    }
  } else {
    document.body.classList.remove("connected-mode");
  }

  // Lecture du statut de synchronisation puis rendu des badges
  chrome.storage.local.get(["syncStatus"], (result) => {
    const syncStatus = result.syncStatus || {};
    renderBadges(activeUrl, syncStatus);
  });
});

// ── Réactivité : écoute des modifications de syncStatus en temps réel ──
// Permet de mettre à jour les chips sans fermer/rouvrir le popup.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.syncStatus) return;

  const newSyncStatus = changes.syncStatus.newValue || {};
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeUrl = (tabs && tabs[0] && tabs[0].url) || "";
    renderBadges(activeUrl, newSyncStatus);
  });
});
