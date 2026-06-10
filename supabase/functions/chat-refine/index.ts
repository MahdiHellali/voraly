// ─── Voraly · Supabase Edge Function ─────────────────────────────────────────
// Nom : chat-refine
// Runtime : Deno (pas de Node.js, pas de npm)
// Rôle : Gère le chat de raffinement de stratégie avec Gemini.
//
// Sécurité :
//   - L'identité de l'appelant est vérifiée via son JWT (header Authorization).
//   - L'userId provient du JWT vérifié, jamais du payload client (anti-IDOR).
//   - Le service role ne sert qu'à mettre à jour les quotas.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Origines autorisées. En production, remplacez YOUR_EXTENSION_ID par l'ID
// réel de l'extension Chrome (visible dans chrome://extensions).
const ALLOWED_ORIGINS = [
  'https://voraly.me',
  'http://localhost:3000',
  'https://localhost:3000',
  // Chrome extensions send 'null' as origin in some contexts (popup/service worker)
  'null',
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

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

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
    // 3. Récupérer les secrets serveur
    const geminiApiKey     = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl      = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey  = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!geminiApiKey) {
      console.error('[Voraly] GEMINI_API_KEY manquante.');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Vérifier l'identité de l'appelant via son JWT (anti-IDOR).
    //    On NE fait PAS confiance au userId dans le payload — on l'extrait du token.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié. Fournissez un Bearer token utilisateur.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userToken = authHeader.replace('Bearer ', '').trim()
    // Utiliser le client anon pour valider le JWT auprès du serveur d'auth Supabase
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(userToken)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // userId provient du serveur — impossible à falsifier par le client
    const userId = user.id

    // 5. Parser le payload JSON
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corps de la requête JSON invalide.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message  = payload.message as string;
    const context  = payload.context;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message manquant.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Initialiser le client service role pour gérer les quotas (contourne RLS)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 7. Vérifier/Créer le quota de messages dans user_quotas
    const { data: quotaData, error: selectError } = await supabaseClient
      .from('user_quotas')
      .select('messages_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    let messagesRemaining = 3;

    if (selectError) {
      console.error('[Voraly] Erreur lecture quota :', selectError);
      return new Response(
        JSON.stringify({ error: 'Erreur d\'accès au quota.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quotaData) {
      const { error: insertError } = await supabaseClient
        .from('user_quotas')
        .insert({ user_id: userId, messages_remaining: 3 });

      if (insertError) {
        console.error('[Voraly] Erreur création quota :', insertError);
        return new Response(
          JSON.stringify({ error: 'Erreur d\'initialisation du quota.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      messagesRemaining = 3;
    } else {
      messagesRemaining = quotaData.messages_remaining;
    }

    // 8. Valider si le quota est dépassé
    if (messagesRemaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'Limite de messages atteinte.', messages_remaining: 0 }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Construire le prompt et appeler Gemini
    const systemPrompt = `Tu es l'expert stratégique de Voraly.me. Le freelance a cette stratégie actuelle : ${JSON.stringify(context)}. Il te pose cette question : "${message}". Réponds de manière extrêmement concise, stratégique et directe en français (maximum 3-4 phrases). Pose une question fermée à la fin pour l'orienter si nécessaire.`;

    const geminiPayload = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('[Voraly] Gemini API Error (Chat):', geminiRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erreur API Gemini : ${geminiRes.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Extraire la réponse Gemini
    const geminiData = await geminiRes.json();
    const reply: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!reply) {
      console.error('[Voraly] Réponse Gemini vide :', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: 'Réponse vide reçue de Gemini.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Décrémenter le quota
    const newRemaining = messagesRemaining - 1;
    const { error: updateError } = await supabaseClient
      .from('user_quotas')
      .update({ messages_remaining: newRemaining })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Voraly] Erreur mise à jour quota :', updateError);
    }

    return new Response(
      JSON.stringify({ reply, messages_remaining: newRemaining }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[Voraly] Erreur dans chat-refine :', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur.' }),
      { status: 500, headers: { ...buildCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' } }
    );
  }
});
