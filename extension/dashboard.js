// ─── Voraly Dashboard Script ──────────────────────────────────────────────────
// Fichier JS externe requis par la Content Security Policy de Manifest V3.
// Gère : sidebar, navigation, graphique SVG, To-Do IA, et le binding des
// données depuis chrome.storage.local.

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

  // ─── 2. GESTION DES CLICS SUR LES ONGLETS DE LA SIDEBAR ───────────────────
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'nav-0') {
        // Déjà sur dashboard.html — pas d'action
        return;
      }
      if (btn.id === 'nav-1') {
        window.location.href = 'platforms.html';
        return;
      }
      if (btn.id === 'nav-2') {
        window.location.href = 'roadmap.html';
        return;
      }
      navItems.forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      const textLabel = btn.querySelector('.nav-label').textContent;
      if (pageTitle) pageTitle.textContent = textLabel;
    });
  });

  // ─── 3. CLIC BOUTON RÉGLAGES DANS LA TOPBAR ────────────────────────────────
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const settingsNav = document.getElementById('nav-4');
      if (settingsNav) settingsNav.click();
    });
  }

  // ─── 4. GESTION DU POINT DE NOTIFICATION ──────────────────────────────────
  const notifBtn = document.getElementById('notif-btn');
  const notifDot = document.getElementById('notif-dot');
  if (notifBtn && notifDot) {
    notifBtn.addEventListener('click', () => {
      notifDot.style.display = 'none';
    });
  }

  // ─── 5. GESTION DE LA TO-DO LIST IA ────────────────────────────────────────
  // Liste de tâches statique — utilisée comme fallback si voralyAiData est absent.
  let aiTasks = [
    { id: 1, done: false, priority: 'high', text: "S'inscrire sur Toptal — Match à 90% avec ton profil", badge: '🤖 IA', badgeClass: 'badge-violet' },
    { id: 2, done: false, priority: 'high', text: "Augmenter le package Premium Fiverr de 15% (sous-évalué vs marché)", badge: '💰 Rev.', badgeClass: 'badge-green' },
    { id: 3, done: true,  priority: 'med',  text: "Mettre à jour le portfolio Behance avec les 2 derniers projets", badge: '📁 Profil', badgeClass: 'badge-blue' },
    { id: 4, done: false, priority: 'med',  text: "Ajouter une vidéo de présentation sur ton profil Upwork (+35% vues)", badge: '🎥 Médias', badgeClass: 'badge-orange' },
    { id: 5, done: false, priority: 'low',  text: "Répondre aux 3 invitations de projet en attente sur Malt", badge: '📬 Malt', badgeClass: 'badge-pink' },
  ];

  /**
   * Recalcule la progression (tâches complétées / total) et met à jour la barre
   * de progression IA ainsi que le compteur textuel.
   */
  function updateTasksProgress() {
    const doneCount  = aiTasks.filter(t => t.done).length;
    const totalCount = aiTasks.length;
    const pct        = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

    const progressBar  = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    if (progressBar)  progressBar.style.width    = `${pct}%`;
    if (progressText) progressText.textContent   = `${doneCount}/${totalCount}`;
  }

  /**
   * Persiste l'état done/undone des tâches dans chrome.storage.local.
   * La clé « voralyTaskStates » est un objet { [taskId]: boolean }.
   */
  function persistTaskStates() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    const states = {};
    aiTasks.forEach(t => { states[t.id] = t.done; });
    chrome.storage.local.set({ voralyTaskStates: states });
  }

  /**
   * Génère et injecte la liste des tâches IA dans le DOM (#task-list).
   * Chaque ligne est interactive : un clic bascule l'état done/undone,
   * persiste l'état, et déclenche un re-render.
   */
  function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    taskList.innerHTML = '';

    aiTasks.forEach((task) => {
      const hr = document.createElement('hr');
      hr.className = 'task-divider';
      taskList.appendChild(hr);

      const row = document.createElement('div');
      row.className = `task-row ${task.done ? 'done' : ''}`;

      const dotClass  = { high: 'dot-high', med: 'dot-med', low: 'dot-low' }[task.priority] || 'dot-med';
      const prioLabel = { high: 'haute', med: 'moyenne', low: 'basse' }[task.priority] || 'normale';

      row.innerHTML = `
        <input type="checkbox" class="task-check" id="task-check-${task.id}" ${task.done ? 'checked' : ''} />
        <div class="task-content">
          <div class="task-text">${task.text}</div>
          <div class="task-meta">
            <span class="task-badge ${task.badgeClass}">${task.badge}</span>
            <span class="task-dot ${dotClass}"></span>
            <span class="task-prio">priorité ${prioLabel}</span>
          </div>
        </div>
      `;

      // Clic sur toute la ligne pour basculer l'état done
      row.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          task.done = !task.done;
        } else {
          task.done = e.target.checked;
        }
        persistTaskStates();
        updateTasksProgress();
        renderTasks();
      });

      taskList.appendChild(row);
    });

    updateTasksProgress();
  }

  /**
   * Charge les tâches depuis voralyAiData (Day 1 ou jour actif) si disponible,
   * sinon reste sur la liste statique. Réapplique les états de complétion sauvegardés.
   *
   * @param {Object|null} voralyAiData — Données IA mises en cache (peut être null).
   * @param {Object}      taskStates   — États sauvegardés { [taskId]: boolean }.
   */
  function loadAiTasks(voralyAiData, taskStates) {
    if (
      voralyAiData &&
      Array.isArray(voralyAiData.roadmap) &&
      voralyAiData.roadmap.length > 0
    ) {
      // Trouver la semaine 1 (ou la première semaine disponible)
      const activeWeek = voralyAiData.roadmap.find(w => w.week === 1) || voralyAiData.roadmap[0];

      if (activeWeek && Array.isArray(activeWeek.details) && activeWeek.details.length > 0) {
        // Convertir les tâches IA en format interne
        aiTasks = activeWeek.details.map((taskText, idx) => {
          const taskId = `ai-week${activeWeek.week}-${idx}`;
          const savedDone = taskStates && taskStates[taskId] !== undefined
            ? taskStates[taskId]
            : false;
          return {
            id:        taskId,
            done:      savedDone,
            priority:  idx === 0 ? 'high' : idx === 1 ? 'high' : 'med',
            text:      taskText,
            badge:     '🤖 IA',
            badgeClass: 'badge-violet',
          };
        });

        // Mettre à jour le sous-titre du widget
        const aiSub = document.querySelector('.ai-sub');
        if (aiSub) {
          aiSub.textContent = `Générée par Voraly IA · Semaine ${activeWeek.week} de votre roadmap`;
        }
      }
    } else if (taskStates) {
      // Réappliquer les états sauvegardés sur la liste statique
      aiTasks = aiTasks.map(t => ({
        ...t,
        done: taskStates[t.id] !== undefined ? taskStates[t.id] : t.done,
      }));
    }

    renderTasks();
  }

  // Initialisation : lire voralyAiData ET voralyTaskStates depuis le stockage local
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['voralyAiData', 'voralyTaskStates'], (result) => {
      loadAiTasks(result.voralyAiData || null, result.voralyTaskStates || {});
    });
  } else {
    // Hors contexte Chrome (dev) — utiliser la liste statique
    renderTasks();
  }

  // ── Bouton Régénérer IA — micro-animation premium et recalcul des tâches ──
  const regenBtn = document.getElementById('regen-btn');
  if (regenBtn) {
    regenBtn.addEventListener('click', () => {
      // État de chargement
      regenBtn.textContent = "⏳ Analyse stratégique en cours...";
      regenBtn.disabled    = true;
      regenBtn.style.background = '#eef2ff';

      const taskList = document.getElementById('task-list');
      if (taskList) taskList.innerHTML = '';

      // Simulation de latence IA (2 000 ms)
      setTimeout(() => {
        const kpiEarnings = document.getElementById('kpi-earnings');
        const earningsText = kpiEarnings ? kpiEarnings.textContent : "";

        // Tâches alternatives pour les comptes sans revenus actifs
        if (earningsText.includes("0")) {
          aiTasks = [
            { id: 1, done: false, priority: 'high', text: "Optimiser les mots-clés du profil Fiverr (niche: développement / tech)", badge: '🤖 IA', badgeClass: 'badge-violet' },
            { id: 2, done: false, priority: 'high', text: "Envoyer 3 propositions très ciblées sur Upwork", badge: '🚀 Action', badgeClass: 'badge-blue' },
            { id: 3, done: false, priority: 'med',  text: "Créer une vidéo de présentation d'offre (format faceless)", badge: '🎥 Médias', badgeClass: 'badge-orange' },
            { id: 4, done: false, priority: 'med',  text: "Mettre à jour le portfolio avec les projets de développement récents", badge: '📁 Profil', badgeClass: 'badge-green' },
          ];
        } else {
          // Tâches avec états aléatoires pour les comptes actifs
          aiTasks = [
            { id: 1, done: Math.random() > 0.7, priority: 'high', text: "S'inscrire sur Toptal — Match à 90% avec ton profil", badge: '🤖 IA', badgeClass: 'badge-violet' },
            { id: 2, done: Math.random() > 0.7, priority: 'high', text: "Augmenter le package Premium Fiverr de 15% (sous-évalué vs marché)", badge: '💰 Rev.', badgeClass: 'badge-green' },
            { id: 3, done: true,                 priority: 'med',  text: "Mettre à jour le portfolio Behance avec les 2 derniers projets", badge: '📁 Profil', badgeClass: 'badge-blue' },
            { id: 4, done: Math.random() > 0.7, priority: 'med',  text: "Ajouter une vidéo de présentation sur ton profil Upwork (+35% vues)", badge: '🎥 Médias', badgeClass: 'badge-orange' },
            { id: 5, done: Math.random() > 0.7, priority: 'low',  text: "Répondre aux 3 invitations de projet en attente sur Malt", badge: '📬 Malt', badgeClass: 'badge-pink' },
          ];
        }

        renderTasks();
        regenBtn.textContent      = '✨ Régénérer les recommandations IA';
        regenBtn.disabled         = false;
        regenBtn.style.background = 'none';
      }, 2000);
    });
  }

  // ─── 6. GRAPHIQUE SVG NATIF & TOOLTIP INTERACTIF ──────────────────────────
  const revenueData = [
    { month: 'Jan',  Upwork: 1200, Fiverr: 800  },
    { month: 'Fév',  Upwork: 1400, Fiverr: 950  },
    { month: 'Mar',  Upwork: 1100, Fiverr: 1200 },
    { month: 'Avr',  Upwork: 1800, Fiverr: 1100 },
    { month: 'Mai',  Upwork: 2070, Fiverr: 1380 },
    { month: 'Juin', Upwork: 2400, Fiverr: 1650 },
  ];

  let currentDataPoints = [];
  const svg          = document.getElementById('revenue-chart');
  const tooltip      = document.getElementById('chart-tooltip');
  const verticalLine = document.getElementById('chart-vertical-line');
  const dotUpwork    = document.getElementById('chart-dot-upwork');
  const dotFiverr    = document.getElementById('chart-dot-fiverr');

  /**
   * Dessine le graphique SVG de revenus avec des courbes de zone remplies
   * (Area Chart) pour Upwork et Fiverr, et génère les labels de l'axe X.
   *
   * @param {Array<{month: string, Upwork: number, Fiverr: number}>} data — Points de données.
   */
  function drawChart(data) {
    const pathGroup = document.getElementById('chart-paths');
    if (!pathGroup) return;
    pathGroup.innerHTML = '';

    const width  = 440; // 480 - 40 (marges)
    const height = 160; // 180 - 20 (marges)
    const minX   = 40;
    const minY   = 20;
    const maxY   = 180;
    const maxVal = 3000;

    const spacing = width / (data.length - 1);

    // Calcul des coordonnées SVG pour chaque point de données
    const points = data.map((d, i) => {
      const x       = minX + i * spacing;
      const yUpwork = maxY - (d.Upwork / maxVal) * height;
      const yFiverr = maxY - (d.Fiverr / maxVal) * height;
      return { month: d.month, Upwork: d.Upwork, Fiverr: d.Fiverr, x, yUpwork, yFiverr };
    });

    currentDataPoints = points;

    let upworkLineD = "";
    let upworkAreaD = "";
    let fiverrLineD = "";
    let fiverrAreaD = "";

    points.forEach((p, i) => {
      if (i === 0) {
        upworkLineD = `M ${p.x} ${p.yUpwork}`;
        upworkAreaD = `M ${p.x} ${p.yUpwork}`;
        fiverrLineD = `M ${p.x} ${p.yFiverr}`;
        fiverrAreaD = `M ${p.x} ${p.yFiverr}`;
      } else {
        upworkLineD += ` L ${p.x} ${p.yUpwork}`;
        upworkAreaD += ` L ${p.x} ${p.yUpwork}`;
        fiverrLineD += ` L ${p.x} ${p.yFiverr}`;
        fiverrAreaD += ` L ${p.x} ${p.yFiverr}`;
      }
    });

    const firstX = points[0].x;
    const lastX  = points[points.length - 1].x;

    upworkAreaD += ` L ${lastX} ${maxY} L ${firstX} ${maxY} Z`;
    fiverrAreaD += ` L ${lastX} ${maxY} L ${firstX} ${maxY} Z`;

    // Surfaces remplies (Area)
    const upworkAreaEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    upworkAreaEl.setAttribute("d", upworkAreaD);
    upworkAreaEl.setAttribute("fill", "url(#gUpwork)");
    pathGroup.appendChild(upworkAreaEl);

    const fiverrAreaEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fiverrAreaEl.setAttribute("d", fiverrAreaD);
    fiverrAreaEl.setAttribute("fill", "url(#gFiverr)");
    pathGroup.appendChild(fiverrAreaEl);

    // Lignes de contour (Line)
    const upworkLineEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    upworkLineEl.setAttribute("d", upworkLineD);
    upworkLineEl.setAttribute("fill", "none");
    upworkLineEl.setAttribute("stroke", "#4f46e5");
    upworkLineEl.setAttribute("stroke-width", "2.5");
    pathGroup.appendChild(upworkLineEl);

    const fiverrLineEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fiverrLineEl.setAttribute("d", fiverrLineD);
    fiverrLineEl.setAttribute("fill", "none");
    fiverrLineEl.setAttribute("stroke", "#8b5cf6");
    fiverrLineEl.setAttribute("stroke-width", "2.5");
    pathGroup.appendChild(fiverrLineEl);

    // Labels dynamiques de l'axe X
    const xAxisGroup = document.getElementById('chart-x-axis');
    if (xAxisGroup) {
      xAxisGroup.innerHTML = '';
      points.forEach((p) => {
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", p.x);
        txt.setAttribute("y", "196");
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("font-size", "11");
        txt.setAttribute("fill", "#94a3b8");
        txt.setAttribute("font-family", "Inter, sans-serif");
        txt.textContent = p.month;
        xAxisGroup.appendChild(txt);
      });
    }
  }

  // Rendu initial du graphique sur 6 mois
  drawChart(revenueData);

  // ── Tooltip interactif — survol du graphique SVG ──
  if (svg) {
    svg.addEventListener('mousemove', (e) => {
      if (!currentDataPoints || currentDataPoints.length === 0) return;

      const rect   = svg.getBoundingClientRect();
      // Traduction de la coordonnée X client en viewBox SVG (0 → 500)
      const mouseX = ((e.clientX - rect.left) / rect.width) * 500;

      // Recherche du point de données le plus proche sur l'axe X
      let closest = currentDataPoints[0];
      let minDist = Math.abs(mouseX - closest.x);
      for (let i = 1; i < currentDataPoints.length; i++) {
        const dist = Math.abs(mouseX - currentDataPoints[i].x);
        if (dist < minDist) {
          minDist  = dist;
          closest  = currentDataPoints[i];
        }
      }

      // Positionnement de la ligne verticale et des points de focus
      if (verticalLine) {
        verticalLine.setAttribute('x1', closest.x);
        verticalLine.setAttribute('x2', closest.x);
        verticalLine.setAttribute('style', 'display: block;');
      }
      if (dotUpwork) {
        dotUpwork.setAttribute('cx', closest.x);
        dotUpwork.setAttribute('cy', closest.yUpwork);
        dotUpwork.setAttribute('style', 'display: block;');
      }
      if (dotFiverr) {
        dotFiverr.setAttribute('cx', closest.x);
        dotFiverr.setAttribute('cy', closest.yFiverr);
        dotFiverr.setAttribute('style', 'display: block;');
      }

      // Rendu et positionnement du tooltip avec anti-dépassement à droite
      if (tooltip) {
        const tooltipWidth = 150;
        let tooltipX = (closest.x / 500) * rect.width + 10;
        if (tooltipX + tooltipWidth > rect.width) {
          tooltipX = (closest.x / 500) * rect.width - tooltipWidth - 10;
        }

        const tooltipY = (closest.yUpwork / 200) * rect.height - 20;

        tooltip.style.left    = `${tooltipX}px`;
        tooltip.style.top     = `${tooltipY}px`;
        tooltip.style.display = 'block';

        tooltip.innerHTML = `
          <p style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px;">${closest.month} 2026</p>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; display: inline-block;"></span>
            <span style="color: #64748b">Upwork :</span>
            <span style="font-weight: 700; color: #1e293b">${closest.Upwork.toLocaleString('fr-FR')} €</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; display: inline-block;"></span>
            <span style="color: #64748b">Fiverr :</span>
            <span style="font-weight: 700; color: #1e293b">${closest.Fiverr.toLocaleString('fr-FR')} €</span>
          </div>
        `;
      }
    });

    svg.addEventListener('mouseleave', () => {
      if (tooltip)      tooltip.style.display = 'none';
      if (verticalLine) verticalLine.setAttribute('style', 'display: none;');
      if (dotUpwork)    dotUpwork.setAttribute('style', 'display: none;');
      if (dotFiverr)    dotFiverr.setAttribute('style', 'display: none;');
    });
  }

  // ── Boutons de période (6M / 3M / 1M) ──
  const periodBtns = document.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const period = btn.dataset.period;
      if (period === '6M') {
        drawChart(revenueData);
      } else if (period === '3M') {
        drawChart(revenueData.slice(-3));
      } else if (period === '1M') {
        drawChart(revenueData.slice(-2)); // 2 points min pour dessiner une ligne
      }
    });
  });

  // ─── 7. BINDING DES DONNÉES CHROME STORAGE ─────────────────────────────────
  // Lit l'ensemble du stockage local pour mettre à jour les badges de plateforme,
  // le nom d'utilisateur, et les KPIs financiers en temps réel.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(null, (result) => {
      const fiverr = result.fiverrData || {};
      const upwork = result.upworkData || {};
      const malt   = result.maltData   || {};

      let liveBalance = fiverr.balance || upwork.earnings12m || "0,00 €";
      let liveOrders  = fiverr.activeOrdersValue || "0";

      // Contre-mesures défensives contre des valeurs corrompues
      if (liveBalance.length > 20 || liveBalance.includes("{")) {
        liveBalance = "US$ 0.00";
      }
      if (liveOrders.length > 20 || liveOrders.includes("{")) {
        liveOrders = "0";
      }

      /**
       * Applique la classe connected/disconnected au badge de la plateforme donnée.
       * @param {string}  id        — ID du badge (ex. "badge-upwork").
       * @param {boolean} connected — true si la plateforme a des données.
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

      setBadge('badge-upwork', result.upworkData && Object.keys(upwork).length > 0);
      setBadge('badge-fiverr', result.fiverrData && Object.keys(fiverr).length > 0);
      setBadge('badge-malt',   result.maltData   && Object.keys(malt).length  > 0);

      // Nom d'utilisateur dynamique (sidebar + hero label)
      const userName    = result.userName || "Mahdi";
      const heroLabel   = document.querySelector('.hero-label');
      const userNameEl  = document.querySelector('.user-name');
      if (heroLabel)  heroLabel.textContent  = `👋 Bonjour ${userName}`;
      if (userNameEl) userNameEl.textContent = userName;

      // ── État zéro : aucune donnée synchronisée ──
      const isZeroState = !liveBalance
        || liveBalance === "0"
        || liveBalance === "0,00 €"
        || liveBalance === "US$ 0.00"
        || liveBalance === "US$0.00"
        || liveBalance === "0.00"
        || liveBalance.trim() === "0 €";

      if (isZeroState) {
        // Remise à zéro des Quick Stats
        const statVals = document.querySelectorAll('.quick-stat-val');
        if (statVals.length >= 3) {
          statVals[0].textContent = "0 €";
          statVals[1].textContent = "0";
          statVals[2].textContent = "0";
        }

        // Taux de conversion
        const kpiConv = document.getElementById('kpi-conv');
        if (kpiConv) kpiConv.textContent = "0%";

        // Tendances
        const trends = document.querySelectorAll('.kpi-trend');
        trends.forEach(trend => {
          trend.textContent = "-";
          trend.className   = "kpi-trend";
        });

        // Barres de progression KPI
        document.querySelectorAll('.kpi-bar-fill').forEach(fill => { fill.style.width   = '0%'; });
        document.querySelectorAll('.kpi-bar-pct').forEach(pct   => { pct.textContent    = '0%'; });

        // Graphique à plat
        revenueData.forEach(item => { item.Upwork = 0; item.Fiverr = 0; });
        drawChart(revenueData);
      }

      // ── Injection des valeurs live dans les KPI cards ──
      const kpiEarnings    = document.getElementById('kpi-earnings');
      const kpiEarningsSub = document.getElementById('kpi-earnings-sub');
      if (kpiEarnings && liveBalance) {
        kpiEarnings.textContent = liveBalance;
        if (kpiEarningsSub) {
          kpiEarningsSub.innerHTML = 'Données temps réel <span style="color: #10b981; font-weight: 700;">✔</span>';
        }
      }

      const kpiOrders    = document.getElementById('kpi-orders');
      const kpiOrdersSub = document.getElementById('kpi-orders-sub');
      if (kpiOrders && liveOrders) {
        kpiOrders.textContent = liveOrders;
        if (kpiOrdersSub) {
          kpiOrdersSub.innerHTML = 'Données temps réel <span style="color: #10b981; font-weight: 700;">✔</span>';
        }
      }
    });
  }

});
