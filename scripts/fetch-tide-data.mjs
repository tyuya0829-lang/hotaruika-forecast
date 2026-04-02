/**
 * 気象庁 潮位推算値テキスト取得・パーススクリプト
 * 浜坂（TK0261）2026年3〜5月分
 *
 * 使い方: npm run fetch-tide
 * 出力:  public/data/tide-2026.json
 *
 * JMA suisan フォーマット（固定幅テキスト）:
 *   各行: 24×3文字の潮位(cm) + 6文字のYYMMDD + 2文字の観測点コード
 *   例: " 97 89 79 68 56 43 30 18  8  1  0  4 13 26 42 57 69 77 80 78 70 58 44 30261012TK"
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dirname, '..', 'public', 'data', 'tide-2026.json')

// 浜坂観測点 TK0261
// ※ gmd/ なしのパスが正しい場合は下記を変更してください
const BASE_URL = 'https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/2026/TK0261.txt'
const FALLBACK_URL = 'https://www.data.jma.go.jp/gmd/kaiyou/data/db/tide/suisan/txt/2026/TK0261.txt'

/**
 * 固定幅フォーマットの1行をパース
 * 行フォーマット: 3文字×24時間の潮位 + 2桁年 + 2桁月 + 2桁日 + 2文字局コード
 * 全長 = 72 + 6 + 2 = 80文字
 */
function parseLine(line) {
  if (line.length < 78) return null

  // 潮位: 先頭72文字を3文字ずつ
  const heights = []
  for (let i = 0; i < 24; i++) {
    const val = parseInt(line.slice(i * 3, i * 3 + 3).trim(), 10)
    if (isNaN(val)) return null
    heights.push(val)
  }

  // 日付: 位置72〜77 (YYMMDD)
  const yy = parseInt(line.slice(72, 74), 10)
  const mm = parseInt(line.slice(74, 76), 10)
  const dd = parseInt(line.slice(76, 78), 10)

  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  const year = 2000 + yy
  return { year, month: mm, day: dd, heights }
}

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  // Shift_JIS → UTF-8
  try {
    const decoder = new TextDecoder('shift_jis')
    return decoder.decode(buf)
  } catch {
    return new TextDecoder('utf-8').decode(buf)
  }
}

async function main() {
  console.log('📡 気象庁 潮位推算値データを取得中（浜坂 TK0261）...')

  let text
  for (const url of [BASE_URL, FALLBACK_URL]) {
    try {
      console.log(`   URL: ${url}`)
      text = await fetchText(url)
      console.log(`   ✓ 取得成功 (${text.length} 文字)`)
      break
    } catch (e) {
      console.warn(`   ✗ 失敗: ${e.message}`)
    }
  }

  if (!text) {
    console.error('❌ 両URLとも取得失敗。ネットワーク環境を確認してください。')
    console.error('   ヒント: このスクリプトは直接実行できない場合、Chromeブラウザ経由で取得してください。')
    process.exit(1)
  }

  console.log('🔍 パース中...')
  const result = {}
  const lines = text.split('\n').map(l => l.trimEnd())

  for (const line of lines) {
    if (!line.trim()) continue

    const parsed = parseLine(line)
    if (!parsed) continue

    const { year, month, day, heights } = parsed

    // シーズン外はスキップ（3〜5月のみ保存）
    if (month < 3 || month > 5) continue

    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result[dateKey] = heights.map((height, h) => ({
      time: `${String(h).padStart(2, '0')}:00`,
      height,
    }))
  }

  const days = Object.keys(result).length
  if (days === 0) {
    console.error('❌ データを1件もパースできませんでした。')
    console.error('--- テキスト先頭 400 文字 ---')
    console.error(text.slice(0, 400))
    process.exit(1)
  }

  mkdirSync(join(__dirname, '..', 'public', 'data'), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf-8')

  const months = [...new Set(Object.keys(result).map(d => d.slice(0, 7)))].sort().join(', ')
  console.log(`✅ 完了: ${days}日分 (${months}) → ${OUTPUT}`)
}

main()
