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
    <main className="relative min-h-screen text-gray-100" style={{ zIndex: 1 }}>

      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, rgba(3,7,26,0.97) 0%, rgba(5,12,36,0.92) 100%)',
          borderBottom: '1px solid rgba(0,180,220,0.18)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,180,220,0.06)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl squid-glow select-none">🦑</span>
            <div>
              <span
                className="font-bold text-sm tracking-wide"
                style={{
                  background: 'linear-gradient(90deg, #e0f7ff 0%, #00e5ff 50%, #1bffd7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ホタルイカ予報
              </span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(0,180,220,0.12)',
                border: '1px solid rgba(0,229,255,0.25)',
                color: '#00c8e8',
              }}
            >
              兵庫・鳥取・福井版
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="live-dot inline-block"
              style={{ width: 6, height: 6, background: '#00e5ff' }}
            />
            <span className="text-xs" style={{ color: 'rgba(0,200,230,0.6)' }}>Open-Meteo LIVE</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="py-16 text-center" style={{ color: 'rgba(0,200,230,0.4)' }}>
              <span className="squid-glow inline-block text-3xl mb-3">🦑</span>
              <p className="text-sm tracking-widest">海から予報を取得中...</p>
            </div>
          }
        >
          <ForecastClient
            initialForecast={forecast}
            initialSpot={defaultSpot}
            currentMoonAge={curAge}
            daysToNewMoon={dToNew}
          />
        </Suspense>
      </div>

      {/* フッター */}
      <footer className="mt-16 pb-10">
        <div className="ocean-divider mx-4 mb-6" />
        <div
          className="max-w-3xl mx-auto px-4 text-xs leading-7 text-center"
          style={{ color: 'rgba(0,180,220,0.35)' }}
        >
          天気データ:{' '}
          <a
            href="https://open-meteo.com"
            style={{ color: 'rgba(0,200,230,0.5)' }}
            className="hover:opacity-80 transition-opacity"
          >
            Open-Meteo API
          </a>
          （CC BY 4.0）／ 月齢：天文計算 ／ 予報は参考値です
          <br />
          シーズン：3〜5月 ／ 掬い時間：深夜0時〜夜明け ／ ウェーダー・ライフジャケット着用必須
        </div>
      </footer>
    </main>
  )
}
