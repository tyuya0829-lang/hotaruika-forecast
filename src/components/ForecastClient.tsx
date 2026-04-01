'use client'

import { useState, useCallback } from 'react'
import {
  SPOTS, Spot, DayForecast, buildForecast, moonAge, moonEmoji,
  LEVEL_NAMES, LEVEL_COLORS, LEVEL_BG, LEVEL_TEXT, WeatherResponse
} from '@/lib/forecast'
import BulletinBoard from './BulletinBoard'
import BattleWindow from './BattleWindow'
import ActionButtons from './ActionButtons'
import type { BattleWindow as BattleWindowType } from '@/lib/tide'

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
  const [battleWindow, setBattleWindow] = useState<BattleWindowType | null>(null)

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

  // 都道府県ごとにグループ化
  const prefGroups = SPOTS.reduce((acc, s) => {
    if (!acc[s.pref]) acc[s.pref] = []
    acc[s.pref].push(s)
    return acc
  }, {} as Record<string, Spot[]>)

  return (
    <div className="space-y-5">

      {/* ━━━ スポット選択 ━━━ */}
      <section>
        <p className="section-title mb-3">📍 ポイント選択</p>
        <div className="glass-card rounded-2xl p-3 space-y-2">
          {Object.entries(prefGroups).map(([pref, prefSpots]) => (
            <div key={pref} className="flex flex-wrap items-center gap-1.5">
              <span style={{
                color: 'rgba(0,180,220,0.6)',
                background: 'rgba(0,150,180,0.1)',
                fontSize: '0.6rem',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}>
                {pref}
              </span>
              {prefSpots.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSpotChange(s)}
                  className="text-xs rounded-full px-3 py-1 transition-all duration-200"
                  style={s.id === spot.id ? {
                    background: 'rgba(0,229,255,0.12)',
                    border: '1px solid rgba(0,229,255,0.45)',
                    color: '#00e5ff',
                    boxShadow: '0 0 10px rgba(0,229,255,0.18)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(160,190,220,0.65)',
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ 現況パネル ━━━ */}
      <section>
        <p className="section-title mb-3">🌊 現在の状況</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* 月齢 */}
          <div className="glass-card rounded-2xl p-3" style={{ borderColor: 'rgba(155,119,255,0.22)' }}>
            <p style={{ color: 'rgba(155,119,255,0.55)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>月齢</p>
            <p className="text-base font-bold moon-glow" style={{ color: '#c4a7ff' }}>
              {moonEmoji(currentMoonAge)} {currentMoonAge.toFixed(1)}
            </p>
            <p style={{ color: 'rgba(155,119,255,0.4)', fontSize: '0.65rem', marginTop: 4 }}>
              新月まで {daysToNewMoon.toFixed(1)}日
            </p>
          </div>

          {/* 今夜の予報 */}
          <div className="glass-card rounded-2xl p-3">
            <p className="section-title mb-1" style={{ fontSize: '0.58rem' }}>今夜の予報</p>
            <p className="text-sm font-bold" style={{ color: LEVEL_TEXT[forecast[0]?.level ?? 0] }}>
              {LEVEL_NAMES[forecast[0]?.level ?? 0]}
            </p>
            <p style={{ color: 'rgba(0,180,220,0.38)', fontSize: '0.65rem', marginTop: 4 }} className="truncate">
              {spot.name}
            </p>
          </div>

          {/* 天気 */}
          <div className="glass-card rounded-2xl p-3">
            <p className="section-title mb-1" style={{ fontSize: '0.58rem' }}>天気</p>
            <p className="text-sm font-semibold" style={{ color: '#b8d8f0' }}>{forecast[0]?.weather ?? '-'}</p>
            <p style={{ color: 'rgba(0,180,220,0.38)', fontSize: '0.65rem', marginTop: 4 }}>
              {forecast[0]?.temp.toFixed(1) ?? '-'}℃
            </p>
          </div>

          {/* 風向 */}
          <div className="glass-card rounded-2xl p-3">
            <p className="section-title mb-1" style={{ fontSize: '0.58rem' }}>風向 / 降水</p>
            <p className="text-sm font-semibold" style={{ color: '#b8d8f0' }}>{forecast[0]?.windDir ?? '-'}</p>
            <p style={{ color: 'rgba(0,180,220,0.38)', fontSize: '0.65rem', marginTop: 4 }}>
              {forecast[0]?.precip.toFixed(1) ?? '-'} mm
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ 7日間予報 ━━━ */}
      <section>
        <p className="section-title mb-3">
          📅 7日間予報
          {loading && <span className="ml-2 squid-glow inline-block" style={{ color: '#00e5ff' }}>更新中...</span>}
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {forecast.map((f, i) => {
            const barH = Math.max(6, f.level * 8)
            const isSelected = i === selDay
            return (
              <button
                key={i}
                onClick={() => setSelDay(i)}
                className="rounded-xl p-2 text-center transition-all duration-200"
                style={isSelected ? {
                  background: 'rgba(0,180,220,0.09)',
                  border: `1px solid rgba(0,229,255,0.38)`,
                  boxShadow: '0 0 16px rgba(0,229,255,0.1)',
                  backdropFilter: 'blur(14px)',
                } : {
                  background: 'rgba(5,14,40,0.6)',
                  border: '1px solid rgba(0,180,220,0.15)',
                  backdropFilter: 'blur(14px)',
                }}
              >
                <p style={{ color: 'rgba(0,180,220,0.45)', fontSize: '0.58rem', marginBottom: 2 }}>
                  {f.date.getMonth() + 1}/{f.date.getDate()}
                </p>
                <p style={{
                  color: isSelected ? '#00e5ff' : 'rgba(0,180,220,0.55)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {DAYS_JP[f.date.getDay()]}
                </p>
                {/* グロー棒 */}
                <div style={{ height: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 }}>
                  <div
                    className={f.level >= 3 ? 'glow-bar' : ''}
                    style={{
                      height: barH,
                      width: '100%',
                      borderRadius: 3,
                      background: f.level >= 3
                        ? `linear-gradient(180deg, ${LEVEL_COLORS[f.level]}, ${LEVEL_COLORS[Math.max(0, f.level - 1)]})`
                        : LEVEL_COLORS[f.level],
                      boxShadow: f.level >= 4 ? `0 0 8px ${LEVEL_COLORS[f.level]}88` : 'none',
                    }}
                  />
                </div>
                <span style={{
                  background: LEVEL_BG[f.level],
                  color: LEVEL_TEXT[f.level],
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  padding: '1px 4px',
                  borderRadius: 999,
                  boxShadow: f.level >= 4 ? `0 0 6px ${LEVEL_COLORS[f.level]}55` : 'none',
                }}>
                  {LEVEL_NAMES[f.level]}
                </span>
                <p style={{ color: 'rgba(155,119,255,0.4)', fontSize: '0.55rem', marginTop: 4 }}>
                  {moonEmoji(f.age)}{f.age.toFixed(0)}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* ━━━ 選択日の詳細 ━━━ */}
      {sel && (
        <section>
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(0,30,60,0.55)',
              border: `1px solid ${LEVEL_COLORS[sel.level]}44`,
              backdropFilter: 'blur(14px)',
              boxShadow: sel.level >= 3 ? `0 0 30px ${LEVEL_COLORS[sel.level]}18` : 'none',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: '#d0ecff' }}>
                {sel.date.getMonth() + 1}/{sel.date.getDate()}（{DAYS_JP[sel.date.getDay()]}）詳細
              </h2>
              <span
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  background: LEVEL_BG[sel.level],
                  color: LEVEL_TEXT[sel.level],
                  border: `1px solid ${LEVEL_COLORS[sel.level]}44`,
                  boxShadow: sel.level >= 3 ? `0 0 12px ${LEVEL_COLORS[sel.level]}55` : 'none',
                }}
              >
                {LEVEL_NAMES[sel.level]}
              </span>
            </div>

            <div className="ocean-divider mb-4" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5">
              {([
                ['月齢', `${moonEmoji(sel.age)} ${sel.age.toFixed(1)}`],
                ['新月まで', `${Math.min(sel.age, 29.53 - sel.age).toFixed(1)} 日`],
                ['天気', sel.weather],
                ['最高気温', `${sel.temp.toFixed(1)}℃`],
                ['風向', sel.windDir],
                ['降水量', `${sel.precip.toFixed(1)} mm`],
                ['ポイント', spot.desc],
              ] as [string, string][]).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(0,150,180,0.1)' }}
                >
                  <span style={{ color: 'rgba(0,180,220,0.42)', fontSize: '0.7rem' }}>{k}</span>
                  <span style={{ color: 'rgba(210,235,255,0.82)', fontSize: '0.7rem', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <p className="section-title mb-3">スコア内訳</p>
            <div className="space-y-2.5">
              {([
                ['月齢 50%', sel.ms, 4, '#9b77ff'],
                ['天気 25%', sel.ws, 4, '#378ADD'],
                ['風向 15%', sel.wd, 4, '#00c8e8'],
                ['気温 10%', sel.ts, 3, '#00e5ff'],
              ] as [string, number, number, string][]).map(([label, val, max, color]) => (
                <div key={label} className="flex items-center gap-3">
                  <span style={{ color: 'rgba(0,180,220,0.42)', fontSize: '0.65rem', width: 80, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(0,50,80,0.6)', overflow: 'hidden' }}>
                    <div
                      className="transition-all duration-700"
                      style={{
                        height: '100%',
                        width: `${Math.round(val / max * 100)}%`,
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: val >= max * 0.7 ? `0 0 6px ${color}88` : 'none',
                      }}
                    />
                  </div>
                  <span style={{ color: 'rgba(0,180,220,0.4)', fontSize: '0.65rem', width: 24, textAlign: 'right' }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {/* ━━━ 勝負時間 & 行動ボタン ━━━ */}
            <div className="ocean-divider mt-4 mb-0" />
            <BattleWindow
              date={`${sel.date.getFullYear()}-${String(sel.date.getMonth() + 1).padStart(2, '0')}-${String(sel.date.getDate()).padStart(2, '0')}`}
              onCalc={setBattleWindow}
            />
            {battleWindow && (
              <ActionButtons
                spotName={spot.name}
                battleStart={battleWindow.start}
                battleEnd={battleWindow.end}
                date={`${sel.date.getFullYear()}-${String(sel.date.getMonth() + 1).padStart(2, '0')}-${String(sel.date.getDate()).padStart(2, '0')}`}
              />
            )}
          </div>
        </section>
      )}

      {/* ━━━ 掲示板 ━━━ */}
      <BulletinBoard spots={SPOTS} />
    </div>
  )
}
