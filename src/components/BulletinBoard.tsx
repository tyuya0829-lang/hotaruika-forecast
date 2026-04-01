'use client'

import { useState, useEffect } from 'react'
import { SPOTS, LEVEL_NAMES, LEVEL_BG, LEVEL_TEXT } from '@/lib/forecast'
import type { Post } from '@/lib/supabase'
import type { Spot } from '@/lib/forecast'

const SAMPLE_POSTS: Post[] = [
  { id: '1', spot_name: '浜坂サンビーチ', level: '大湧き',    body: '新月前夜、かなり湧きました！砂浜沿いが多め。ウェーダー必須です。', created_at: '2026-03-29T02:41:00Z' },
  { id: '2', spot_name: '浦富海岸',       level: '湧き',      body: '岩場周辺で確認できました。1時間で30匹ほど。光ってる個体もいて幻想的。', created_at: '2026-03-28T23:55:00Z' },
  { id: '3', spot_name: '香住港',         level: '湧きなし',  body: '月が明るくて全然ダメでした。新月狙いで出直します。', created_at: '2026-03-22T01:10:00Z' },
  { id: '4', spot_name: '浜坂漁港',       level: 'チョイ湧き', body: '港の外側堤防で少し確認。また来月リベンジ！', created_at: '2026-03-20T03:15:00Z' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props { spots: typeof SPOTS }

export default function BulletinBoard({ spots }: Props) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
  const [spotName, setSpotName] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [level, setLevel] = useState<string>(LEVEL_NAMES[3])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Supabase から読み込み（環境変数があれば）
  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setPosts(data) })
      .catch(() => { /* サンプルデータのまま */ })
  }, [])

  async function handleSubmit() {
    if (!body.trim() || !spotName.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spot_name: spotName, level, body, nickname }),
      })
      if (res.ok) {
        const newPost: Post = await res.json()
        setPosts(prev => [newPost, ...prev])
        setBody('')
      } else {
        // Supabase 未設定時はローカルに追加
        const tempPost: Post = {
          id: Date.now().toString(),
          spot_name: spotName,
          level,
          body,
          nickname: nickname.trim() || undefined,
          created_at: new Date().toISOString(),
        }
        setPosts(prev => [tempPost, ...prev])
        setBody('')
      }
    } catch {
      setError('投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">掲示板 — 現地レポート</p>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-200">現地情報シェア</span>
          <span className="text-xs text-gray-600">{posts.length}件</span>
        </div>

        {/* 投稿一覧 */}
        <div className="divide-y divide-gray-800">
          {posts.map(p => {
            const lvIdx = LEVEL_NAMES.indexOf(p.level as typeof LEVEL_NAMES[number])
            const bg = lvIdx >= 0 ? LEVEL_BG[lvIdx] : '#88878012'
            const tc = lvIdx >= 0 ? LEVEL_TEXT[lvIdx] : '#5F5E5A'
            return (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                    {p.spot_name}
                  </span>
                  {p.nickname && (
                    <span className="text-xs text-gray-400 font-medium">
                      {p.nickname}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">{formatTime(p.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-1.5">{p.body}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: bg, color: tc }}
                >
                  {p.level}
                </span>
              </div>
            )
          })}
        </div>

        {/* 投稿フォーム */}
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          {/* スポット名：自由入力 + 候補サジェスト */}
          <datalist id="spot-suggestions">
            {spots.map(s => <option key={s.id} value={s.name}>{s.pref} — {s.desc}</option>)}
          </datalist>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              list="spot-suggestions"
              value={spotName}
              onChange={e => setSpotName(e.target.value)}
              placeholder="場所（例：越前漁港、地元の港など）"
              maxLength={50}
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 placeholder-gray-600"
            />
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5"
            >
              {[...LEVEL_NAMES].reverse().map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="ニックネーム（任意）"
            maxLength={20}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 placeholder-gray-600 mb-2"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="掬い結果・現地の状況を投稿..."
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 resize-none h-16 placeholder-gray-600"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !body.trim() || !spotName.trim()}
              className="text-xs px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
