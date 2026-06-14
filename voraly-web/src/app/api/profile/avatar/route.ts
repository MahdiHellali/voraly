import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const MAX_SIZE = 2 * 1024 * 1024 // 2 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// NOTE : la colonne avatar_url doit exister dans la table profiles.
// Si absente, l'appeler manuellement dans Supabase SQL Editor :
//   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

// Extension dérivée exclusivement du MIME validé — jamais du file.name (prévention path traversal).
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

// Cache module-level : le bucket n'est créé qu'une fois par instance Node.
let bucketReady = false

export async function POST(request: NextRequest) {
  // 1. Auth — user_id depuis session, jamais du body
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 2. Parse FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }

  // 3. Validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type', message: 'Formats acceptés : JPEG, PNG, WebP, GIF' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'too_large', message: 'Taille maximale : 2 Mo' }, { status: 400 })
  }

  // 4. Upload via service_role (Storage ne respecte pas les JWT client standard)
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Créer le bucket une seule fois (cache module-level pour éviter un appel admin à chaque upload)
  if (!bucketReady) {
    await adminClient.storage.createBucket('avatars', { public: true, fileSizeLimit: MAX_SIZE }).catch(() => {})
    bucketReady = true
  }

  // Extension dérivée du MIME validé — jamais du file.name (prévention path traversal)
  const ext = EXT_BY_MIME[file.type] ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[avatar] upload failed', uploadError)
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }

  // 5. URL publique
  const { data: { publicUrl } } = adminClient.storage.from('avatars').getPublicUrl(path)
  // Cache-buster pour forcer le rechargement côté browser
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  // 6. Mettre à jour profiles.avatar_url (best-effort — la colonne doit exister, voir NOTE ci-dessus)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlWithBust })
    .eq('id', user.id)

  if (updateError) {
    console.warn('[avatar] profiles.avatar_url update failed (colonne absente ?)', updateError.message)
    // On retourne quand même l'URL pour que le frontend puisse l'afficher
  }

  return NextResponse.json({ url: urlWithBust })
}
