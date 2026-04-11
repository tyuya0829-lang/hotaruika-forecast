import React from "react";
import Link from "next/link";
import StarryBackground from "@/components/StarryBackground";
import ScoreCard, { ScoreBreakdown } from "@/components/ScoreCard";
import SpotCard, { SpotData } from "@/components/SpotCard";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────

interface RawForecast {
  spot_id: string;
  score: number;
  moon_score: number;
  weather_score: number;
  wave_score: number;
  time_score: number;
  temp: number;
  wind_speed: number;
  wind_dir: string;
  wave_height: number;
  weather_code: number;
}

interface RawSpot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
}

// ─── Moon age helper ─────────────────────────────────

function getMoonAge(): { age: number; daysToNew: number } {
  const now = new Date();
  const knownNew = new Date("2024-01-11T11:57:00Z");
  const lunation = 29.53059;
  const diffDays = (now.getTime() - knownNew.getTime()) / 86400000;
  const age = ((diffDays % lunation) + lunation) % lunation;
  const daysToNew = lunation - age;
  return {
    age: Math.round(age * 10) / 10,
    daysToNew: Math.round(daysToNew),
  };
}

function moonEmoji(age: number): string {
  const phase = age / 29.53;
  if (phase < 0.03 || phase > 0.97) return "🌑";
  if (phase < 0.22) return "🌒";
  if (phase < 0.28) return "🌓";
  if (phase < 0.47) return "🌔";
  if (phase < 0.53) return "🌕";
  if (phase < 0.72) return "🌖";
  if (phase < 0.78) return "🌗";
  return "🌘";
}

// ─── Data fetching ────────────────────────────────────

async function fetchTopScore(): Promise<{
  score: number;
  breakdown: ScoreBreakdown;
}> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("forecasts")
      .select("score, moon_score, weather_score, wave_score, time_score")
      .eq("date", today)
      .order("score", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      return {
        score: data.score ?? 0,
        breakdown: {
          moon: data.moon_score ?? 0,
          weather: data.weather_score ?? 0,
          wave: data.wave_score ?? 0,
          time: data.time_score ?? 0,
        },
      };
    }
  } catch { /* fallback */ }
  return { score: 0, breakdown: { moon: 0, weather: 0, wave: 0, time: 0 } };
}

async function fetchSpots(): Promise<SpotData[]> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data: spots } = await supabase
      .from("spots")
      .select("id, name, region, lat, lng");
    if (!spots) return [];

    const ids = (spots as RawSpot[]).map((s) => s.id);
    const { data: forecasts } = await supabase
      .from("forecasts")
      .select("spot_id, score, temp, wind_speed, wind_dir, wave_height, weather_code")
      .eq("date", today)
      .in("spot_id", ids);

    const fcMap = new Map<string, RawForecast>(
      ((forecasts ?? []) as RawForecast[]).map((f) => [f.spot_id, f])
    );

    return (spots as RawSpot[])
      .map((spot): SpotData => {
        const fc = fcMap.get(spot.id);
        return {
          id: spot.id,
          name: spot.name,
          region: spot.region,
          score: fc?.score ?? 0,
          weather: fc
            ? {
                temp: fc.temp,
                windSpeed: fc.wind_speed,
                windDir: fc.wind_dir,
                waveHeight: fc.wave_height,
                weatherCode: fc.weather_code,
              }
            : undefined,
        };
      })
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

// ─── Tidal times (static until real API is connected) ─

const TIDAL_TIMES = [
  { t: "22:00", l: "準備", active: false },
  { t: "23:30", l: "最高潮", active: true },
  { t: "01:00", l: "引き際", active: false },
];

// ─── Page ─────────────────────────────────────────────

export default async function HomePage() {
  const [{ score, breakdown }, spots] = await Promise.all([
    fetchTopScore(),
    fetchSpots(),
  ]);

  const { age: moonAge, daysToNew } = getMoonAge();
  const moon = moonEmoji(moonAge);

  return (
    <>
      {/* z-0 background */}
      <StarryBackground />

      {/* z-10 content */}
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
        {/* ── Header ── */}
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: ".22em",
              color: "rgba(100,200,255,0.5)",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Firefly Squid Forecast
          </p>
          <h1
            style={{
              fontSize: "clamp(26px,6vw,38px)",
              fontWeight: 700,
              letterSpacing: ".03em",
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            ホタルイカ 寄り付き予報
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(150,200,255,0.5)",
              letterSpacing: ".04em",
            }}
          >
            今夜、海が光るかもしれない
          </p>
        </header>

        {/* ── Moon badge ── */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(20,40,80,0.65)",
              border: "1px solid rgba(100,160,255,0.22)",
              borderRadius: 40,
              padding: "8px 20px",
              fontSize: 13,
              color: "rgba(200,228,255,0.82)",
              backdropFilter: "blur(8px)",
            }}
          >
            {moon} 月齢 {moonAge}　新月まで{daysToNew}日
          </span>
        </div>

        {/* ── Score card (contains SquidSwarm) ── */}
        <div style={{ marginBottom: 26 }}>
          <ScoreCard score={score} breakdown={breakdown} />
        </div>

        {/* ── Spot list ── */}
        <section>
          <p
            style={{
              fontSize: 12,
              color: "rgba(110,175,255,0.48)",
              letterSpacing: ".12em",
              marginBottom: 13,
            }}
          >
            おすすめスポット
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 26 }}>
            {spots.length > 0 ? (
              spots.map((spot) => <SpotCard key={spot.id} spot={spot} />)
            ) : (
              <p style={{ fontSize: 14, color: "rgba(140,185,225,0.4)" }}>
                スポット情報を取得できませんでした。
              </p>
            )}
          </div>
        </section>

        {/* ── Tidal times ── */}
        <section style={{ marginBottom: 22 }}>
          <p
            style={{
              fontSize: 12,
              color: "rgba(110,175,255,0.48)",
              letterSpacing: ".12em",
              marginBottom: 13,
            }}
          >
            今夜の勝負時間
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 10,
            }}
          >
            {TIDAL_TIMES.map(({ t, l, active }) => (
              <div
                key={t}
                style={{
                  background: active ? "rgba(0,95,150,0.28)" : "rgba(5,14,35,0.6)",
                  border: `1px solid ${active ? "rgba(0,175,220,0.42)" : "rgba(60,100,180,0.2)"}`,
                  borderRadius: 14,
                  padding: "15px 10px",
                  textAlign: "center",
                  boxShadow: active ? "0 0 16px rgba(0,155,200,0.18)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: active ? "#5cdeff" : "#fff",
                    lineHeight: 1.1,
                  }}
                >
                  {t}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(135,175,215,0.52)",
                    marginTop: 4,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <Link
          href={spots.length > 0 ? `/spots/${spots[0].id}` : "/spots"}
          style={{
            display: "block",
            width: "100%",
            padding: "17px 20px",
            background: "rgba(5,18,45,0.7)",
            border: "1px solid rgba(80,140,255,0.22)",
            borderRadius: 50,
            color: "rgba(200,228,255,0.88)",
            fontSize: 15,
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
            letterSpacing: ".04em",
            boxSizing: "border-box",
          }}
        >
          今夜の詳細予報を見る →
        </Link>
      </main>
    </>
  );
}
