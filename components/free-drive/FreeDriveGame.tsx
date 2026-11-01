"use client";

import { useEffect, useRef, useState } from "react";
import DrivingTelemetry from "./DrivingTelemetry";
import { createFreeDriveScene } from "./scene";
import type { HudSnapshot } from "./types";

const initialHud: HudSnapshot = { speed: 0, heading: "N", status: "PARKED" };

export default function FreeDriveGame() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState<HudSnapshot>(initialHud);

  useEffect(() => {
    const mount = sceneRef.current;
    if (!mount) return;
    return createFreeDriveScene(mount, setHud);
  }, []);

  return (
    <main className="game-shell">
      <div ref={sceneRef} className="scene-host" aria-label="Interactive 3D free drive world" />
      <DrivingTelemetry {...hud} />
      <div className="world-badge"><span className="badge-line" /><span>HARBOR DISTRICT</span><small>Low-poly sandbox / dusk</small></div>
      <div className="bottom-note"><span className="note-icon">✦</span> EXPLORE A LITTLE. STAY A WHILE.</div>
      <div className="vignette" aria-hidden="true" />
    </main>
  );
}
