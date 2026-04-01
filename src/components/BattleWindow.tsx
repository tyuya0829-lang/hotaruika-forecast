'use client'

import { useEffect, useState } from 'react'
import { calcBattleWindow, type BattleWindow as BattleWindowType, type TidePoint } from '@/lib/tide'

interface Props {
  date: string  // YYYY-MM-DD
  /** 計算結果を親へ通知（ActionButtons 連携用） */
  onCalc?: (window: BattleWindowType | null) => void
}

export default function BattleWindow({ date, onCalc }: Props) {
  const [window_, setWindow] = useState<BattleWindowType | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    setLoading(true)
    setUnavailable(false)

    fetch(`/api/tide?date=${date}`)
      .then(r => r.json())
      .then((res: { available: boolean; tides: TidePoint[] | null }) => {
        if (!res.available || !res.tides) {
          setUnavailable(true)
          setWindow(null)
          onCalc?.(null)
          return
        }
        const bw = calcBattleWindow(res.tides)
        setWindow(bw)
        onCalc?.(bw)
      })
      .catch(() => {
        setUnavailable(true)
        setWindow(null)
        onCalc?.(null)
      })
      .finally(() => setLoading(false))
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  // データなし・ロード中は何も表示しない
  if (loading) return (
    <div style={{ color: 'rgba(0,180,220,0.3)', fontSize: '0.7rem', padding: '8px 0' }}>
      🌊 潮位データ取得中...
    </div>
  )
  if (unavailable || !window_) return null

  return (
    <div
      className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl"
      style={{
        background: 'rgba(0,100,150,0.18)',
        border: '1px solid rgba(0,200,240,0.25)',
        boxShadow: '0 0 16px rgba(0,180,220,0.08)',
      }}
    >
      {/* 波アイコン */}
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🌊</span>

      <div className="flex-1">
        <p style={{ color: 'rgba(0,200,230,0.55)', fontSize: '0.6rem', marginBottom: 2, letterSpacing: '0.06em' }}>
          勝負時間（満潮±60分）
        </p>
        <p style={{ color: '#00e5ff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          {window_.start}〜{window_.end}
        </p>
      </div>

      <div style={{ textAlign: 'right' }}>
        <p style={{ color: 'rgba(0,200,230,0.45)', fontSize: '0.58rem', marginBottom: 2 }}>満潮ピーク</p>
        <p style={{ color: '#1bffd7', fontSize: '0.8rem', fontWeight: 700 }}>
          {window_.peakHeight} cm
        </p>
        <p style={{ color: 'rgba(0,200,230,0.35)', fontSize: '0.58rem' }}>
          {window_.peakTime}
        </p>
      </div>
    </div>
  )
}
