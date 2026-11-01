import type { HudSnapshot } from "./types";

export default function DrivingTelemetry({ speed, heading, status }: HudSnapshot) {
  return (
    <section className="telemetry-dock" aria-label="Driving telemetry">
      <div className="telemetry-item">
        <div className="telemetry-label">SPEED</div>
        <div className="telemetry-value">{speed}<small> KM/H</small></div>
        <div className="speed-track"><span style={{ width: `${Math.min((speed / 63) * 100, 100)}%` }} /></div>
      </div>
      <div className="telemetry-item telemetry-heading">
        <div className="telemetry-label">HEADING</div>
        <div className="telemetry-value">{heading}</div>
        <div className="telemetry-status"><span className="status-dot" /> {status}</div>
      </div>
    </section>
  );
}
