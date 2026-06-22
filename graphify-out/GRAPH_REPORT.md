# Graph Report - .  (2026-06-22)

## Corpus Check
- 101 files · ~50,037 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 435 nodes · 854 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & OAuth Routes|Auth & OAuth Routes]]
- [[_COMMUNITY_UI Components & Utils|UI Components & Utils]]
- [[_COMMUNITY_Supabase Client & Settings|Supabase Client & Settings]]
- [[_COMMUNITY_Dashboard Data & Types|Dashboard Data & Types]]
- [[_COMMUNITY_Layout & Auth Middleware|Layout & Auth Middleware]]
- [[_COMMUNITY_Roadmap & Platform Routes|Roadmap & Platform Routes]]
- [[_COMMUNITY_Landing & KPI Bento|Landing & KPI Bento]]
- [[_COMMUNITY_Platform APIs & Pricing|Platform APIs & Pricing]]
- [[_COMMUNITY_Agenda Calendar Card|Agenda Calendar Card]]
- [[_COMMUNITY_Liquid Glass UI Pages|Liquid Glass UI Pages]]
- [[_COMMUNITY_i18n & Localization|i18n & Localization]]
- [[_COMMUNITY_Public Static Pages|Public Static Pages]]
- [[_COMMUNITY_3D Hero Scene|3D Hero Scene]]
- [[_COMMUNITY_Public Navigation|Public Navigation]]
- [[_COMMUNITY_CGU Legal Page|CGU Legal Page]]
- [[_COMMUNITY_Privacy Policy Page|Privacy Policy Page]]
- [[_COMMUNITY_Rate Limiting Middleware|Rate Limiting Middleware]]
- [[_COMMUNITY_Notion Event Status Action|Notion Event Status Action]]
- [[_COMMUNITY_Subscription Badge|Subscription Badge]]
- [[_COMMUNITY_Contact Layout|Contact Layout]]
- [[_COMMUNITY_FAQ Layout|FAQ Layout]]
- [[_COMMUNITY_Optimize Page|Optimize Page]]
- [[_COMMUNITY_Matomo Analytics Proxy|Matomo Analytics Proxy]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 55 edges
2. `T` - 45 edges
3. `cn()` - 44 edges
4. `createAdminClient()` - 13 edges
5. `getSiteOrigin()` - 12 edges
6. `LiquidButton()` - 9 edges
7. `getIntegrationProvider()` - 9 edges
8. `getIntegrationCredentials()` - 9 edges
9. `normalizeRoadmap()` - 9 edges
10. `GET()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AProposPage()` --calls--> `T`  [INFERRED]
  voraly-web/src/app/a-propos/page.tsx → voraly-web/src/components/dashboard/DeadlineCard.tsx
- `CguPage()` --calls--> `T`  [INFERRED]
  voraly-web/src/app/cgu/page.tsx → voraly-web/src/components/dashboard/DeadlineCard.tsx
- `ConfidentialitePage()` --calls--> `T`  [INFERRED]
  voraly-web/src/app/confidentialite/page.tsx → voraly-web/src/components/dashboard/DeadlineCard.tsx
- `ContactPage()` --calls--> `T`  [INFERRED]
  voraly-web/src/app/contact/page.tsx → voraly-web/src/components/dashboard/DeadlineCard.tsx
- `IntegrationsPage()` --calls--> `T`  [INFERRED]
  voraly-web/src/app/dashboard/integrations/page.tsx → voraly-web/src/components/dashboard/DeadlineCard.tsx

## Import Cycles
- None detected.

## Communities (28 total, 5 thin omitted)

### Community 0 - "Auth & OAuth Routes"
Cohesion: 0.08
Nodes (48): exchangeCodeForTokens(), exchangeGoogleToken(), exchangeLinkedInToken(), exchangeNotionToken(), Conn, fetchGoogle(), fetchNotion(), refreshGoogle() (+40 more)

### Community 1 - "UI Components & Utils"
Cohesion: 0.06
Nodes (45): labelVariants, navItems, spring, tabVariants, cn(), links, MarketingNav(), MarketingNavProps (+37 more)

### Community 2 - "Supabase Client & Settings"
Cohesion: 0.08
Nodes (36): metadata, RootPage(), ALLOWED_TYPES, EXT_BY_MIME, POST(), checkFreeQuota(), extractMarketingStrategy(), freeQuota (+28 more)

### Community 3 - "Dashboard Data & Types"
Cohesion: 0.08
Nodes (30): AiTaskCard(), AiTaskCardProps, DAY_ACCENT, isDailyTaskId(), priorityDot, blurReveal(), DashboardContent(), DashboardContentProps (+22 more)

### Community 4 - "Layout & Auth Middleware"
Cohesion: 0.08
Nodes (25): AuthState, ERROR_MAP, loginAction(), logoutAction(), signupAction(), toFrench(), inter, metadata (+17 more)

### Community 5 - "Roadmap & Platform Routes"
Cohesion: 0.12
Nodes (22): buildBrief(), GenerateBody, POST(), unwrapEnvelope(), buildUserDataSummary(), GET(), refreshGoogleToken(), CinematicLoader() (+14 more)

### Community 6 - "Landing & KPI Bento"
Cohesion: 0.10
Nodes (16): KpiEmptyState(), KpiGridProps, BENTO_ICONS, blurReveal, FAQ_KEYS, LandingExperience(), METRIC_KEYS, PLATFORM_LOGOS (+8 more)

### Community 7 - "Platform APIs & Pricing"
Cohesion: 0.20
Nodes (12): POST(), CheckoutPhase, PricingExperience(), ProCard(), POST(), getWhopClient(), getWhopPlanId(), isWhopConfigured() (+4 more)

### Community 8 - "Agenda Calendar Card"
Cohesion: 0.18
Nodes (13): ConnectorButton(), DeadlineCard(), DeadlineCardProps, DEFAULT_STYLE, EventPopup(), fmtDuration(), fmtTime(), getStyle() (+5 more)

### Community 9 - "Liquid Glass UI Pages"
Cohesion: 0.17
Nodes (10): AProposPage(), metadata, ValueItem, ContactPage(), FonctionnalitesPage(), metadata, PILLAR_META, TRUST_KEYS (+2 more)

### Community 10 - "i18n & Localization"
Cohesion: 0.35
Nodes (7): setUserLocale(), isLocale(), Locale, LOCALE_LABELS, LOCALES, detectLocaleFromHeaders(), getUserLocale()

### Community 11 - "Public Static Pages"
Cohesion: 0.18
Nodes (6): FaqCategoryData, FaqPage(), FOOTER_COLS, PublicFooter(), MentionsLegalesPage(), metadata

### Community 13 - "Public Navigation"
Cohesion: 0.25
Nodes (3): NAV_LINKS, PillCTA(), PublicNav()

### Community 14 - "CGU Legal Page"
Cohesion: 0.40
Nodes (4): CguPage(), metadata, richTags, SECTION_KEYS

### Community 15 - "Privacy Policy Page"
Cohesion: 0.40
Nodes (3): ConfidentialitePage(), metadata, SECTION_KEYS

### Community 16 - "Rate Limiting Middleware"
Cohesion: 0.67
Nodes (3): checkIpRateLimit(), ipRateLimit, POST()

### Community 17 - "Notion Event Status Action"
Cohesion: 0.50
Nodes (3): ALLOWED_STATUSES, NotionStatus, updateNotionEventStatus()

### Community 18 - "Subscription Badge"
Cohesion: 0.67
Nodes (3): daysUntil(), SubscriptionBadge(), SubscriptionBadgeProps

## Knowledge Gaps
- **100 isolated node(s):** `metadata`, `ValueItem`, `AuthState`, `ERROR_MAP`, `ipRateLimit` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Supabase Client & Settings` to `Auth & OAuth Routes`, `Dashboard Data & Types`, `Layout & Auth Middleware`, `Roadmap & Platform Routes`, `Platform APIs & Pricing`, `Notion Event Status Action`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **Why does `T` connect `Agenda Calendar Card` to `Auth & OAuth Routes`, `UI Components & Utils`, `Supabase Client & Settings`, `Dashboard Data & Types`, `Layout & Auth Middleware`, `Roadmap & Platform Routes`, `Landing & KPI Bento`, `Platform APIs & Pricing`, `Liquid Glass UI Pages`, `Public Static Pages`, `Public Navigation`, `CGU Legal Page`, `Privacy Policy Page`, `Subscription Badge`, `Optimize Page`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Components & Utils` to `Layout & Auth Middleware`, `Roadmap & Platform Routes`, `Landing & KPI Bento`, `Agenda Calendar Card`, `Liquid Glass UI Pages`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Are the 44 inferred relationships involving `T` (e.g. with `AProposPage()` and `CguPage()`) actually correct?**
  _`T` has 44 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getSiteOrigin()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`getSiteOrigin()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `ValueItem`, `AuthState` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & OAuth Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08240794856808883 - nodes in this community are weakly interconnected._