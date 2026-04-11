"use client";

import React, { useEffect, useRef, useState } from "react";

interface SquidConfig {
  id: number;
  px: number;   // % left
  py: number;   // % top
  size: number;
  color: string;
  period: number;
  delay: number;
  swimDur: number;
  swimDelay: number;
  layer: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function SquidSVG({
  size,
  color,
  glowActive,
}: {
  size: number;
  color: string;
  glowActive: boolean;
}) {
  const hw = size * 0.28;
  const hh = size * 0.42;
  const dotR = size * 0.055;
  const dotY = hh * 0.35;
  const tentacles: [number, number][] = [
    [-hw * 0.8, -hh - size * 0.18],
    [-hw * 0.3, -hh - size * 0.22],
    [hw * 0.3, -hh - size * 0.22],
    [hw * 0.8, -hh - size * 0.18],
  ];
  const glowColor = glowActive
    ? "rgba(180,225,255,1)"
    : "rgba(175,218,255,0.72)";
  const glowFilter = glowActive
    ? "drop-shadow(0 0 5px rgba(140,220,255,0.95))"
    : undefined;

  return (
    <g>
      {tentacles.map(([dx, dy], i) => (
        <path
          key={i}
          d={`M 0 ${-hh} Q ${dx * 0.5} ${-hh - size * 0.05} ${dx} ${dy}`}
          stroke={color}
          strokeWidth={size * 0.058}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={0} cy={0} rx={hw} ry={hh} fill={color} />
      <ellipse
        cx={0}
        cy={-hh + size * 0.06}
        rx={hw * 0.45}
        ry={size * 0.08}
        fill={color}
      />
      <circle
        cx={-hw * 0.35}
        cy={dotY}
        r={dotR}
        fill={glowColor}
        style={{ filter: glowFilter }}
      />
      <circle
        cx={hw * 0.35}
        cy={dotY}
        r={dotR}
        fill={glowColor}
        style={{ filter: glowFilter }}
      />
    </g>
  );
}

interface SquidSwarmProps {
  score: number;
  /** true when rendered inside ScoreCard (position:absolute, fills parent) */
  contained?: boolean;
}

const SQUID_N = 36;

export default function SquidSwarm({ score: scoreProp, contained = false }: SquidSwarmProps) {
  const score = Math.max(0, Math.min(100, scoreProp));
  const isPerfect = score === 100;
  const swimmedIn = useRef(false);
  const [ready, setReady] = useState(false);

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const configsRef = useRef<SquidConfig[]>([]);
  if (configsRef.current.length === 0) {
    const t = score / 100;
    configsRef.current = Array.from({ length: SQUID_N }, (_, i) => {
      const layer = i < SQUID_N / 2 ? 0 : 1;
      const sf = layer === 1 ? lerp(0.65, 1.0, t) : lerp(0.45, 0.75, t);
      const base = lerp(22, 44, t);
      const size = base * sf;
      const r = Math.floor(138 + Math.random() * 40);
      const g = Math.floor(27 + Math.random() * 30);
      const b = Math.floor(12 + Math.random() * 16);
      const alpha = 0.44 + t * 0.12;
      return {
        id: i,
        px: 7 + Math.random() * 86,
        py: 8 + Math.random() * 80,
        size,
        color: `rgba(${r},${g},${b},${alpha.toFixed(2)})`,
        period: 1.2 + Math.random() * 0.7,
        delay: i * 0.022,
        swimDur: 8 + Math.random() * 6,
        swimDelay: Math.random() * 2.5,
        layer,
      };
    });
  }

  useEffect(() => {
    if (!swimmedIn.current) {
      swimmedIn.current = true;
      setReady(true);
    }
  }, []);

  const containerStyle: React.CSSProperties = contained
    ? { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }
    : { position: "fixed", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none" };

  return (
    <div aria-hidden style={containerStyle}>
      <style>{`
        @keyframes sqSqueeze { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(0.75)} }
        @keyframes sqBlink   { from{opacity:1} to{opacity:0.15} }
        @media (prefers-reduced-motion: reduce) {
          .sq-inner { animation: none !important; }
          .sq-swim  { transform: translateX(0) !important; transition: none !important; }
        }
      `}</style>

      {configsRef.current
        .slice()
        .sort((a, b) => a.layer - b.layer)
        .map((sq) => {
          const finalPx = isPerfect
            ? 18 + (sq.id % 9) * 7.5
            : sq.px;
          const finalPy = isPerfect
            ? 10 + Math.floor(sq.id / 9) * 24
            : sq.py;

          const swimStyle: React.CSSProperties =
            !prefersReduced && !ready
              ? { transform: "translateX(110vw)" }
              : {};

          const transitionStyle =
            !prefersReduced && !ready
              ? {
                  transition: `transform ${sq.swimDur}s ${sq.swimDelay}s ease-out, left 1.3s ease, top 1.3s ease`,
                }
              : { transition: "left 1.3s ease, top 1.3s ease" };

          return (
            <div
              key={sq.id}
              className="sq-swim"
              style={{
                position: "absolute",
                left: `${finalPx}%`,
                top: `${finalPy}%`,
                width: sq.size,
                height: sq.size,
                zIndex: sq.layer,
                ...swimStyle,
                ...transitionStyle,
              }}
            >
              <div
                className="sq-inner"
                style={{
                  width: "100%",
                  height: "100%",
                  transformOrigin: "center",
                  animation: `sqSqueeze ${sq.period}s ${sq.delay}s ease-in-out infinite`,
                }}
              >
                <svg
                  width={sq.size}
                  height={sq.size}
                  viewBox={`${-sq.size / 2} ${-sq.size / 2} ${sq.size} ${sq.size}`}
                  overflow="visible"
                  style={
                    isPerfect
                      ? { animation: "sqBlink 0.4s alternate infinite" }
                      : undefined
                  }
                >
                  <SquidSVG
                    size={sq.size * 0.9}
                    color={sq.color}
                    glowActive={isPerfect}
                  />
                </svg>
              </div>
            </div>
          );
        })}
    </div>
  );
}
