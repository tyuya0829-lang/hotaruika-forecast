'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  spotName: string
  battleStart: string  // "HH:MM"
  battleEnd: string    // "HH:MM"
  date: string         // YYYY-MM-DD (勝負日付)
}

type ActionState = 'idle' | 'submitting' | 'go' | 'nogo' | 'error'

/** "HH:MM" + "YYYY-MM-DD" → ISO timestamptz 文字列 (JST) */
function toTimestamp(date: string, time: string): string {
  return `${date}T${time}:00+09:00`
}

export default function ActionButtons({ spotName, battleStart, battleEnd, date }: Props) {
  const [state, setState] = useState<ActionState>('idle')

  async function handleAction(action: 'go' | 'nogo') {
    if (state === 'submitting' || state === 'go' || state === 'nogo') return
    setState('submitting')

    const { error } = await supabase.from('posts').insert([{
      spot_name:    spotName,
      level:        'action',
      body:         '',
      action:       action,
      battle_start: toTimestamp(date, battleStart),
      battle_end:   toTimestamp(date, battleEnd),
    }])

    if (error) {
      console.error('ActionButtons insert error:', error)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    } else {
      setState(action)
    }
  }

  // 送信済みバナー
  if (state === 'go' || state === 'nogo') {
    return (
      <div
        className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-xl"
        style={{
          background: state === 'go'
            ? 'rgba(0,229,255,0.08)'
            : 'rgba(80,60,140,0.15)',
          border: `1px solid ${state === 'go' ? 'rgba(0,229,255,0.25)' : 'rgba(155,119,255,0.25)'}`,
        }}
      >
        <span style={{ fontSize: '1rem' }}>{state === 'go' ? '🦑' : '💤'}</span>
        <span style={{
          color: state === 'go' ? '#00e5ff' : '#9b77ff',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>
          {state === 'go' ? '今夜行くことを登録しました！' : '今夜は見送りで登録しました'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-2 mt-3">
      {/* 今夜行く */}
      <button
        onClick={() => handleAction('go')}
        disabled={state === 'submitting'}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, rgba(0,180,220,0.2), rgba(0,229,255,0.12))',
          border: '1px solid rgba(0,229,255,0.35)',
          color: state === 'submitting' ? 'rgba(0,229,255,0.35)' : '#00e5ff',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          boxShadow: state === 'submitting' ? 'none' : '0 0 14px rgba(0,229,255,0.12)',
          cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ fontSize: '1rem' }}>🦑</span>
        今夜行く
      </button>

      {/* 行かない */}
      <button
        onClick={() => handleAction('nogo')}
        disabled={state === 'submitting'}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200"
        style={{
          background: 'rgba(80,60,140,0.12)',
          border: '1px solid rgba(155,119,255,0.25)',
          color: state === 'submitting' ? 'rgba(155,119,255,0.3)' : '#9b77ff',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ fontSize: '1rem' }}>💤</span>
        行かない
      </button>

      {state === 'error' && (
        <span style={{ color: '#f87171', fontSize: '0.65rem', alignSelf: 'center', marginLeft: 4 }}>
          送信エラー
        </span>
      )}
    </div>
  )
}
