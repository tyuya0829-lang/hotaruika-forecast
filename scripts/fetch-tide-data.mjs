/**
 * 気象庁 潮位推算値テキスト取得・パーススクリプト
 * 富山（点番号 0171）2026年3〜5月分
 *
 * 使い方: npm run fetch-tide
 * 出力:  public/data/tide-2026.json
 *
 * JMA suisan フォーマット（固定幅テキスト）:
 *   行1: 観測点番号 年 月
 *   以降: 日  h00 h01 ... h23  （単位: cm, 東京湾中等潮位基準）
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dirname, '..', 'public', 'data', 'tide-2026.json')
const BASE_URL = 'https://www.data.jma.go.jp/gmd/kaiyou/data/db/tide/suisan/txt/2026/TK0171.txt'

/** テキストを月別・日別に分割してパース */
function parseTideText(text) {
  const result = {}
  const lines = text.split('\n').map(l => l.trimEnd())

  let currentYear = null
  let currentMonth = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // ヘッダー行: 観測点番号 年 月 (例: "  0171 2026  3")
    const headerMatch = trimmed.match(/^0*(\d{3,4})\s+(\d{4})\s+(\d{1,2})\s*$/)
    if (headerMatch) {
      currentYear  = parseInt(headerMatch[2])
      currentMonth = parseInt(headerMatch[3])
      continue
    }

    if (!currentYear || !currentMonth) continue

    // データ行: 日 h00 h01 ... h23 (24個の数値)
    const tokens = trimmed.split(/\s+/)
    if (tokens.length < 5) continue          // データ行でなければスキップ

    const day = parseInt(tokens[0])
    if (isNaN(day) || day < 1 || day > 31) continue

    const heights = tokens.slice(1).map(Number).filter(n => !isNaN(n))
    if (heights.length < 12) continue        // 不完全な行はスキップ

    // シーズン外はスキップ（3〜5月のみ保存してファイルサイズを最小化）
    if (currentMonth < 3 || currentMonth > 5) continue

    const mm = String(currentMonth).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const dateKey = `${currentYear}-${mm}-${dd}`

    result[dateKey] = heights.map((height, h) => ({
      time: `${String(h).padStart(2, '0')}:00`,
      height,
    }))
  }

  return result
}

async function main() {
  console.log('📡 気象庁 潮位推算値データを取得中...')
  console.log(`   URL: ${BASE_URL}`)

  let text
  try {
    const res = await fetch(BASE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // Shift_JIS → UTF-8 変換（Node 18+ の TextDecoder 使用）
    const buf = await res.arrayBuffer()
    const decoder = new TextDecoder('shift_jis')
    text = decoder.decode(buf)
  } catch (e) {
    console.error('❌ 取得失敗:', e.message)
    console.error('   ネットワーク環境を確認してください。')
    process.exit(1)
  }

  console.log('🔍 パース中...')
  const tideData = parseTideText(text)

  const days = Object.keys(tideData).length
  if (days === 0) {
    console.error('❌ データを1件もパースできませんでした。フォーマットを確認してください。')
    console.error('--- テキスト先頭 400 文字 ---')
    console.error(text.slice(0, 400))
    process.exit(1)
  }

  mkdirSync(join(__dirname, '..', 'public', 'data'), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(tideData, null, 2), 'utf-8')

  const months = [...new Set(Object.keys(tideData).map(d => d.slice(0, 7)))].join(', ')
  console.log(`✅ 完了: ${days}日分 (${months}) → ${OUTPUT}`)
}

main()
