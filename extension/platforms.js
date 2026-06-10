// ─── Voraly Platforms Script ──────────────────────────────────────────────────
// Fichier JS externe requis par la Content Security Policy de Manifest V3.
// Gère : sidebar, navigation, et le rendu des cartes de plateforme
// (Upwork / Fiverr / Malt) selon les données de chrome.storage.local.

document.addEventListener('DOMContentLoaded', () => {
  // Effet de suivi de la souris (spotlight CSS via variables custom)
  document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  });

  // ─── 1. GESTION DU MENU SIDEBAR COLLAPSE ───────────────────────────────────
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar    = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      if (sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        sidebar.classList.add('collapsed');
      } else {
        sidebar.classList.remove('collapsed');
        sidebar.classList.add('expanded');
      }
    });
  }

  // ─── 2. NAVIGATION SIDEBAR ─────────────────────────────────────────────────
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'nav-0') { window.location.href = 'dashboard.html'; return; }
      if (btn.id === 'nav-1') { /* déjà sur platforms.html — pas d'action */  return; }
      if (btn.id === 'nav-2') { window.location.href = 'roadmap.html';   return; }
      // nav-3, nav-4 : pages futures (pas d'action pour le moment)
    });
  });

  // ─── 3. TOPBAR — Bouton Paramètres ─────────────────────────────────────────
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const settingsNav = document.getElementById('nav-4');
      if (settingsNav) settingsNav.click();
    });
  }

  // ─── 4. TOPBAR — Point de notification ─────────────────────────────────────
  const notifBtn = document.getElementById('notif-btn');
  const notifDot = document.getElementById('notif-dot');
  if (notifBtn && notifDot) {
    notifBtn.addEventListener('click', () => {
      notifDot.style.display = 'none';
    });
  }

  // ─── 5. RENDU DES CARTES DE PLATEFORME ─────────────────────────────────────

  /**
   * Applique la classe connected/disconnected au badge de la topbar.
   * @param {string}  id        — ID de l'élément badge (ex. "badge-upwork").
   * @param {boolean} connected — true si la plateforme a des données disponibles.
   */
  function setBadge(id, connected) {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (connected) {
      badge.classList.remove('disconnected');
      badge.classList.add('connected');
    } else {
      badge.classList.remove('connected');
      badge.classList.add('disconnected');
    }
  }

  /**
   * Lit chrome.storage.local (ou localStorage en fallback hors extension)
   * et met à jour l'ensemble des cartes de plateforme (statut, boutons d'action,
   * badges de la topbar, et nom d'utilisateur).
   * Rappelée automatiquement après chaque suppression de données.
   */
  function renderPlatformCards() {
    const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    /**
     * Injecte dans le DOM les données de chaque carte de plateforme.
     * @param {Object} result — Contenu de chrome.storage.local.
     */
    const updateUI = (result) => {
      const upwork = result.upworkData || {};
      const fiverr = result.fiverrData || {};
      const malt   = result.maltData   || {};

      // ── Badges de la topbar ──
      setBadge('badge-upwork', result.upworkData && Object.keys(upwork).length > 0);
      setBadge('badge-fiverr', result.fiverrData && Object.keys(fiverr).length > 0);
      setBadge('badge-malt',   result.maltData   && Object.keys(malt).length  > 0);

      // Nom d'utilisateur dynamique dans la sidebar
      const userName   = result.userName || "Mahdi";
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = userName;

      // ── Carte Upwork ──
      const statusUpwork  = document.getElementById('status-upwork');
      const actionsUpwork = document.getElementById('actions-upwork');
      if (statusUpwork && actionsUpwork) {
        if (result.upworkData) {
          statusUpwork.textContent = "✅ Connectée";
          statusUpwork.className   = "platform-card-badge badge-connected";
          actionsUpwork.innerHTML  = `
            <button id="refresh-upwork" class="platform-card-btn btn-refresh">🔄 Actualiser</button>
            <button id="del-upwork" class="platform-card-btn btn-delete">🗑️ Supprimer</button>
          `;

          const btnRefresh = document.getElementById('refresh-upwork');
          const btnDel     = document.getElementById('del-upwork');
          if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
              window.open('https://www.upwork.com/nx/my-stats/', '_blank');
            });
          }
          if (btnDel) {
            btnDel.addEventListener('click', () => {
              if (isExtension) {
                chrome.storage.local.remove('upworkData', renderPlatformCards);
              } else {
                localStorage.removeItem('upworkData');
                renderPlatformCards();
              }
            });
          }
        } else {
          statusUpwork.textContent = "⚪ Non connectée";
          statusUpwork.className   = "platform-card-badge badge-disconnected";
          actionsUpwork.innerHTML  = `
            <a href="https://www.upwork.com" target="_blank" class="platform-card-btn btn-connect">🔗 Se connecter</a>
          `;
        }
      }

      // ── Carte Fiverr ──
      const statusFiverr  = document.getElementById('status-fiverr');
      const actionsFiverr = document.getElementById('actions-fiverr');
      if (statusFiverr && actionsFiverr) {
        if (result.fiverrData) {
          statusFiverr.textContent = "✅ Connectée";
          statusFiverr.className   = "platform-card-badge badge-connected";
          actionsFiverr.innerHTML  = `
            <button id="refresh-fiverr" class="platform-card-btn btn-refresh">🔄 Actualiser</button>
            <button id="del-fiverr" class="platform-card-btn btn-delete">🗑️ Supprimer</button>
          `;

          const btnRefresh = document.getElementById('refresh-fiverr');
          const btnDel     = document.getElementById('del-fiverr');
          if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
              window.open('https://www.fiverr.com/earnings', '_blank');
            });
          }
          if (btnDel) {
            btnDel.addEventListener('click', () => {
              if (isExtension) {
                chrome.storage.local.remove('fiverrData', renderPlatformCards);
              } else {
                localStorage.removeItem('fiverrData');
                renderPlatformCards();
              }
            });
          }
        } else {
          statusFiverr.textContent = "⚪ Non connectée";
          statusFiverr.className   = "platform-card-badge badge-disconnected";
          actionsFiverr.innerHTML  = `
            <a href="https://www.fiverr.com" target="_blank" class="platform-card-btn btn-connect">🔗 Se connecter</a>
          `;
        }
      }

      // ── Carte Malt (extraction non encore implémentée) ──
      const statusMalt  = document.getElementById('status-malt');
      const actionsMalt = document.getElementById('actions-malt');
      if (statusMalt && actionsMalt) {
        statusMalt.textContent = "⚪ Non connectée";
        statusMalt.className   = "platform-card-badge badge-disconnected";
        actionsMalt.innerHTML  = `
          <a href="https://www.malt.com" target="_blank" class="platform-card-btn btn-connect">🔗 Se connecter</a>
        `;
      }
    };

    if (isExtension) {
      chrome.storage.local.get(null, updateUI);
    } else {
      // Fallback localStorage pour prévisualisation hors extension (navigateur direct)
      const mockResult = {
        userName:   localStorage.getItem('userName') || "Jean Dupont",
        upworkData: localStorage.getItem('upworkData') ? JSON.parse(localStorage.getItem('upworkData')) : null,
        fiverrData: localStorage.getItem('fiverrData') ? JSON.parse(localStorage.getItem('fiverrData')) : null,
      };
      // Si aucune donnée en localStorage, on simule Upwork comme connecté pour la démo
      if (!mockResult.upworkData && !mockResult.fiverrData) {
        mockResult.upworkData = { mock: true };
      }
      updateUI(mockResult);
    }
  }

  // Appel initial
  renderPlatformCards();
});
