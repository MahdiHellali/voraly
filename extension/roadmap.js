// ─── Voraly Roadmap Script ────────────────────────────────────────────────────
// Fichier JS externe requis par la Content Security Policy de Manifest V3.
// Gère : sidebar, navigation, badges de plateforme, la bibliothèque de roadmaps,
// et la soumission du formulaire de génération de stratégie IA via Supabase.

import { generateFreelancerStrategy, sendChatMessage } from './aiService.js';

document.addEventListener('DOMContentLoaded', () => {
  // ─── Reset de la stratégie au chargement (pas d'hydratation automatique) ───
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove(['voralyAiData', 'voralyFormData']);
  }

  // Effet de suivi de la souris (spotlight CSS via variables custom)
  document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  });

  // ─── 1. GESTION DU MENU SIDEBAR COLLAPSE ─────────────────────────────────
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

  // ─── 2. NAVIGATION SIDEBAR ────────────────────────────────────────────────
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'nav-0') { window.location.href = 'dashboard.html'; return; }
      if (btn.id === 'nav-1') { window.location.href = 'platforms.html'; return; }
      if (btn.id === 'nav-2') { /* déjà sur roadmap.html — pas d'action */ return; }
      // nav-3, nav-4 : pages futures (pas d'action pour le moment)
    });
  });

  // ─── 3. TOPBAR — Bouton Paramètres ───────────────────────────────────────
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const settingsNav = document.getElementById('nav-4');
      if (settingsNav) settingsNav.click();
    });
  }

  // ─── 4. TOPBAR — Point de notification ────────────────────────────────────
  const notifBtn = document.getElementById('notif-btn');
  const notifDot = document.getElementById('notif-dot');
  if (notifBtn && notifDot) {
    notifBtn.addEventListener('click', () => { notifDot.style.display = 'none'; });
  }

  // ─── 5. CHROME STORAGE — Badges & Nom d'utilisateur ──────────────────────

  /**
   * Applique la classe connected/disconnected au badge de la topbar.
   * @param {string}  id        — ID de l'élément badge (ex. "badge-upwork").
   * @param {boolean} connected — true si la plateforme a des données disponibles.
   */
  function setBadge(id, connected) {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.classList.toggle('connected',    connected);
    badge.classList.toggle('disconnected', !connected);
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(null, (result) => {
      // Badges des plateformes dans la topbar
      const upwork = result.upworkData || {};
      const fiverr = result.fiverrData || {};
      const malt   = result.maltData   || {};
      setBadge('badge-upwork', result.upworkData && Object.keys(upwork).length > 0);
      setBadge('badge-fiverr', result.fiverrData && Object.keys(fiverr).length > 0);
      setBadge('badge-malt',   result.maltData   && Object.keys(malt).length  > 0);

      // Nom d'utilisateur dynamique dans la sidebar
      const userName   = result.userName || 'Mahdi';
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = userName;
    });
  }

  // ─── 6. BIBLIOTHÈQUE DE ROADMAPS (fallback statique) ─────────────────────
  // Utilisée uniquement si l'Edge Function est indisponible.
  const roadmapLibrary = {
    'trouver-clients': [
      {
        dot: 'violet', week: 'Semaine 1–2', icon: '🔍',
        title: 'Audit & Positionnement de niche',
        body: 'Analysez vos 3 dernières missions et identifiez la niche où vous générez le plus de valeur. Optimisez votre titre de profil avec des mots-clés à fort volume sur Upwork et Malt.',
        tags: [{ label: 'Profil', cls: 't-violet' }, { label: 'Mots-clés', cls: 't-indigo' }]
      },
      {
        dot: 'indigo', week: 'Semaine 3–4', icon: '📝',
        title: "Création d'une offre d'entrée irrésistible",
        body: "Lancez une offre de démarrage à tarif attractif (ex. audit de 2h ou prototype rapide) pour décrocher des premières évaluations 5 étoiles et booster l'algorithme de recommandation.",
        tags: [{ label: 'Offre', cls: 't-orange' }, { label: 'Conversion', cls: 't-green' }]
      },
      {
        dot: 'emerald', week: 'Mois 2', icon: '🤝',
        title: 'Prospection active & réseautage ciblé',
        body: 'Envoyez 5 propositions ultra-personnalisées par semaine. Rejoignez 2 communautés Slack ou Discord de votre secteur. Demandez des recommandations à vos anciens clients.',
        tags: [{ label: 'Prospection', cls: 't-green' }, { label: 'Réseau', cls: 't-indigo' }]
      },
      {
        dot: 'orange', week: 'Mois 3', icon: '📊',
        title: 'Analyse des résultats & Scaling',
        body: 'Mesurez votre taux de réponse et de conversion. Doublez la mise sur les canaux les plus performants et éliminez les moins rentables. Objectif : 3+ nouveaux clients récurrents.',
        tags: [{ label: 'Analytics', cls: 't-orange' }, { label: 'Growth', cls: 't-violet' }]
      },
      {
        dot: 'pink', week: 'Mois 4–6', icon: '🚀',
        title: 'Programme de recommandation & Partenariats',
        body: "Mettez en place un système de parrainage client (ex. 10% de réduction sur la prochaine mission). Nouez des partenariats avec des agences pour des flux de leads réguliers.",
        tags: [{ label: 'Rétention', cls: 't-indigo' }, { label: 'Partenariats', cls: 't-green' }]
      }
    ],

    'augmenter-prix': [
      {
        dot: 'violet', week: 'Semaine 1–2', icon: '💎',
        title: 'Audit de valeur & Repositionnement premium',
        body: 'Comparez vos tarifs aux 10 meilleurs freelances de votre niche sur Upwork et Malt. Identifiez les livrables ou garanties que vous pouvez ajouter pour justifier une hausse de 20–40%.',
        tags: [{ label: 'Pricing', cls: 't-violet' }, { label: 'Benchmarking', cls: 't-indigo' }]
      },
      {
        dot: 'indigo', week: 'Semaine 3–4', icon: '✍️',
        title: 'Refonte du portfolio & Case studies',
        body: "Réécrivez chaque projet en mettant en avant l'impact business (ROI, chiffre d'affaires généré, temps économisé). Un portfolio orienté résultats justifie des tarifs seniors.",
        tags: [{ label: 'Portfolio', cls: 't-orange' }, { label: 'Copywriting', cls: 't-green' }]
      },
      {
        dot: 'emerald', week: 'Mois 2', icon: '📦',
        title: 'Création de packages Signature à valeur ajoutée',
        body: 'Transformez vos services en 3 forfaits (Essentiel / Pro / Prestige). Intégrez des livrables premium dans le tier Prestige (ex. session stratégique mensuelle, garantie satisfaction 30j).',
        tags: [{ label: 'Upsell', cls: 't-violet' }, { label: 'Packages', cls: 't-indigo' }]
      },
      {
        dot: 'orange', week: 'Mois 3', icon: '🎯',
        title: 'Transition progressive vers des clients premium',
        body: "Appliquez vos nouveaux tarifs sur les nouvelles demandes uniquement. Informez vos clients actuels d'une revalorisation à 60 jours. Ciblez des startups en phase de croissance ou des ETI.",
        tags: [{ label: 'Clients', cls: 't-green' }, { label: 'Négociation', cls: 't-orange' }]
      },
      {
        dot: 'pink', week: 'Mois 4–6', icon: '🏆',
        title: 'Personal Branding & Autorité de niche',
        body: "Publiez 2 articles d'expertise par mois sur LinkedIn. Participez à un podcast ou webinaire de votre secteur. L'autorité perçue est le levier n°1 pour maintenir des tarifs élevés.",
        tags: [{ label: 'Personal Branding', cls: 't-violet' }, { label: 'Contenu', cls: 't-indigo' }]
      }
    ],

    'diversifier': [
      {
        dot: 'violet', week: 'Semaine 1–2', icon: '🗺️',
        title: 'Cartographie de vos sources de revenus actuelles',
        body: 'Listez toutes vos missions des 6 derniers mois par type (projet ponctuel, retainer, etc.). Identifiez les "zones blanches" : plateformes non exploitées, formats non testés.',
        tags: [{ label: 'Audit', cls: 't-violet' }, { label: 'Stratégie', cls: 't-indigo' }]
      },
      {
        dot: 'indigo', week: 'Semaine 3–4', icon: '🌐',
        title: "Activation d'une nouvelle plateforme",
        body: 'Choisissez une plateforme complémentaire (Malt si vous êtes sur Upwork/Fiverr, ou vice versa). Créez un profil optimisé et obtenez vos 3 premières évaluations en 30 jours.',
        tags: [{ label: 'Multiplateforme', cls: 't-green' }, { label: 'Onboarding', cls: 't-orange' }]
      },
      {
        dot: 'emerald', week: 'Mois 2', icon: '📦',
        title: "Création d'un produit numérique passif",
        body: "Packagisez votre expertise en un template, un guide ou un mini-cours (Gumroad, Notion). Objectif : générer 200–500€/mois passifs d'ici le mois 3 avec zéro intervention client.",
        tags: [{ label: 'Passif', cls: 't-violet' }, { label: 'Scalable', cls: 't-green' }]
      },
      {
        dot: 'orange', week: 'Mois 3', icon: '🤝',
        title: "Lancement d'une offre de retainer mensuel",
        body: "Proposez à vos 2 meilleurs clients une formule d'abonnement mensuel (ex. maintenance, conseil stratégique). La prévisibilité des revenus réduit le stress financier de 80%.",
        tags: [{ label: 'Retainer', cls: 't-indigo' }, { label: 'Récurrence', cls: 't-orange' }]
      },
      {
        dot: 'pink', week: 'Mois 4–6', icon: '🚀',
        title: 'Bilan, ajustement & Nouveau canal de revenus',
        body: "Mesurez la part de chaque flux dans votre CA total. Doublez l'effort sur les 2 sources les plus rentables. Testez un 3ème canal (ex. consulting, formation, sous-traitance).",
        tags: [{ label: 'Diversification', cls: 't-violet' }, { label: 'Scalabilité', cls: 't-indigo' }]
      }
    ]
  };

  // ─── 7. BUILDERS HTML ────────────────────────────────────────────────────

  /**
   * Génère le HTML des étapes de la timeline à partir d'un tableau de steps.
   * @param {Array<{dot, week, icon, title, body, tags}>} steps — Étapes de la roadmap.
   * @returns {string} Fragment HTML des étapes.
   */
  function buildTimeline(steps) {
    return steps.map((step, idx) => `
      <div class="timeline-step">
        <div class="timeline-dot ${step.dot}">${idx + 1}</div>
        <div class="timeline-header">
          <span class="timeline-week">${step.week}</span>
          <span class="timeline-title">${step.icon} ${step.title}</span>
        </div>
        <div class="timeline-body">${step.body}</div>
        <div class="timeline-tags">
          ${step.tags.map(t => `<span class="timeline-tag ${t.cls}">${t.label}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Construit le HTML d'une roadmap depuis les données IA structurées.
   * Utilisé lorsque l'Edge Function renvoie une réponse valide.
   *
   * @param {Object} aiData — Réponse JSON de l'Edge Function.
   * @param {string} objectif — Clé de l'objectif.
   * @param {string} revenuCible — Montant cible en €.
   * @returns {string} HTML complet du bloc roadmap IA.
   */
  function buildAiRoadmapHTML(aiData, objectif, revenuCible) {
    const goalLabel = {
      'trouver-clients': 'Trouver des clients',
      'augmenter-prix':  'Augmenter mes prix',
      'diversifier':     'Diversifier mes revenus'
    }[objectif] || objectif;

    const projMonth6 = revenuCible
      ? Math.round(parseInt(revenuCible, 10) * 1.18).toLocaleString('fr-FR') + ' €'
      : '—';

    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // 1. Construire la section Plateformes Recommandées (Bento Flash Cards)
    const platformCardsHTML = (aiData.recommendedPlatforms || [])
      .map(p => {
        if (p && typeof p === 'object') {
          return `
            <div class="ai-platform-card">
              <span class="ai-platform-badge">${p.name || ''}</span>
              <p class="ai-platform-reason">${p.reason || ''}</p>
            </div>
          `;
        }
        return `
          <div class="ai-platform-card">
            <span class="ai-platform-badge">${p}</span>
          </div>
        `;
      })
      .join('');

    // 2. Construire la section Roadmap 12 Semaines (Bento Flash Cards Grid)
    const roadmapCardsHTML = (aiData.roadmap || []).map((entry) => {
      const weekNum = entry.week || '';
      const weekTitle = entry.title || '';
      const detailsHTML = (entry.details || [])
        .map(detail => `<li class="ai-week-detail-item">${detail}</li>`)
        .join('');

      return `
        <div class="ai-week-card">
          <div class="ai-week-header">
            <span class="ai-week-number">Semaine ${weekNum}</span>
            <span class="ai-week-title">${weekTitle}</span>
          </div>
          <ul class="ai-week-details">
            ${detailsHTML}
          </ul>
        </div>
      `;
    }).join('');

    return `
      <div class="roadmap-output-card">
        <div class="roadmap-result-banner">
          <div class="roadmap-result-icon">🎯</div>
          <div>
            <div class="roadmap-result-label">Objectif détecté · ${goalLabel}</div>
            <div class="roadmap-result-val">Projection M+6 : ${projMonth6}</div>
          </div>
        </div>

        <div class="roadmap-output-title">Votre Roadmap Freelance sur mesure</div>
        <div class="roadmap-output-sub">Généré par Voraly IA · Powered by Supabase · ${dateStr}</div>

        ${aiData.marketingStrategy ? `
          <div style="margin: 24px 0; padding: 20px; background: rgba(255,102,204,0.06); border: 1px solid rgba(255,102,204,0.2); border-radius: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #FF66CC; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">💡 Stratégie Marketing IA</div>
            <p style="font-size: 13px; color: #d4d4d8; line-height: 1.7; margin: 0;">${aiData.marketingStrategy}</p>
          </div>
        ` : ''}

        ${platformCardsHTML ? `
          <div style="margin-bottom: 36px;">
            <div style="font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px;">🌐 Plateformes recommandées & opportunités</div>
            <div class="ai-platforms-grid">${platformCardsHTML}</div>
          </div>
        ` : ''}

        ${roadmapCardsHTML ? `
          <div style="margin-bottom: 36px;">
            <div style="font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px;">📅 Plan d'action sur 12 semaines</div>
            <div class="ai-roadmap-grid">
              ${roadmapCardsHTML}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">💡</span>
          <p style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0;">
            <strong style="color: #e4e4e7;">Conseil Voraly IA :</strong> Commencez par la Semaine 1 dès aujourd'hui — les freelances qui exécutent dans les 48h suivant un plan voient leurs résultats arriver <strong style="color: #8b5cf6;">3× plus vite</strong> que ceux qui attendent.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Construit le HTML complet de la roadmap statique (fallback sans Edge Function).
   *
   * @param {string} objectif     — Clé de l'objectif ("trouver-clients" | "augmenter-prix" | "diversifier").
   * @param {string} revenuCible  — Montant cible en €, sous forme de chaîne (peut être vide).
   * @returns {string} HTML complet du bloc roadmap à injecter dans #roadmap-output.
   */
  function buildRoadmapHTML(objectif, revenuCible) {
    const steps = roadmapLibrary[objectif] || roadmapLibrary['trouver-clients'];

    const goalLabel = {
      'trouver-clients': 'Trouver des clients',
      'augmenter-prix':  'Augmenter mes prix',
      'diversifier':     'Diversifier mes revenus'
    }[objectif] || objectif;

    // Projection M+6 : +18% sur l'objectif déclaré
    const projMonth6 = revenuCible
      ? Math.round(parseInt(revenuCible, 10) * 1.18).toLocaleString('fr-FR') + ' €'
      : '—';

    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    return `
      <div class="roadmap-output-card">
        <div class="roadmap-result-banner">
          <div class="roadmap-result-icon">🎯</div>
          <div>
            <div class="roadmap-result-label">Objectif détecté · ${goalLabel}</div>
            <div class="roadmap-result-val">Projection M+6 : ${projMonth6}</div>
          </div>
        </div>

        <div class="roadmap-output-title">Votre Roadmap Freelance sur mesure</div>
        <div class="roadmap-output-sub">Plan d'action sur 6 mois · Généré par Voraly IA · ${dateStr}</div>

        <div class="timeline">
          ${buildTimeline(steps)}
        </div>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">💡</span>
          <p style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0;">
            <strong style="color: #e4e4e7;">Conseil Voraly IA :</strong> Commencez par l'étape 1 dès aujourd'hui — les freelances qui exécutent dans les 48h suivant un plan voient leurs résultats arriver <strong style="color: #8b5cf6;">3× plus vite</strong> que ceux qui attendent.
          </p>
        </div>
      </div>
    `;
  }

  // ─── 8. ÉTAT DE CHARGEMENT GLASSMORPHISM ──────────────────────────────────

  /**
   * Affiche un état de chargement glassmorphism animé dans #roadmap-output.
   */
  function showLoadingState() {
    const roadmapOutput = document.getElementById('roadmap-output');
    if (!roadmapOutput) return;
    roadmapOutput.innerHTML = `
      <div class="roadmap-loading-state">
        <div class="roadmap-loading-inner">
          <div class="roadmap-loading-spinner"></div>
          <div class="roadmap-loading-title">Voraly IA analyse votre profil...</div>
          <div class="roadmap-loading-sub">Connexion à Supabase · Génération de votre stratégie personnalisée</div>
          <div class="roadmap-loading-steps">
            <div class="roadmap-loading-step active" id="lstep-1">🔗 Connexion au backend sécurisé</div>
            <div class="roadmap-loading-step" id="lstep-2">🧠 Analyse de votre profil freelance</div>
            <div class="roadmap-loading-step" id="lstep-3">📊 Croisement des données plateformes</div>
            <div class="roadmap-loading-step" id="lstep-4">✨ Génération de la roadmap personnalisée</div>
          </div>
        </div>
      </div>
    `;
    // Animation des étapes de chargement
    let stepIdx = 1;
    const stepInterval = setInterval(() => {
      const prevEl = document.getElementById(`lstep-${stepIdx}`);
      if (prevEl) prevEl.classList.remove('active');
      stepIdx++;
      const nextEl = document.getElementById(`lstep-${stepIdx}`);
      if (nextEl) nextEl.classList.add('active');
      if (stepIdx >= 4) clearInterval(stepInterval);
    }, 900);
  }

  // ─── 8.5. FONCTIONS DE RENDU & MODULE DE CHAT ─────────────────────────────
  let dbRemainingCount = 3;
  let currentAiData = null;

  function renderRoadmapView(aiData, formData) {
    const obj = formData?.objectif || 'trouver-clients';
    const rev = formData?.revenuCible || '';

    // Masquer le formulaire immédiatement
    const formContainer = document.getElementById('roadmap-form')?.closest('.card');
    if (formContainer) {
      formContainer.style.display = 'none';
    }

    // Rendre le grid Bento dans l'output
    const roadmapOutput = document.getElementById('roadmap-output');
    if (roadmapOutput) {
      roadmapOutput.innerHTML = buildAiRoadmapHTML(aiData, obj, rev);
    }

    // Initialiser le module de chat
    initChatModule(aiData);
  }

  function initChatModule(aiData) {
    currentAiData = aiData;
    dbRemainingCount = 3;

    const chatContainer = document.getElementById('ai-refinement-chat');
    if (!chatContainer) return;

    chatContainer.style.display = 'block';

    const messagesArea = document.getElementById('chat-messages-noir');
    const counterText = document.getElementById('chat-counter-noir');
    const chatInput = document.getElementById('chat-input-noir');
    const submitBtn = document.getElementById('chat-submit-btn-noir');

    if (messagesArea) {
      messagesArea.innerHTML = '';
      // Premier message automatique de l'IA
      appendChatMessage('ai', 'Stratégie établie. Quel point souhaitez-vous approfondir ou ajuster ?');
    }

    if (counterText) {
      counterText.textContent = 'Messages restants : 3/3';
    }

    if (chatInput && submitBtn) {
      chatInput.disabled = false;
      submitBtn.disabled = false;
      chatInput.placeholder = 'Posez une question pour ajuster votre plan...';
    }
  }

  function scrollToBottom() {
    const messagesArea = document.getElementById('chat-messages-noir');
    if (messagesArea) {
      messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  function appendChatMessage(sender, text) {
    const messagesArea = document.getElementById('chat-messages-noir');
    if (!messagesArea) return;

    const messageRow = document.createElement('div');
    messageRow.className = `chat-message-row ${sender}`;

    if (sender === 'user') {
      messageRow.innerHTML = `
        <span class="chat-message-sender user">Vous</span>
        <div class="chat-message-text">${text}</div>
      `;
    } else {
      messageRow.innerHTML = `
        <span class="chat-message-sender ai"><span class="ai-badge-gemini">✨ IA</span> Voraly IA</span>
        <div class="chat-message-text">${text}</div>
      `;
    }

    messagesArea.appendChild(messageRow);
    scrollToBottom();
  }

  function showThinkingIndicator() {
    const messagesArea = document.getElementById('chat-messages-noir');
    if (!messagesArea) return;

    if (document.getElementById('chat-thinking-indicator')) return;

    const messageRow = document.createElement('div');
    messageRow.className = 'chat-message-row ai';
    messageRow.id = 'chat-thinking-indicator';
    messageRow.innerHTML = `
      <span class="chat-message-sender ai"><span class="ai-badge-gemini">✨ IA</span> Voraly IA</span>
      <div class="thinking-dots-container">
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
      </div>
    `;

    messagesArea.appendChild(messageRow);
    scrollToBottom();
  }

  function removeThinkingIndicator() {
    const indicator = document.getElementById('chat-thinking-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // ─── 9. FORMULAIRE — Soumission & Génération IA via Supabase ─────────────
  const roadmapForm   = document.getElementById('roadmap-form');
  const roadmapCtaBtn = document.getElementById('roadmap-cta-btn');
  const roadmapOutput = document.getElementById('roadmap-output');

  if (roadmapForm && roadmapCtaBtn && roadmapOutput) {
    roadmapForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const objectif    = document.getElementById('objectif')?.value;
      const revenuCible = document.getElementById('revenu-cible')?.value;
      const situation   = document.getElementById('situation')?.value;

      // Validation — l'objectif est obligatoire
      if (!objectif) {
        document.getElementById('objectif')?.focus();
        return;
      }

      // État de chargement
      roadmapCtaBtn.disabled    = true;
      roadmapCtaBtn.textContent = '⏳ Analyse de votre profil en cours...';

      // Masquer le formulaire immédiatement pour laisser place au loader
      const formContainer = roadmapForm.closest('.card');
      if (formContainer) {
        formContainer.style.display = 'none';
      }

      showLoadingState();
      roadmapOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const formData = { objectif, revenuCible, situation };
      // Identifiant utilisateur temporaire (à remplacer par une vraie session Supabase Auth)
      const userId = 'user-' + (Date.now().toString(36));

      // Appel à l'Edge Function via aiService.js
      const aiResult = await generateFreelancerStrategy(formData, userId);

      if (aiResult) {
        // ── Succès : afficher la roadmap générée par l'IA ──────────────────
        renderRoadmapView(aiResult, formData);
      } else {
        // ── Fallback statique si l'Edge Function est indisponible ───────────
        console.warn('[Voraly] Fallback sur la bibliothèque statique de roadmaps.');
        roadmapOutput.innerHTML = buildRoadmapHTML(objectif, revenuCible);
      }

      roadmapOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Restauration du bouton
      roadmapCtaBtn.disabled    = false;
      roadmapCtaBtn.textContent = '✨ Générer ma stratégie sur mesure';
    });
  }

  // Bind du formulaire de chat interactif
  const chatForm = document.getElementById('chat-form-noir');
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const chatInput = document.getElementById('chat-input-noir');
      const submitBtn = document.getElementById('chat-submit-btn-noir');
      if (!chatInput || !submitBtn) return;

      const userText = chatInput.value.trim();
      if (!userText || dbRemainingCount <= 0) return;

      // Afficher message utilisateur
      appendChatMessage('user', userText);
      chatInput.value = '';

      // Désactiver pendant le chargement
      chatInput.disabled = true;
      submitBtn.disabled = true;
      const originalPlaceholder = chatInput.placeholder;
      chatInput.placeholder = 'L\'IA réfléchit...';

      // Afficher l'indicateur de réflexion de l'IA (dots animés)
      showThinkingIndicator();

      // Appel à l'Edge function via aiService
      const aiResult = await sendChatMessage(userText, currentAiData);

      // Retirer l'indicateur de réflexion
      removeThinkingIndicator();

      let replyText = 'Désolé, une erreur est survenue lors de l\'échange.';
      
      if (aiResult) {
        replyText = aiResult.reply;
        dbRemainingCount = aiResult.messagesRemaining;
      }

      // Afficher la réponse IA
      appendChatMessage('ai', replyText);

      // Mettre à jour le compteur de messages restants avec le quota DB réel
      const counterText = document.getElementById('chat-counter-noir');
      if (counterText) {
        counterText.textContent = `Messages restants : ${dbRemainingCount}/3`;
      }

      // Gérer la limite de messages basée entièrement sur le quota DB
      if (dbRemainingCount <= 0) {
        chatInput.disabled = true;
        submitBtn.disabled = true;
        chatInput.placeholder = 'Analyse terminée. Limite de requêtes atteinte.';
      } else {
        chatInput.disabled = false;
        submitBtn.disabled = false;
        chatInput.placeholder = originalPlaceholder;
        chatInput.focus();
      }
    });
  }

});
