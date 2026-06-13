// ─── Voraly · Supabase Edge Function ─────────────────────────────────────────
// Nom : generate-strategy
// Runtime : Deno (pas de Node.js, pas de npm)
// Rôle : Proxy sécurisé entre l'extension Chrome et l'API Gemini.
//        La clé Gemini n'est JAMAIS exposée au client.
//
// Variables d'environnement requises (définies via `supabase secrets set`) :
//   GEMINI_API_KEY — Clé API Google AI Studio (Gemini)
// ─────────────────────────────────────────────────────────────────────────────

// ── En-têtes CORS ─────────────────────────────────────────────────────────────
// Origines autorisées. En production, remplacez YOUR_EXTENSION_ID par l'ID
// réel de l'extension Chrome (visible dans chrome://extensions).
const ALLOWED_ORIGINS = [
  'https://voraly.net',
  'http://localhost:3000',
  'https://localhost:3000',
  'null', // Chrome extension popup/service worker context
];

function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// ── URL Gemini (clé injectée via header x-goog-api-key, pas en query string) ─────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'))

  // 1. Répondre aux requêtes preflight OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. N'accepter que les requêtes POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Récupérer la clé Gemini depuis les secrets Supabase (jamais exposée)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[Voraly] GEMINI_API_KEY manquante dans les secrets Supabase.');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parser le payload JSON envoyé par l'extension
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corps de la requête JSON invalide.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Extraire les données du payload
    const formData  = (payload.formData  as Record<string, string>) || {};
    const platforms = (payload.platforms as Record<string, unknown>) || {};
    const userName  = (payload.userName  as string) || 'Freelance';

    // 6. Construire le payload au format exact attendu par l'API Gemini REST
    // Le prompt système est inliné dans le message utilisateur — compatibilité maximale.
    const userData = { formData, platforms, userName };
    const promptText = `Tu es un expert en stratégie business et un consultant d'élite pour freelances. Ton but est de transformer ce freelance en un business ultra-rentable.
Données du freelance : ${JSON.stringify(userData)}.

Règles strictes :
1. Conçois une stratégie orientée vers la scalabilité, l'optimisation des offres, et l'acquisition de clients à haute valeur ajoutée (notamment marchés US/EU).
2. Fournis un plan sur 12 semaines (3 mois) avec une progression logique.
3. Tu dois STRICTEMENT répondre avec ce format JSON exact, sans markdown, sans rien d'autre :
{
  "marketingStrategy": "Une stratégie marketing concrète, agressive et innovante en 3 paragraphes.",
  "recommendedPlatforms": [
    { "name": "Nom de la plateforme", "reason": "Explication détaillée de l'opportunité stratégique sur cette plateforme." }
  ],
  "roadmap": [
    { "week": 1, "title": "Titre de la semaine", "details": ["Action précise 1", "Action précise 2"] }
  ]
}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: promptText
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
      }
    };

    // 7. Appeler l'API Gemini via fetch natif Deno
    // La clé est transmise via le header x-goog-api-key (méthode de référence Google).
    const geminiRes = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-goog-api-key':  geminiApiKey,
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      // Lire le corps complet de l'erreur Google pour diagnostiquer précisément
      const errorText = await geminiRes.text();
      console.error('[Voraly] Gemini API Error Details:', geminiRes.status, errorText);
      return new Response(
        JSON.stringify({
          error:   `Erreur API Gemini : ${geminiRes.status}`,
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Extraire le texte de la réponse Gemini
    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      console.error('[Voraly] Réponse Gemini vide ou mal formée :', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: 'Réponse vide reçue de Gemini.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Parser le JSON retourné par Gemini
    // On nettoie les éventuelles balises markdown résiduelles par sécurité.
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/,    '')
      .trim();

    let aiResponse: Record<string, unknown>;
    try {
      aiResponse = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[Voraly] Impossible de parser la réponse Gemini en JSON :', cleaned);
      return new Response(
        JSON.stringify({ error: 'La réponse de l\'IA n\'est pas un JSON valide.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Valider la structure minimale du schéma attendu
    if (
      typeof aiResponse.marketingStrategy   !== 'string' ||
      !Array.isArray(aiResponse.recommendedPlatforms) ||
      !Array.isArray(aiResponse.roadmap)
    ) {
      console.error('[Voraly] Structure JSON Gemini invalide :', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Structure de réponse IA invalide.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Retourner la réponse validée au client
    return new Response(
      JSON.stringify(aiResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    // Filet de sécurité global — ne jamais crasher sans réponse
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[Voraly] Erreur inattendue dans generate-strategy :', message);
    return new Response(
      JSON.stringify({
        error:          'Erreur interne du serveur.',
        marketingStrategy:      'Service temporairement indisponible. Veuillez réessayer.',
        recommendedPlatforms:   [],
        roadmap:                [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
