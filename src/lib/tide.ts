// ================================================================
// 潮位ユーティリティ  (tide-2026.json → 勝負時間計算)
// ================================================================

export interface TidePoint {
  time: string    // "HH:MM"
  height: number  // cm
}

export interface BattleWindow {
  start: string       // "HH:MM"
  end: string         // "HH:MM"
  peakHeight: number  // cm
  peakTime: string    // "HH:MM"
}

/** YYYY-MM-DD → その日の潮位配列（24点）を返す */
export function getDayTides(
  tideData: Record<string, TidePoint[]>,
  date: string,
): TidePoint[] {
  return tideData[date] ?? []
}

/**
 * 時刻文字列 "HH:MM" を分数（0〜1439）に変換
 */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** 分数 → "HH:MM" */
function fromMinutes(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * 線形補間で指定時刻の潮位を推定
 * tides は ["00:00","01:00",...] の1時間刻みを想定
 */
export function approxHeight(tides: TidePoint[], timeStr: string): number {
  if (!tides.length) return 0

  const targetMin = toMinutes(timeStr)

  // ちょうど一致する点があれば即返す
  const exact = tides.find(p => p.time === timeStr)
  if (exact) return exact.height

  // 前後の点を探して線形補間
  const sorted = [...tides].sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = toMinutes(sorted[i].time)
    const t1 = toMinutes(sorted[i + 1].time)
    if (targetMin >= t0 && targetMin <= t1) {
      const ratio = (targetMin - t0) / (t1 - t0)
      return Math.round(sorted[i].height + (sorted[i + 1].height - sorted[i].height) * ratio)
    }
  }

  // 範囲外なら最近傍
  const dists = sorted.map(p => ({ p, d: Math.abs(toMinutes(p.time) - targetMin) }))
  return dists.sort((a, b) => a.d - b.d)[0].p.height
}

/**
 * 夜間（21:00〜翌04:00）の満潮ピークを探し、±60分を勝負時間として返す。
 * 夜間に明確なピークがない場合は全時刻を対象に最大値を使用。
 * データなし → null
 */
export function calcBattleWindow(tides: TidePoint[]): BattleWindow | null {
  if (!tides.length) return null

  /** 夜間かどうか: 21:00〜23:59 または 00:00〜04:00 */
  const isNight = (t: string): boolean => {
    const m = toMinutes(t)
    return m >= 21 * 60 || m <= 4 * 60
  }

  const nightTides = tides.filter(p => isNight(p.time))
  const candidates = nightTides.length >= 3 ? nightTides : tides

  // 最大潮位の点を探す
  const peak = candidates.reduce((best, cur) =>
    cur.height > best.height ? cur : best,
    candidates[0],
  )

  const peakMin = toMinutes(peak.time)

  return {
    start:       fromMinutes(peakMin - 60),
    end:         fromMinutes(peakMin + 60),
    peakHeight:  peak.height,
    peakTime:    peak.time,
  }
}
