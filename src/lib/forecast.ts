// ================================================================
// 月齢・予報スコア計算ユーティリティ
// ================================================================

export const SPOTS = [
  { id: 'hamasaka-port',  name: '浜坂漁港',      pref: '兵庫', lat: 35.6283, lon: 134.4490, desc: '堤防・長柄タモ推奨・漁港への接岸がメイン' },
  { id: 'kasumi-port',    name: '香住港',         pref: '兵庫', lat: 35.6271, lon: 134.6989, desc: '漁港堤防・駐車場あり' },
  { id: 'shibayama',      name: '柴山港',         pref: '兵庫', lat: 35.6130, lon: 134.7361, desc: '但馬漁港・静かなポイント' },
  { id: 'kora-port',      name: '甲楽城漁港',     pref: '福井', lat: 35.6150, lon: 136.0180, desc: '漁港堤防・ホタルイカ接岸実績あり' },
  { id: 'shinbo-port',    name: '新保港',         pref: '福井', lat: 35.6400, lon: 136.0350, desc: '越前海岸・定番すくいポイント' },
  { id: 'echizen-port',   name: '越前漁港',       pref: '福井', lat: 35.8700, lon: 136.0440, desc: '越前町・断崖地形で急深・ホタルイカが寄りやすい' },
  { id: 'mikuni-port',    name: '三国港',         pref: '福井', lat: 36.2180, lon: 136.1700, desc: '坂井市三国・九頭竜川河口・広い堤防' },
  { id: 'echizen-coast',  name: '越前海岸',       pref: '福井', lat: 35.8200, lon: 136.0100, desc: '断崖絶壁のリアス式海岸・夜間は足元注意' },
] as const

export type SpotId = typeof SPOTS[number]['id']
export type Spot = typeof SPOTS[number]

// 新月基準日（国立天文台）
const MOON_REF_MS = new Date('2026-03-19T00:00:00Z').getTime()
const MOON_CYCLE_MS = 29.53059 * 86_400_000

export function moonAge(date: Date): number {
  return (((date.getTime() - MOON_REF_MS) % MOON_CYCLE_MS) + MOON_CYCLE_MS) % MOON_CYCLE_MS / MOON_CYCLE_MS * 29.53059
}

export function moonEmoji(age: number): string {
  const p = age / 29.53
  if (p < 0.03 || p > 0.97) return '🌑'
  if (p < 0.22) return '🌒'
  if (p < 0.28) return '🌓'
  if (p < 0.47) return '🌔'
  if (p < 0.53) return '🌕'
  if (p < 0.72) return '🌖'
  if (p < 0.78) return '🌗'
  return '🌘'
}

// ================================================================
// WMO 天気コード → 日本語 / スコア
// ================================================================
export const WMO_LABEL: Record<number, string> = {
  0:'快晴', 1:'晴れ', 2:'晴れ', 3:'曇り',
  45:'霧', 48:'霧',
  51:'霧雨', 53:'霧雨', 55:'霧雨',
  61:'雨', 63:'雨', 65:'大雨',
  71:'雪', 73:'雪', 75:'大雪',
  80:'にわか雨', 81:'にわか雨', 82:'強雨',
  95:'雷雨', 96:'雷雨', 99:'雷雨',
}
const WMO_SCORE: Record<number, number> = {
  0:4, 1:3, 2:3, 3:2, 45:1, 48:1,
  51:1, 53:1, 55:0, 61:0, 63:0, 65:0,
  71:1, 73:0, 75:0, 80:1, 81:1, 82:0,
  95:0, 96:0, 99:0,
}

const WIND_DIRS = ['北','北北東','北東','東北東','東','東南東','南東','南南東','南','南南西','南西','西南西','西','西北西','北西','北北西']
export function windDirLabel(deg: number) { return WIND_DIRS[Math.round(deg / 22.5) % 16] }

// ================================================================
// スコア計算（重み付き合成）
// ================================================================
function moonScore(age: number): number {
  const d = Math.min(age, 29.53 - age)
  if (d <= 1.5) return 4
  if (d <= 3)   return 3
  if (d <= 5)   return 2.5
  if (d <= 8)   return 1.5
  if (d <= 11)  return 0.5
  return 0
}
function weatherScore(wc: number): number { return WMO_SCORE[wc] ?? 2 }
function windScore(deg: number): number {
  if ((deg >= 292.5 && deg <= 360) || (deg >= 0 && deg <= 67.5)) return 4
  if (deg > 180 && deg <= 292.5) return 2
  return 1
}
function tempScore(t: number): number {
  if (t >= 15) return 3
  if (t >= 12) return 2.5
  if (t >= 8)  return 2
  if (t >= 5)  return 1
  return 0
}

export function composite(ms: number, ws: number, wd: number, ts: number): number {
  return ms * 0.50 + ws * 0.25 + wd * 0.15 + ts * 0.10
}

export function scoreToLevel(score: number): number {
  if (score >= 3.5) return 5
  if (score >= 2.5) return 4
  if (score >= 1.8) return 3
  if (score >= 1.1) return 2
  if (score >= 0.5) return 1
  return 0
}

export const LEVEL_NAMES = ['寄りなし', 'プチ寄り', 'チョイ寄り', '寄り', '大寄り', '爆寄り'] as const
// 生物発光カラー：暗海→淡青→シアン→明シアン→テール→電光テール
export const LEVEL_COLORS = ['#2a3a4a', '#0e6a78', '#0ea5c9', '#00c8e8', '#00e5ff', '#1bffd7']
export const LEVEL_BG     = ['rgba(42,58,74,0.2)', 'rgba(14,106,120,0.2)', 'rgba(14,165,201,0.18)', 'rgba(0,200,232,0.18)', 'rgba(0,229,255,0.18)', 'rgba(27,255,215,0.2)']
export const LEVEL_TEXT   = ['#4a6070', '#0e9aac', '#0ea5c9', '#00c8e8', '#00e5ff', '#1bffd7']

export interface DayForecast {
  date: Date
  age: number
  ms: number
  ws: number
  wd: number
  ts: number
  score: number
  level: number
  weather: string
  weatherCode: number
  windDeg: number
  windDir: string
  temp: number
  precip: number
}

export function buildForecast(
  weatherData: WeatherResponse | null,
  referenceDate: Date = new Date()
): DayForecast[] {
  const base = new Date(referenceDate)
  base.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base.getTime() + i * 86_400_000)
    const age = moonAge(d)
    const ms  = moonScore(age)

    const wc    = weatherData?.daily.weathercode[i]    ?? 1
    const temp  = weatherData?.daily.temperature_2m_max[i] ?? 12
    const precip = weatherData?.daily.precipitation_sum[i] ?? 0
    const windDeg = weatherData?.daily.winddirection_10m_dominant[i] ?? 315

    const ws = weatherScore(wc)
    const wd = windScore(windDeg)
    const ts = tempScore(temp)
    const score = composite(ms, ws, wd, ts)

    return {
      date: d,
      age,
      ms, ws, wd, ts,
      score,
      level: scoreToLevel(score),
      weather: WMO_LABEL[wc] ?? '不明',
      weatherCode: wc,
      windDeg,
      windDir: windDirLabel(windDeg),
      temp,
      precip,
    }
  })
}

// ================================================================
// Open-Meteo API 型
// ================================================================
export interface WeatherResponse {
  daily: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: number[]
    precipitation_sum: number[]
    windspeed_10m_max: number[]
    winddirection_10m_dominant: number[]
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant')
  url.searchParams.set('timezone', 'Asia/Tokyo')
  url.searchParams.set('forecast_days', '7')
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}
