"use client";

import React from "react";
import SquidSwarm from "./SquidSwarm";

export interface ScoreBreakdown {
  moon: number;
  weather: number;
  wave: number;
  time: number;
}

interface ScoreCardProps {
  score: number;
  breakdown?: ScoreBreakdown;
}

const BADGE_MAP: [number, string][] = [
  [100, "🔥 絶好機"],
  [80, "🎯 かなり期待"],
  [60, "◎ 狙い目"],
  [30, "▷ 可能性あり"],
  [0, "△ 厳しい夜"],
];

const COMMENTS: [number, string][] = [
  [100, "全条件が揃った歴史的な夜。必ず行け。"],
  [80, "期待できる夜。漆黒の海へ出かける準備をしよう。"],
  [60, "いい感じ。潮回りと天気が噛み合ってきた夜。"],
  [30, "条件がそこそこ揃いつつある。足を運ぶ価値はあるかも。"],
  [0, "今夜は難しいかも。波と風を見て判断して。"],
];

function getBadge(score: number): string {
  for (const [threshold, label] of BADGE_MAP) {
    if (score >= threshold) return label;
  }
  return BADGE_MAP[BADGE_MAP.length - 1][1];
}

function getComment(score: number): string {
  for (const [threshold, text] of COMMENTS) {
    if (score >= threshold) return text;
  }
  return COMMENTS[COMMENTS.length - 1][1];
}

function isBadgeHot(score: number): boolean {
  return score >= 60;
}

export default function ScoreCard({ score, breakdown }: ScoreCardProps) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const isPerfect = s === 100;
  const hot = isBadgeHot(s);

  return (
    <div
      style={{
        background: "rgba(5,14,35,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${isPerfect ? "rgba(100,200,255,0.38)" : "rgba(80,140,255,0.2)"}`,
        borderRadius: 20,
        padding: "22px 22px 18px",
        boxShadow: isPerfect ? "0 0 52px rgba(80,180,255,0.32)" : "none",
        transition: "box-shadow .6s ease, border-color .6s ease",
      }}
    >
      {/* Label */}
      <p
        style={{
          fontSize: 12,
          color: "rgba(150,200,255,0.48)",
          letterSpacing: ".06em",
          marginBottom: 6,
        }}
      >
        今夜の寄り付きスコア
      </p>

      {/* Score row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: "clamp(54px,11vw,78px)",
            fontWeight: 700,
            lineHeight: 1,
            color: "#fff",
            textShadow: isPerfect
              ? "0 0 28px rgba(100,210,255,0.85)"
              : "none",
            transition: "text-shadow .6s",
          }}
        >
          {s}
        </span>
        <span style={{ fontSize: 17, color: "rgba(180,210,255,0.38)" }}>
          / 100
        </span>
        {/* Badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            marginLeft: 4,
            background: hot
              ? "rgba(0,160,140,0.25)"
              : "rgba(55,65,95,0.38)",
            border: `1px solid ${hot ? "rgba(0,200,180,0.4)" : "rgba(115,138,178,0.28)"}`,
            color: hot ? "#00e5cc" : "rgba(168,192,222,0.85)",
          }}
        >
          {getBadge(s)}
        </span>
      </div>

      {/* Glow bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "rgba(255,255,255,0.07)",
          marginBottom: 10,
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${s}%`,
            borderRadius: 3,
            background:
              "linear-gradient(90deg,rgba(0,100,230,0.55),rgba(80,210,255,1))",
            position: "relative",
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {/* Knob glow */}
          {s > 0 && (
            <span
              style={{
                position: "absolute",
                right: -1,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#b8ecff",
                boxShadow:
                  "0 0 10px 3px rgba(120,210,255,0.9), 0 0 22px 8px rgba(70,170,255,0.5)",
                display: "block",
              }}
            />
          )}
        </div>
      </div>

      {/* Squid swarm inside card */}
      <div
        style={{
          height: 175,
          position: "relative",
          overflow: "hidden",
          margin: "6px 0 8px",
        }}
      >
        <SquidSwarm score={s} contained />
      </div>

      {/* Comment */}
      <p
        style={{
          fontSize: 13,
          color: "rgba(170,215,255,0.62)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {getComment(s)}
      </p>

      {/* Breakdown bars (optional) */}
      {breakdown && (
        <div
          style={{
            display: "flex",
            gap: 12,
            borderTop: "1px solid rgba(80,130,200,0.12)",
            paddingTop: 14,
            marginTop: 14,
          }}
        >
          {(
            [
              ["🌙 月齢", breakdown.moon],
              ["☁️ 気象", breakdown.weather],
              ["🌊 波高", breakdown.wave],
              ["🕐 時刻", breakdown.time],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(140,185,225,0.5)",
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: "rgba(100,160,255,0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${val}%`,
                    borderRadius: 2,
                    background: "rgba(100,180,255,0.5)",
                    transition: "width .8s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(160,200,240,0.45)",
                  marginTop: 2,
                  textAlign: "right",
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
