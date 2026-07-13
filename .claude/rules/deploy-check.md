---
paths:
  - ".claude/agents/**"
  - "deploy/**"
  - "docker-compose*"
  - "Dockerfile*"
---

# Règle de vérification déploiement — Hermes

Avant tout déploiement en production, 3 critères OBLIGATOIRES sont vérifiés par Hermes :

## Critère 1 — Scalabilité ✅
- [ ] Scalability Chief a rendu un verdict **SCALABLE**
- [ ] Points RISQUE éventuels corrigés et re-vérifiés
- [ ] La feature supporte la concurrence (plusieurs users en même temps)
- [ ] Pas de bottleneck identifié (BDD, API, workers)
- [ ] Index Postgres en place pour les nouvelles queries
- [ ] Pagination si listes potentiellement longues

## Critère 2 — Sécurité ✅
- [ ] Security Chief a rendu un verdict **GO**
- [ ] Points NO-GO éventuels corrigés et re-vérifiés
- [ ] Aucun secret exposé (client ou repo)
- [ ] RLS owner-only sur toutes les tables touchées
- [ ] `user_id` dérivé de la session, jamais du body
- [ ] Webhook Whop sécurisé (HMAC)
- [ ] Anti-abus / rate-limit en place si route IA

## Critère 3 — Conformité au PRD ✅
- [ ] La feature implémente exactement ce qui est décrit dans le PRD
- [ ] Tous les critères de succès fonctionnels sont remplis
- [ ] États loading/empty/error/happy présents
- [ ] DA liquid-glass respectée
- [ ] Aucun scope creep (feature non demandée mais ajoutée)
- [ ] Tests ergonomiques passés (bouton clique, route répond, affichage correct)

## Décision finale
- **3/3 verts** → GO déploiement. Hermes exécute le déploiement VPS.
- **1+ rouge** → STOP. Retour à l'Orchestrateur pour correction du ou des points bloquants. Pas de déploiement.
