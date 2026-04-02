'use client'

import { useState, useEffect, useRef } from 'react'
import { SPOTS, LEVEL_NAMES, LEVEL_BG, LEVEL_TEXT } from '@/lib/forecast'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

const SAMPLE_POSTS: Post[] = [
  { id: '1', spot_name: '甲楽城漁港',  level: '大寄り',    body: '新月前夜、かなり寄りました！堤防際に多め。長柄タモ推奨です。', created_at: '2026-03-29T02:41:00Z' },
  { id: '2', spot_name: '越前漁港',    level: '寄り',      body: '断崖下の岩場周辺で確認できました。1時間で30匹ほど。光ってる個体もいて幻想的。', created_at: '2026-03-28T23:55:00Z' },
  { id: '3', spot_name: '香住港',      level: '寄りなし',  body: '月が明るくて全然ダメでした。新月狙いで出直します。', created_at: '2026-03-22T01:10:00Z' },
  { id: '4', spot_name: '浜坂漁港',    level: 'チョイ寄り', body: '港の外側堤防で少し確認。また来月リベンジ！', created_at: '2026-03-20T03:15:00Z' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props { spots: typeof SPOTS }

export default function BulletinBoard({ spots }: Props) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
  const [spotName, setSpotName] = useState('')
  const [nickname, setNickname] = useState('')
  const [level, setLevel] = useState<string>(LEVEL_NAMES[3])
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setPosts(data) })
      .catch(() => {})
  }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('post-images')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) return null
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit() {
    if (!body.trim() || !spotName.trim()) return
    setSubmitting(true)
    setError('')
    try {
      let image_url: string | null = null
      if (imageFile) {
        setUploading(true)
        image_url = await uploadImage(imageFile)
        setUploading(false)
        if (!image_url) {
          setError('画像のアップロードに失敗しました')
          setSubmitting(false)
          return
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spot_name: spotName, level, body, nickname, image_url }),
      })
      if (res.ok) {
        const newPost: Post = await res.json()
        setPosts(prev => [newPost, ...prev])
      } else {
        const tempPost: Post = {
          id: Date.now().toString(),
          spot_name: spotName,
          level,
          body,
          nickname: nickname.trim() || undefined,
          image_url: image_url ?? undefined,
          created_at: new Date().toISOString(),
        }
        setPosts(prev => [tempPost, ...prev])
      }
      setBody('')
      removeImage()
    } catch {
      setError('投稿に失敗しました')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <section>
      <p className="section-title mb-3">🌊 現地レポート掲示板</p>
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(0,180,220,0.12)' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#c0e8f8' }}>現地情報シェア</span>
          <span style={{ color: 'rgba(0,180,220,0.4)', fontSize: '0.7rem' }}>{posts.length}件</span>
        </div>

        {/* 投稿一覧 */}
        <div>
          {posts.map((p, idx) => {
            const lvIdx = LEVEL_NAMES.indexOf(p.level as typeof LEVEL_NAMES[number])
            const bg = lvIdx >= 0 ? LEVEL_BG[lvIdx] : 'rgba(42,58,74,0.2)'
            const tc = lvIdx >= 0 ? LEVEL_TEXT[lvIdx] : '#4a6070'
            return (
              <div
                key={p.id}
                className="px-4 py-3.5"
                style={{ borderBottom: idx < posts.length - 1 ? '1px solid rgba(0,150,180,0.08)' : 'none' }}
              >
                {/* メタ行 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{
                    background: 'rgba(0,150,200,0.12)',
                    border: '1px solid rgba(0,180,220,0.25)',
                    color: '#5bc8e8',
                    fontSize: '0.65rem',
                    padding: '1px 8px',
                    borderRadius: 999,
                    fontWeight: 500,
                  }}>
                    {p.spot_name}
                  </span>
                  {p.nickname && (
                    <span style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', fontWeight: 600 }}>
                      {p.nickname}
                    </span>
                  )}
                  <span style={{ color: 'rgba(0,150,180,0.35)', fontSize: '0.62rem', marginLeft: 'auto' }}>
                    {formatTime(p.created_at)}
                  </span>
                </div>
                {/* 本文 */}
                <p style={{ color: 'rgba(200,230,245,0.8)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 8 }}>
                  {p.body}
                </p>
                {/* 写真 */}
                {p.image_url && (
                  <a href={p.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                    <img
                      src={p.image_url}
                      alt="現地写真"
                      className="rounded-xl object-cover"
                      style={{ maxHeight: 200, border: '1px solid rgba(0,180,220,0.2)' }}
                    />
                  </a>
                )}
                {/* レベルバッジ */}
                <span style={{
                  background: bg,
                  color: tc,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `1px solid ${tc}44`,
                }}>
                  {p.level}
                </span>
              </div>
            )
          })}
        </div>

        {/* 投稿フォーム */}
        <div style={{ borderTop: '1px solid rgba(0,180,220,0.12)', padding: '16px', background: 'rgba(0,10,30,0.4)' }}>
          <datalist id="spot-suggestions">
            {spots.map(s => <option key={s.id} value={s.name}>{s.pref} — {s.desc}</option>)}
          </datalist>

          {/* 場所・湧き具合 */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              list="spot-suggestions"
              value={spotName}
              onChange={e => setSpotName(e.target.value)}
              placeholder="場所（例：越前漁港、地元の港など）"
              maxLength={50}
              style={{
                flex: 1,
                background: 'rgba(0,30,60,0.7)',
                border: '1px solid rgba(0,180,220,0.2)',
                color: '#c0e0f0',
                fontSize: '0.72rem',
                borderRadius: 8,
                padding: '6px 10px',
                outline: 'none',
              }}
            />
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              style={{
                background: 'rgba(0,30,60,0.7)',
                border: '1px solid rgba(0,180,220,0.2)',
                color: '#c0e0f0',
                fontSize: '0.72rem',
                borderRadius: 8,
                padding: '6px 8px',
                outline: 'none',
              }}
            >
              {[...LEVEL_NAMES].reverse().map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* ニックネーム */}
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="ニックネーム（任意）"
            maxLength={20}
            style={{
              width: '100%',
              background: 'rgba(0,30,60,0.7)',
              border: '1px solid rgba(0,180,220,0.2)',
              color: '#c0e0f0',
              fontSize: '0.72rem',
              borderRadius: 8,
              padding: '6px 10px',
              outline: 'none',
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />

          {/* コメント */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="掬い結果・現地の状況を投稿..."
            style={{
              width: '100%',
              background: 'rgba(0,30,60,0.7)',
              border: '1px solid rgba(0,180,220,0.2)',
              color: '#c0e0f0',
              fontSize: '0.8rem',
              borderRadius: 8,
              padding: '8px 10px',
              resize: 'none',
              height: 64,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* 写真添付 */}
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleImageChange}
              className="hidden"
              id="photo-input"
            />
            {!imagePreview ? (
              <label
                htmlFor="photo-input"
                className="inline-flex items-center gap-1.5 cursor-pointer transition-all"
                style={{
                  color: 'rgba(0,180,220,0.45)',
                  border: '1px solid rgba(0,180,220,0.18)',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: '0.68rem',
                }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                写真を添付
              </label>
            ) : (
              <div className="relative inline-block">
                <img src={imagePreview} alt="プレビュー" style={{ height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0,180,220,0.25)' }} />
                <button
                  onClick={removeImage}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18,
                    background: 'rgba(0,30,60,0.9)',
                    border: '1px solid rgba(0,180,220,0.3)',
                    borderRadius: 999,
                    color: '#00c8e8',
                    fontSize: '0.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >✕</button>
              </div>
            )}
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: 4 }}>{error}</p>}

          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !body.trim() || !spotName.trim()}
              style={{
                fontSize: '0.72rem',
                padding: '7px 18px',
                borderRadius: 9,
                fontWeight: 600,
                transition: 'all 0.2s',
                cursor: submitting || !body.trim() || !spotName.trim() ? 'not-allowed' : 'pointer',
                background: submitting || !body.trim() || !spotName.trim()
                  ? 'rgba(0,80,100,0.3)'
                  : 'linear-gradient(135deg, rgba(0,180,220,0.25), rgba(0,229,255,0.18))',
                border: '1px solid',
                borderColor: submitting || !body.trim() || !spotName.trim()
                  ? 'rgba(0,150,180,0.15)'
                  : 'rgba(0,229,255,0.4)',
                color: submitting || !body.trim() || !spotName.trim()
                  ? 'rgba(0,180,220,0.3)'
                  : '#00e5ff',
                boxShadow: submitting || !body.trim() || !spotName.trim()
                  ? 'none'
                  : '0 0 12px rgba(0,229,255,0.15)',
              }}
            >
              {uploading ? '📤 アップ中...' : submitting ? '送信中...' : '🌊 投稿する'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
