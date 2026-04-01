import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { spot_name, level, body: postBody, nickname } = body

  if (!spot_name || !level || !postBody?.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([{
      spot_name,
      level,
      body: postBody.trim(),
      nickname: nickname?.trim() || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
