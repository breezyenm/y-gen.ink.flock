"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FlockEngine } from "@/lib/flock/engine";
import { MODE_KEYS, SCENES, type Density, type ModeKey, type Pace } from "@/lib/flock/modes";

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
  // Set once on the first touch/pen interaction — fades the discovery hint.
  const [interacted, setInteracted] = useState(false);

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
      onFirstInteract: () => setInteracted(true),
    });
    engineRef.current = engine;
    engine.start();
    if (process.env.NODE_ENV !== "production") {
      void import("@/lib/flock/dev-recorder").then(({ exposeRecorder, exposeCapture }) => {
        exposeRecorder(canvas, engine, startMode);
        exposeCapture(canvas, engine, startMode);
      });
    }
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [startMode, density, pace]);

  const cfg = SCENES[mode].cfg;
  const uiInk = cfg.ink;
  const faint = cfg.faint;

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
        className="yg-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      <div className="yg-topbar" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
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
        <div className="yg-switcher">
          {MODE_KEYS.map((key) => {
            const c = SCENES[key].cfg;
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
                    justifyContent: "center",
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

      <div
        className="yg-caption"
        style={{ position: "absolute", left: 36, bottom: 34, pointerEvents: "none", color: uiInk }}
      >
        <div
          style={{
            animation: `${flip ? "ygFadeB" : "ygFadeA"} 640ms cubic-bezier(0.22,0.61,0.36,1) both`,
          }}
        >
          <div
            className="yg-caption-ja"
            style={{
              fontFamily: "var(--font-jp)",
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
        className={`yg-hint${interacted ? " yg-hint--dismissed" : ""}`}
        style={{
          position: "absolute",
          right: 36,
          bottom: 36,
          pointerEvents: "none",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: uiInk,
        }}
      >
        <span className="yg-hint-hover">move — they follow · click — they scatter</span>
        <span className="yg-hint-touch">drag — they follow · tap — they scatter</span>
      </div>
    </div>
  );
}
