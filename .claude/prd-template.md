# PRD — [Nom de la Feature]

## 1. Objectif
_En 2-3 phrases, quel problème ça résout et pour qui._

## 2. Périmètre fonctionnel
### Pages / Routes concernées
- `[path]` → nouvelle page / modification

### Composants
- `[ComponentName]` → création / modification

### API Routes
- `[POST/GET/PUT] /api/[route]` → création / modification

### Base de données (Supabase)
- Table(s) : `[table_name]`
- Colonnes ajoutées : `[col1, col2]`
- Migrations nécessaires : Oui / Non

### n8n / Workers
- Nouveau workflow : Oui / Non
- Workflow existant modifié : `[nom]`

## 3. Critères de succès
### Fonctionnels
- [ ] L'utilisateur peut [action]
- [ ] Le bouton [nom] déclenche [résultat]
- [ ] Les données s'affichent correctement

### États
- [ ] **Loading** : skeleton visible pendant le chargement
- [ ] **Empty** : message dédié quand il n'y a rien
- [ ] **Error** : message friendly + retry
- [ ] **Happy** : rendu normal

### Technique
- [ ] `npm run typecheck` vert
- [ ] `npm run lint` vert
- [ ] RLS owner-only respectée
- [ ] Pas de secret exposé

## 4. Design (DA liquid-glass)
- Maquette : [description ou référence]
- Nouveaux composants : [liste]
- Animations : [entrée, transition, hover]
- État vide spécifique : [description]

## 5. Scalabilité
- Nombre d'utilisateurs concernés : [N]
- Données par utilisateur : [volume estimé]
- Requêtes par seconde estimées : [N]

## 6. Sécurité
- Données sensibles manipulées : [liste]
- Auth requise : Oui / Non
- Niveau de sensibilité : Faible / Moyen / Critique

## 7. Déploiement
- Nouvelle variable d'env : [liste]
- Migration BDD à apply : Oui / Non (fichier)
- Breaking change : Oui / Non
- Ordre de déploiement : [standard / spécifique]

---

**Validé par l'utilisateur** : [date]
**Cycle orchestrateur** : CYCLE-XXX
