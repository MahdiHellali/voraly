import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCompletedSteps } from '@/lib/roadmap/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('completed_steps')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ completed_steps: [] })
  return NextResponse.json({ completed_steps: normalizeCompletedSteps(data?.completed_steps) })
}
