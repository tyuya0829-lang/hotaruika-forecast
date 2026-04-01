'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SPOTS, Spot, DayForecast, buildForecast, moonAge, moonEmoji,
  LEVEL_NAMES, LEVEL_COLORS, LEVEL_BG, LEVEL_TEXT, WeatherResponse
} from '@/lib/forecast'
import { Post } from '@/lib/supabase'
import BulletinBoard from './BulletinBoard'

const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

interface Props {
  initialForecast: DayForecast[]
  initialSpot: Spot
  currentMoonAge: number
  daysToNewMoon: number
}

export default function ForecastClient({ initialForecast, initialSpot, currentMoonAge, daysToNewMoon }: Props) {
  const [spot, setSpot] = useState<Spot>(initialSpot)
  const [forecast, setForecast] = useState<DayForecast[]>(initialForecast)
  const [selDay, setSelDay] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadWeather = useCallback(async (s: Spot) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/weather?lat=${s.lat}&lon=${s.lon}`)
      const data: WeatherResponse = await res.json()
      setForecast(buildForecast(data))
    } catch {
      setForecast(buildForecast(null))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSpotChange = (s: Spot) => {
    setSpot(s)
    setSelDay(0)
    loadWeather(s)
  }

  const sel = forecast[selDay]

  return (
    <div className="space-y-6">
      {/* スポット選択 */}
      <section>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">ポイント選択</p>
        <div className="flex flex-wrap gap-2">
          {SPOTS.map(s => (
            <button
              key={s.id}
              onClick={() => handleSpotChange(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                s.id === spot.id
                  ? 'bg-white text-gray-950 border-white font-medium'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              <span className="opacity-60 mr-1">{s.pref}</span>{s.name}
            </button>
          ))}
        </div>
      </section>

      {/* 現況パネル */}
      <section>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">現在の状況</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '月齢', val: `${moonEmoji(currentMoonAge)} ${currentMoonAge.toFixed(1)}`, sub: `新月まで ${daysToNewMoon.toFixed(1)}日` },
            { label: '今夜の予報', val: LEVEL_NAMES[forecast[0]?.level ?? 0], sub: spot.name },
            { label: '天気', val: forecast[0]?.weather ?? '-', sub: `${forecast[0]?.temp.toFixed(1) ?? '-'}℃` },
            { label: '風向', val: forecast[0]?.windDir ?? '-', sub: `降水 ${forecast[0]?.precip.toFixed(1) ?? '-'}mm` },
          ].map(({ label, val, sub }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-sm font-medium text-white leading-tight">{val}</p>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7日間予報 */}
      <section>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          7日間予報
          {loading && <span className="ml-2 text-teal-500">更新中...</span>}
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {forecast.map((f, i) => {
            const h = Math.max(4, f.level * 7)
            const m = f.date.getMonth() + 1
            const d = f.date.getDate()
            const wd = DAYS_JP[f.date.getDay()]
            return (
              <button
                key={i}
                onClick={() => setSelDay(i)}
                className={`rounded-xl p-2 text-center transition-colors border ${
                  i === selDay
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <p className="text-xs text-gray-500">{m}/{d}</p>
                <p className="text-xs font-medium text-gray-400 mb-2">{wd}</p>
                <div className="h-10 flex flex-col justify-end items-center mb-2">
                  <div
                    className="w-full rounded-sm"
                    style={{ height: `${h * 5}px`, background: LEVEL_COLORS[f.level] }}
                  />
                </div>
                <span
                  className="text-xs px-1 py-0.5 rounded-full font-medium"
                  style={{ background: LEVEL_BG[f.level], color: LEVEL_TEXT[f.level] }}
                >
                  {LEVEL_NAMES[f.level]}
                </span>
                <p className="text-xs text-gray-600 mt-1">{moonEmoji(f.age)}{f.age.toFixed(0)}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* 選択日の詳細 */}
      {sel && (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">
              {sel.date.getMonth() + 1}/{sel.date.getDate()}（{DAYS_JP[sel.date.getDay()]}）詳細
            </h2>
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: LEVEL_BG[sel.level], color: LEVEL_TEXT[sel.level] }}
            >
              {LEVEL_NAMES[sel.level]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {[
              ['月齢', `${moonEmoji(sel.age)} ${sel.age.toFixed(1)}`],
              ['新月まで', `${Math.min(sel.age, 29.53 - sel.age).toFixed(1)} 日`],
              ['天気', sel.weather],
              ['最高気温', `${sel.temp.toFixed(1)}℃`],
              ['風向', sel.windDir],
              ['降水量', `${sel.precip.toFixed(1)} mm`],
              ['ポイント', spot.desc],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center border-b border-gray-800 py-1.5 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-200 text-xs">{v}</span>
              </div>
            ))}
          </div>

          {/* スコア内訳 */}
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">スコア内訳</p>
          <div className="space-y-2">
            {([
              ['月齢 50%', sel.ms, 4, '#7F77DD'],
              ['天気 25%', sel.ws, 4, '#378ADD'],
              ['風向 15%', sel.wd, 4, '#1D9E75'],
              ['気温 10%', sel.ts, 3, '#EF9F27'],
            ] as [string, number, number, string][]).map(([label, val, max, color]) => (
              <div key={label} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-gray-500 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(val / max * 100)}%`, background: color }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 掲示板 */}
      <BulletinBoard spots={SPOTS} />
    </div>
  )
}
