import React from "react"
import StarryBackground from "@/components/StarryBackground"
import SquidSwarm from "@/components/SquidSwarm"
import ScoreCard, { ScoreBreakdown } from "@/components/ScoreCard"
import SpotCard, { SpotData } from "@/components/SpotCard"
import { fetchWeather, buildForecast, moonAge, SPOTS } from "./page"

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
  const score = Math.round(forecast.score ?? 0)

  return (
    <>
      <StarryBackground />
      <SquidSwarm score={score} />

      <main
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 680,
          margin: "0 auto",
          padding: "36px 20px 80px",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Content */}
        <ScoreCard
          score={score}
          breakdown={{ moon: 50, weather: 60, wave: 70, time: 80 }}
        />
        <SpotCard spot={SPOTS[0] as SpotData} />
      </main>
    </>
  )
}
