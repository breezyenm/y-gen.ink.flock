"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FlockEngine } from "@/lib/flock/engine";
import { FAINT_INK, MODES, MODE_KEYS, type Density, type ModeKey, type Pace } from "@/lib/flock/modes";

interface FlockCanvasProps {
  startMode?: ModeKey;
  density?: Density;
  pace?: Pace;
}

export function FlockCanvas({
  startMode = "koi",
  density = "sparse",
  pace = "drifting",
}: FlockCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FlockEngine | null>(null);
  // `mode` tracks the engine's committed mode: it flips mid-veil, exactly
  // when the prototype called setState from drawVeil. `flip` alternates the
  // caption keyframe name so the fade re-runs on every commit.
  const [mode, setMode] = useState<ModeKey>(startMode);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FlockEngine(canvas, {
      startMode,
      density,
      pace,
      onModeCommitted: (m) => {
        setMode(m);
        setFlip((f) => !f);
      },
    });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [startMode, density, pace]);

  const cfg = MODES[mode];
  const uiInk = cfg.ink;
  const faint = FAINT_INK[mode];

  return (
    <div
      style={
        {
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: "#F5EFE2",
          fontFamily: "var(--font-sans)",
          color: "#161B1A",
          userSelect: "none",
          "--ui-ink": uiInk,
        } as CSSProperties
      }
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "26px 36px",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: uiInk }}>
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "#D93A2B",
              display: "inline-block",
            }}
          />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 19, letterSpacing: "0.02em" }}>
            Yūgen
          </span>
          <span style={{ fontFamily: "var(--font-jp)", fontSize: 12, opacity: 0.55 }}>幽玄</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
          {MODE_KEYS.map((key) => {
            const c = MODES[key];
            const active = key === mode;
            return (
              <button
                key={key}
                type="button"
                className="yg-mode-btn"
                onClick={() => engineRef.current?.requestMode(key)}
                style={
                  {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    "--btn-ink": active ? uiInk : faint,
                  } as CSSProperties
                }
              >
                <span style={{ fontFamily: "var(--font-jp)", fontSize: 15, letterSpacing: 0 }}>
                  {c.kanji}
                </span>
                <span>{c.label}</span>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#D93A2B",
                    opacity: active ? 1 : 0,
                    transition: "opacity 0.35s",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", left: 36, bottom: 34, pointerEvents: "none", color: uiInk }}>
        <div
          style={{
            animation: `${flip ? "ygFadeB" : "ygFadeA"} 640ms cubic-bezier(0.22,0.61,0.36,1) both`,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jp)",
              fontSize: 30,
              lineHeight: 1.2,
              letterSpacing: "0.04em",
            }}
          >
            {cfg.ja}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginTop: 10,
              opacity: 0.62,
            }}
          >
            {cfg.en}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 36,
          pointerEvents: "none",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          opacity: 0.5,
          color: uiInk,
        }}
      >
        move — they follow · click — they scatter
      </div>
    </div>
  );
}
