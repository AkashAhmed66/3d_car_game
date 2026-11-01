import * as THREE from "three";
import type { CarRig, HudSnapshot, ImpactSystem } from "../types";

const directionNames: HudSnapshot["heading"][] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function getHeading(radians: number): HudSnapshot["heading"] {
  const normalized = ((radians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return directionNames[Math.round(normalized / (Math.PI / 4)) % directionNames.length];
}

type DriveLoopOptions = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  stars: THREE.Points;
  rig: CarRig;
  impact: ImpactSystem;
  onHudUpdate: (snapshot: HudSnapshot) => void;
};

export function createDriveLoop({ scene, renderer, camera, stars, rig, impact, onHudUpdate }: DriveLoopOptions) {
  const keys = new Set<string>();
  const cameraOffset = new THREE.Vector3(0, 5.6, 8.8);
  const cameraPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const candidate = new THREE.Vector3();
  let speed = 0;
  let frame = 0;
  let lastTime = 0;
  let hudTimer = 0;
  let impactCooldown = 0;
  let impactStatusTimer = 0;
  let cameraShake = 0;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code.startsWith("Arrow")) event.preventDefault();
    keys.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);

  const tick = (now: number) => {
    frame = window.requestAnimationFrame(tick);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    impactCooldown = Math.max(0, impactCooldown - dt);
    impactStatusTimer = Math.max(0, impactStatusTimer - dt);

    const accelerating = keys.has("ArrowUp") || keys.has("KeyW");
    const reversing = keys.has("ArrowDown") || keys.has("KeyS");
    const steer = (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0) - (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0);
    if (accelerating) speed += 16 * dt;
    if (reversing) speed -= 11 * dt;
    if (!accelerating && !reversing) speed = THREE.MathUtils.damp(speed, 0, 4.8, dt);
    speed = THREE.MathUtils.clamp(speed, -6, 15);

    const steeringStrength = 1.65 * Math.min(Math.abs(speed) / 5, 1.25);
    rig.car.rotation.y += steer * steeringStrength * dt;
    rig.car.rotation.z = THREE.MathUtils.damp(rig.car.rotation.z, -steer * 0.055, 8, dt);
    forward.set(0, 0, -1).applyAxisAngle(up, rig.car.rotation.y);
    candidate.copy(rig.car.position).addScaledVector(forward, speed * dt);

    const obstacle = impact.findObstacleAt(candidate.x, candidate.z);
    if (obstacle) {
      const impactSpeed = Math.abs(speed);
      speed *= -0.22;
      rig.car.rotation.x = -0.12 * Math.sign(speed || 1);
      if (impactCooldown <= 0 && impactSpeed > 0.6) {
        impact.spawnImpactEffect(obstacle, forward);
        impactCooldown = 0.42;
        impactStatusTimer = 0.58;
        cameraShake = 0.18;
      }
    } else {
      rig.car.position.copy(candidate);
      rig.car.position.x = THREE.MathUtils.clamp(rig.car.position.x, -94, 94);
      rig.car.position.z = THREE.MathUtils.clamp(rig.car.position.z, -92, 94);
    }
    rig.car.rotation.x = THREE.MathUtils.damp(rig.car.rotation.x, 0, 10, dt);
    rig.wheels.forEach((wheel) => { wheel.rotation.x -= speed * dt * 2.2; });

    cameraPosition.copy(cameraOffset).applyAxisAngle(up, rig.car.rotation.y).add(rig.car.position);
    camera.position.copy(cameraPosition);
    if (cameraShake > 0) {
      camera.position.x += (Math.random() - 0.5) * cameraShake;
      camera.position.y += (Math.random() - 0.5) * cameraShake * 0.7;
      cameraShake = Math.max(0, cameraShake - dt * 1.8);
    }
    cameraTarget.copy(rig.car.position);
    cameraTarget.y += 0.9;
    camera.lookAt(cameraTarget);

    stars.rotation.y += dt * 0.002;
    impact.updateImpactEffects(dt);
    hudTimer += dt;
    if (hudTimer > 0.12) {
      hudTimer = 0;
      const kmh = Math.round(Math.abs(speed) * 4.2);
      onHudUpdate({
        speed: kmh,
        heading: getHeading(-rig.car.rotation.y),
        status: impactStatusTimer > 0 ? "IMPACT" : kmh < 2 ? "PARKED" : speed < 0 ? "REVERSING" : "CRUISING",
      });
    }
    renderer.render(scene, camera);
  };

  return {
    start() {
      window.addEventListener("keydown", onKeyDown, { passive: false });
      window.addEventListener("keyup", onKeyUp);
      lastTime = performance.now();
      frame = window.requestAnimationFrame(tick);
    },
    stop() {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
