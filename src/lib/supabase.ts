import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnon)

export interface Post {
  id: string
  spot_name: string
  level: string
  body: string
  created_at: string
}
