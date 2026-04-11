"use client";

import React from "react";
import { useRouter } from "next/navigation";

export interface SpotWeather {
  temp: number;
  windSpeed: number;
  windDir: string;
  waveHeight: number;
  weatherCode: number;
}

export interface SpotData {
  id: string;
  name: string;
  region: string;
  score: number;
  weather?: SpotWeather;
}

// WMO weather code → emoji + label
function weatherInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "快晴" };
  if (code <= 3) return { icon: "☁️", label: "曇り" };
  if (code <= 49) return { icon: "🌫️", label: "霧" };
  if (code <= 67) return { icon: "🌧️", label: "小雨" };
  if (code <= 77) return { icon: "🌨️", label: "雪" };
  if (code <= 82) return { icon: "🌦️", label: "にわか雨" };
  if (code <= 99) return { icon: "⛈️", label: "雷雨" };
  return { icon: "❓", label: "不明" };
}

function getStatusBadge(score: number): { label: string; hot: boolean } {
  if (score >= 80) return { label: "◎ 狙い目", hot: true };
  if (score >= 60) return { label: "◎ 狙い目", hot: true };
  if (score >= 40) return { label: "△ 様子見", hot: false };
  return { label: "✕ 難しい", hot: false };
}

// Wind speed threshold for amber warning
function isHighWind(speed: number): boolean {
  return speed >= 6;
}
function isHighWave(height: number): boolean {
  return height >= 0.8;
}

interface WxBoxProps {
  icon: string;
  value: string;
  sub: string;
  color?: "cyan" | "amber" | "default";
}

function WxBox({ icon, value, sub, color = "default" }: WxBoxProps) {
  const valueColor =
    color === "cyan"
      ? "#38d9f5"
      : color === "amber"
      ? "#f5a623"
      : "#ffffff";

  return (
    <div
      style={{
        background: "rgba(8,18,50,0.68)",
        border: "1px solid rgba(55,95,175,0.18)",
        borderRadius: 12,
        padding: "14px 8px 11px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1, marginBottom: 3 }}>{icon}</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.2,
          color: valueColor,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "rgba(130,175,215,0.48)",
          marginTop: 2,
        }}
      >
        {sub}
      </span>
    </div>
  );
}

interface SpotCardProps {
  spot: SpotData;
}

export default function SpotCard({ spot }: SpotCardProps) {
  const router = useRouter();
  const { label: badgeLabel, hot } = getStatusBadge(spot.score);
  const wx = spot.weather ? weatherInfo(spot.weather.weatherCode) : null;

  return (
    <div
      onClick={() => router.push(`/spots/${spot.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/spots/${spot.id}`)}
      style={{
        background: "rgba(5,14,35,0.78)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(80,140,255,0.18)",
        borderRadius: 16,
        padding: "18px 18px 16px",
        cursor: "pointer",
        transition: "border-color .2s ease, background .2s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(100,180,255,0.35)";
        el.style.background = "rgba(6,18,46,0.88)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(80,140,255,0.18)";
        el.style.background = "rgba(5,14,35,0.78)";
      }}
    >
      {/* Header: name + status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 13,
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 19,
            fontWeight: 600,
            color: "rgba(220,238,255,0.95)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {spot.name}
          {spot.region && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 400,
                color: "rgba(150,195,240,0.55)",
                marginLeft: 6,
              }}
            >
              （{spot.region}）
            </span>
          )}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: hot
              ? "rgba(0,160,140,0.25)"
              : "rgba(55,65,95,0.38)",
            border: `1px solid ${hot ? "rgba(0,200,180,0.38)" : "rgba(115,138,178,0.28)"}`,
            color: hot ? "#00e5cc" : "rgba(168,192,222,0.85)",
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Weather boxes */}
      {spot.weather && wx && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 9,
          }}
        >
          <WxBox
            icon="🌡️"
            value={`${spot.weather.temp.toFixed(0)}°C`}
            sub="気温"
          />
          <WxBox
            icon="🌬️"
            value={`${spot.weather.windDir} ${spot.weather.windSpeed.toFixed(0)}m`}
            sub="風向・風速"
            color={isHighWind(spot.weather.windSpeed) ? "amber" : "cyan"}
          />
          <WxBox
            icon="🌊"
            value={`${spot.weather.waveHeight.toFixed(1)}m`}
            sub="波高"
            color={isHighWave(spot.weather.waveHeight) ? "cyan" : "default"}
          />
          <WxBox
            icon={wx.icon}
            value={wx.label}
            sub="天気"
          />
        </div>
      )}
    </div>
  );
}
