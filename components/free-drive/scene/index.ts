import * as THREE from "three";
import { createCar } from "./car";
import { createDriveLoop } from "./driveLoop";
import { createEnvironment } from "./environment";
import { createImpactSystem } from "./impact";
import type { HudSnapshot } from "../types";

export function createFreeDriveScene(mount: HTMLDivElement, onHudUpdate: (snapshot: HudSnapshot) => void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#091521");
  scene.fog = new THREE.Fog("#0b1c29", 48, 176);

  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 280);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight("#cde8ff", "#5b4637", 1.7));
  const sun = new THREE.DirectionalLight("#ffe1ad", 3.2);
  sun.position.set(-30, 55, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const moon = new THREE.DirectionalLight("#6ba3d2", 0.8);
  moon.position.set(45, 20, -35);
  scene.add(moon);

  const environment = createEnvironment(scene);
  const rig = createCar(environment.world);
  const impact = createImpactSystem(environment.world, rig.car, environment.obstacles);
  const loop = createDriveLoop({ scene, renderer, camera, stars: environment.stars, rig, impact, onHudUpdate });

  const resize = () => {
    const width = mount.clientWidth;
    const height = Math.max(mount.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener("resize", resize);
  resize();
  loop.start();

  return () => {
    loop.stop();
    window.removeEventListener("resize", resize);
    renderer.dispose();
    mount.removeChild(renderer.domElement);
  };
}
