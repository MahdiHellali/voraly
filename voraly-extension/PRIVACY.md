# Politique de confidentialité — Voraly Sync Engine

_Dernière mise à jour : 2026-06-24_

## Ce que l'extension fait

Voraly Sync Engine lit des indicateurs de performance (revenus, solde en attente,
commandes actives, note) **déjà affichés** sur les pages de freelancing où
l'utilisateur est connecté (Fiverr, Upwork, Malt), lorsqu'il les visite, et les
transmet à son propre compte Voraly (`https://voraly.net`).

## Ce que l'extension NE fait PAS

- **Ne lit, ne stocke et ne transmet jamais** les cookies, mots de passe ou
  tokens de session de Fiverr, Upwork ou Malt.
- **N'effectue aucune requête en arrière-plan** vers les plateformes : elle lit
  uniquement le contenu déjà rendu dans la page que l'utilisateur ouvre lui-même.
- **Ne suit pas** la navigation de l'utilisateur, n'injecte aucune publicité et
  ne revend aucune donnée.

## Données traitées

| Donnée | Usage | Stockage |
| --- | --- | --- |
| Token de session Voraly (JWT) | Authentifier l'envoi vers voraly.net | `chrome.storage.local` (machine locale) |
| KPIs lus dans la page | Affichage dans le dashboard Voraly | Transmis à voraly.net, archivés au compte de l'utilisateur |
| Date du dernier sync par plateforme | Limiter la fréquence (6h) | `chrome.storage.local` |

Aucune donnée n'est partagée avec des tiers. Le seul destinataire est le backend
Voraly de l'utilisateur, sur une connexion HTTPS, authentifiée par son token.

## Suppression

Désinstaller l'extension supprime tout le stockage local. Les données déjà
synchronisées peuvent être supprimées depuis le compte Voraly de l'utilisateur.

## Contact

Pour toute question : support@voraly.net
