// ─── Voraly Background Service Worker ────────────────────────────────────────
// Persiste les données extraites par le Content Script dans chrome.storage.local
// et maintient le statut de synchronisation de chaque plateforme.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Voraly Background Service Worker initialisé.");
});

// ─── Écoute des messages envoyés par le Content Script ───────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Cas 1 : réception du nom d'utilisateur Fiverr ──
  if (message.action === "FIVERR_DATA") {
    console.log(
      `✅ [Voraly] Donnée interceptée en arrière-plan : Utilisateur = ${message.userName}`
    );

    // Accusé de réception explicite — évite chrome.runtime.lastError côté
    // content.js et referme proprement le canal de messagerie.
    sendResponse({ ok: true });
  }

  // ── Cas 2 : réception des KPIs financiers Fiverr ──
  else if (message.action === "SAVE_FIVERR_KPIS") {
    chrome.storage.local.set({ fiverrData: message.payload }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "[Voraly] Erreur lors de la sauvegarde des KPIs Fiverr :",
          chrome.runtime.lastError.message
        );
      } else {
        console.log(
          "[Voraly] Fiverr KPIs successfully saved to local storage.",
          message.payload
        );
      }
    });

    sendResponse({ ok: true });
  }

  // ── Cas 3 : réception des KPIs financiers Upwork ──
  else if (message.action === "SAVE_UPWORK_KPIS") {
    chrome.storage.local.set({ upworkData: message.payload }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "[Voraly] Erreur lors de la sauvegarde des KPIs Upwork :",
          chrome.runtime.lastError.message
        );
      } else {
        console.log(
          "[Voraly] Upwork KPIs successfully saved to local storage.",
          message.payload
        );
      }
    });

    sendResponse({ ok: true });
  }

  // ── Cas 4 : mise à jour du statut de synchronisation d'une plateforme ──
  // Attendu : { action: "UPDATE_SYNC_STATUS", platform: "fiverr"|"upwork", status: "loading"|"success" }
  // Le statut est mergé dans un objet syncStatus existant pour ne pas écraser
  // l'état de l'autre plateforme.
  else if (message.action === "UPDATE_SYNC_STATUS") {
    const { platform, status } = message;

    // Lecture de l'état actuel, puis fusion avec le nouveau statut.
    chrome.storage.local.get(["syncStatus"], (result) => {
      const current = result.syncStatus || {};
      const updated = { ...current, [platform]: status };

      chrome.storage.local.set({ syncStatus: updated }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "[Voraly] Erreur lors de la mise à jour de syncStatus :",
            chrome.runtime.lastError.message
          );
        } else {
          console.log(`[Voraly] syncStatus mis à jour — ${platform}: ${status}`);
        }
      });
    });

    sendResponse({ ok: true });
  }

  // Retourner true garde le canal ouvert le temps que sendResponse soit appelé
  // (nécessaire si l'une des branches est asynchrone).
  return true;
});
