import { Suspense } from 'react'
import { fetchWeather, buildForecast, moonAge, SPOTS } from '@/lib/forecast'
import ForecastClient from '@/components/ForecastClient'

export const revalidate = 3600

export default async function Home() {
  const defaultSpot = SPOTS[0]
  let weatherData = null
  try {
    weatherData = await fetchWeather(defaultSpot.lat, defaultSpot.lon)
  } catch { /* 月齢のみで予報 */ }

  const forecast = buildForecast(weatherData)
  const today = new Date()
  const curAge = moonAge(today)
  const dToNew = Math.min(curAge, 29.53 - curAge)

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦑</span>
            <span className="font-semibold text-white text-sm tracking-tight">ホタルイカ予報</span>
            <span className="text-xs bg-teal-900/60 text-teal-400 px-2 py-0.5 rounded-full border border-teal-800">兵庫・鳥取・福井版</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse inline-block" />
            <span>Open-Meteo LIVE</span>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-gray-500 text-sm py-8 text-center">データ取得中...</div>}>
          <ForecastClient
            initialForecast={forecast}
            initialSpot={defaultSpot}
            currentMoonAge={curAge}
            daysToNewMoon={dToNew}
          />
        </Suspense>
      </div>
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-5 text-xs text-gray-600 leading-6">
          天気データ: <a href="https://open-meteo.com" className="text-gray-500 hover:text-gray-400">Open-Meteo API</a>（CC BY 4.0）/ 月齢: 天文計算 / 予報は参考値です<br />
          シーズン：3〜5月 ／ 掬い時間：深夜0時〜夜明け ／ ウェーダー・ライフジャケット着用必須
        </div>
      </footer>
    </main>
  )
}
