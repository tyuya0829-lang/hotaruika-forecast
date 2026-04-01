import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// ビルド時に一度だけ読み込んでキャッシュ
let tideCache: Record<string, { time: string; height: number }[]> | null = null

function loadTideData() {
  if (tideCache) return tideCache
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'tide-2026.json')
    const raw = readFileSync(filePath, 'utf-8')
    tideCache = JSON.parse(raw)
    return tideCache
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date parameter required (YYYY-MM-DD)' }, { status: 400 })
  }

  const data = loadTideData()

  if (!data) {
    return NextResponse.json(
      { error: 'tide data not available. Run: npm run fetch-tide' },
      { status: 503 },
    )
  }

  const tides = data[date] ?? null

  if (!tides) {
    return NextResponse.json({ date, tides: null, available: false })
  }

  return NextResponse.json({ date, tides, available: true })
}
