import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ProgressBody {
  completed_daily_tasks?: string[]
  completed_steps?: number[]
}

export async function POST(request: NextRequest) {
  // 1. Auth — user_id depuis session, jamais du body
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 2. Parse body
  let body: ProgressBody
  try {
    body = await request.json() as ProgressBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (Array.isArray(body.completed_daily_tasks)) patch.completed_daily_tasks = body.completed_daily_tasks
  if (Array.isArray(body.completed_steps)) patch.completed_steps = body.completed_steps

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  // 3. Update via admin (bypass GRANT authenticated)
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', user.id)

  if (error) {
    console.error('[progress] failed to update profiles', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
