"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  phase: number;
  frequency: number;
}

interface MilkyWayStar {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const milkyWayRef = useRef<MilkyWayStar[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildStars = (w: number, h: number) => {
      const count = 350;
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.5 + Math.random() * 2.0,
        baseOpacity: 0.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.25 + Math.random() * 0.75,
      }));
    };

    const buildMilkyWay = (w: number, h: number) => {
      const count = 600;
      milkyWayRef.current = Array.from({ length: count }, () => {
        const t = Math.random();
        const bx = t * w;
        const by = t * h;
        const sigma = 100;
        const perp = (Math.random() - 0.5) * sigma * 2.5;
        return {
          x: bx + perp * Math.cos(Math.PI / 4 + Math.PI / 2),
          y: by + perp * Math.sin(Math.PI / 4 + Math.PI / 2),
          radius: 0.3 + Math.random() * 1.0,
          opacity: 0.05 + Math.random() * 0.45,
        };
      });
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      buildStars(w, h);
      buildMilkyWay(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.filter = "blur(0.6px)";
      milkyWayRef.current.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${s.opacity})`;
        ctx.fill();
      });
      ctx.filter = "none";
      ctx.restore();

      const elapsed = time / 1000;
      starsRef.current.forEach((s) => {
        let opacity: number;
        if (prefersReduced) {
          opacity = s.baseOpacity;
        } else {
          const t = Math.sin(s.phase + elapsed * s.frequency * Math.PI * 2);
          opacity = 0.6 + t * 0.4;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        const blue = Math.floor(200 + s.radius * 20);
        ctx.fillStyle = `rgba(220,230,${Math.min(blue, 255)},${opacity})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
