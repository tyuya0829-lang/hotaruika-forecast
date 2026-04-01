import { NextRequest, NextResponse } from 'next/server'
import { fetchWeather } from '@/lib/forecast'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '35.6287')
  const lon = parseFloat(searchParams.get('lon') ?? '134.4474')

  try {
    const data = await fetchWeather(lat, lon)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
