"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type HudHeading = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

const directionNames: HudHeading[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function headingLabel(radians: number): HudHeading {
  const normalized = ((radians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.round(normalized / (Math.PI / 4)) % directionNames.length;
  return directionNames[index];
}

export default function Home() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState<HudHeading>("N");
  const [status, setStatus] = useState("PARKED");

  useEffect(() => {
    const mount = sceneRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#091521");
    scene.fog = new THREE.Fog("#0b1c29", 48, 176);

    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 280);
    camera.position.set(7, 6.4, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#cde8ff", "#5b4637", 1.7);
    scene.add(ambient);

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

    const world = new THREE.Group();
    scene.add(world);

    type RoadZone = { axis: "x" | "z"; center: number; alongCenter: number; halfLength: number; halfWidth: number };
    type ObstacleKind = "building" | "tree" | "lamp" | "sign" | "wall";
    type Obstacle = { minX: number; maxX: number; minZ: number; maxZ: number; kind: ObstacleKind; x: number; z: number };

    const roadZones: RoadZone[] = [
      { axis: "x", center: 15, alongCenter: 0, halfLength: 110, halfWidth: 6 },
      { axis: "z", center: -38, alongCenter: 0, halfLength: 100, halfWidth: 5.5 },
      { axis: "z", center: 42, alongCenter: -25, halfLength: 72.5, halfWidth: 5.5 },
      { axis: "x", center: -55, alongCenter: 0, halfLength: 110, halfWidth: 5 },
    ];
    const obstacles: Obstacle[] = [];
    const registerObstacle = (x: number, z: number, halfWidth: number, halfDepth: number, kind: ObstacleKind) => {
      obstacles.push({ minX: x - halfWidth, maxX: x + halfWidth, minZ: z - halfDepth, maxZ: z + halfDepth, kind, x, z });
    };
    const overlapsRoad = (x: number, z: number, halfWidth: number, halfDepth: number, margin = 0.5) =>
      roadZones.some((road) => {
        if (road.axis === "x") {
          return Math.abs(z - road.center) < road.halfWidth + halfDepth + margin && Math.abs(x - road.alongCenter) < road.halfLength + halfWidth + margin;
        }
        return Math.abs(x - road.center) < road.halfWidth + halfWidth + margin && Math.abs(z - road.alongCenter) < road.halfLength + halfDepth + margin;
      });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: "#b98d62", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    world.add(ground);

    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(170, 32, 16),
      new THREE.MeshBasicMaterial({ color: "#142a3b", side: THREE.BackSide }),
    );
    horizon.position.y = 24;
    scene.add(horizon);

    const addRoad = (x: number, z: number, width: number, depth: number) => {
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.12, depth),
        new THREE.MeshStandardMaterial({ color: "#2b3540", roughness: 0.96 }),
      );
      road.position.set(x, 0.05, z);
      road.receiveShadow = true;
      world.add(road);

      const stripeMaterial = new THREE.MeshBasicMaterial({ color: "#d9c8a4" });
      const horizontal = width > depth;
      const length = horizontal ? width : depth;
      for (let offset = -length / 2 + 5; offset < length / 2 - 2; offset += 8) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(horizontal ? 3.2 : 0.18, 0.015, horizontal ? 0.18 : 3.2),
          stripeMaterial,
        );
        stripe.position.set(horizontal ? x + offset : x, 0.12, horizontal ? z : z + offset);
        world.add(stripe);
      }

      const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: "#d5b590", roughness: 0.92 });
      if (horizontal) {
        for (const side of [-1, 1]) {
          const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 1.25), sidewalkMaterial);
          sidewalk.position.set(x, 0.13, z + side * (depth / 2 + 0.75));
          sidewalk.receiveShadow = true;
          world.add(sidewalk);
        }
      } else {
        for (const side of [-1, 1]) {
          const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, depth), sidewalkMaterial);
          sidewalk.position.set(x + side * (width / 2 + 0.75), 0.13, z);
          sidewalk.receiveShadow = true;
          world.add(sidewalk);
        }
      }
    };

    addRoad(0, 15, 220, 12);
    addRoad(-38, 0, 11, 200);
    addRoad(42, -25, 11, 145);
    addRoad(0, -55, 220, 10);

    const buildingMaterials = ["#d46f52", "#efb86b", "#6b9da3", "#b86b61", "#d8c79e"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 }),
    );
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: "#f7dc9a",
      emissive: "#db9644",
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const buildingGlassMaterial = new THREE.MeshPhysicalMaterial({ color: "#17313c", roughness: 0.1, metalness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.08 });
    const buildingMetalMaterial = new THREE.MeshStandardMaterial({ color: "#b8c0bf", roughness: 0.26, metalness: 0.82 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: "#3d3b42", roughness: 0.95 });
    const balconyMaterial = new THREE.MeshStandardMaterial({ color: "#2d3b40", roughness: 0.62, metalness: 0.42 });

    const buildingWidth = 16;
    const buildingDepth = 18;
    const storyHeight = 2.7;
    const storyCount = 5;
    const buildingHeight = storyHeight * storyCount;
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: "#d0c1a7", roughness: 0.48, metalness: 0.18 });
    const sunshadeMaterial = new THREE.MeshStandardMaterial({ color: "#5b6b6e", roughness: 0.52, metalness: 0.25 });

    const addBuilding = (x: number, z: number, index: number) => {
      if (overlapsRoad(x, z, buildingWidth / 2, buildingDepth / 2, 0.85)) return;
      const building = new THREE.Group();
      const baseY = 0.2;
      const facadeMaterial = buildingMaterials[index % buildingMaterials.length];
      const facadeZ = -buildingDepth / 2 - 0.09;
      building.position.set(x, 0, z);

      const foundation = new THREE.Mesh(new RoundedBoxGeometry(buildingWidth + 0.5, 0.24, buildingDepth + 0.5, 3, 0.08), balconyMaterial);
      foundation.position.y = 0.12;
      foundation.receiveShadow = true;
      building.add(foundation);

      const body = new THREE.Mesh(new RoundedBoxGeometry(buildingWidth, buildingHeight, buildingDepth, 5, 0.18), facadeMaterial);
      body.position.y = baseY + buildingHeight / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      building.add(body);

      const roof = new THREE.Mesh(new RoundedBoxGeometry(buildingWidth + 0.3, 0.28, buildingDepth + 0.3, 3, 0.08), roofMaterial);
      roof.position.y = baseY + buildingHeight + 0.14;
      roof.castShadow = true;
      building.add(roof);
      const roofUnit = new THREE.Mesh(new RoundedBoxGeometry(3.6, 0.7, 2.8, 4, 0.12), balconyMaterial);
      roofUnit.position.set(2.4, baseY + buildingHeight + 0.58, 1.1);
      roofUnit.castShadow = true;
      building.add(roofUnit);

      const frontBandMaterial = new THREE.MeshStandardMaterial({ color: "#e1d1b2", roughness: 0.62, metalness: 0.14 });
      for (let floor = 0; floor < storyCount; floor += 1) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth + 0.08, 0.1, 0.16), frontBandMaterial);
        band.position.set(0, baseY + floor * storyHeight + 0.2, facadeZ - 0.03);
        band.castShadow = true;
        building.add(band);
      }

      for (const xColumn of [-buildingWidth / 2 + 0.22, buildingWidth / 2 - 0.22]) {
        const cornerColumn = new THREE.Mesh(new RoundedBoxGeometry(0.36, buildingHeight + 0.12, 0.4, 3, 0.07), frontBandMaterial);
        cornerColumn.position.set(xColumn, baseY + buildingHeight / 2, facadeZ - 0.05);
        cornerColumn.castShadow = true;
        building.add(cornerColumn);
      }

      const addWindow = (position: THREE.Vector3, side = false) => {
        const windowGroup = new THREE.Group();
        windowGroup.position.copy(position);
        if (side) windowGroup.rotation.y = -Math.PI / 2;

        const glass = new THREE.Mesh(new RoundedBoxGeometry(1.55, 1.05, 0.08, 3, 0.04), windowMaterial);
        glass.position.z = -0.035;
        windowGroup.add(glass);
        for (const xBar of [-0.86, 0.86]) {
          const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.1), windowFrameMaterial);
          vertical.position.set(xBar, 0, 0);
          windowGroup.add(vertical);
        }
        for (const yBar of [-0.62, 0.62]) {
          const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.08, 0.1), windowFrameMaterial);
          horizontal.position.set(0, yBar, 0);
          windowGroup.add(horizontal);
        }
        const sill = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 0.2), windowFrameMaterial);
        sill.position.set(0, -0.72, 0.03);
        windowGroup.add(sill);
        const sunshade = new THREE.Mesh(new RoundedBoxGeometry(2.05, 0.1, 0.38, 3, 0.04), sunshadeMaterial);
        sunshade.position.set(0, 0.77, -0.13);
        sunshade.rotation.x = -0.12;
        sunshade.castShadow = true;
        windowGroup.add(sunshade);
        building.add(windowGroup);
      };

      for (let floor = 0; floor < storyCount; floor += 1) {
        const windowY = baseY + 1.35 + floor * storyHeight;
        for (const column of [-2, -1, 0, 1, 2]) {
          if (floor === 0 && column === 0) continue;
          addWindow(new THREE.Vector3(column * 2.55, windowY, facadeZ));
        }
        for (const sideZ of [-5.45, -1.82, 1.82, 5.45]) {
          addWindow(new THREE.Vector3(buildingWidth / 2 + 0.06, windowY, sideZ), true);
        }
      }

      const grandDoorFrame = new THREE.Mesh(new RoundedBoxGeometry(4.15, 3.35, 0.2, 4, 0.08), windowFrameMaterial);
      grandDoorFrame.position.set(0, baseY + 1.72, facadeZ - 0.08);
      grandDoorFrame.castShadow = true;
      building.add(grandDoorFrame);
      for (const doorX of [-0.94, 0.94]) {
        const doorGlass = new THREE.Mesh(new RoundedBoxGeometry(1.56, 2.5, 0.06, 3, 0.025), buildingGlassMaterial);
        doorGlass.position.set(doorX, baseY + 1.57, facadeZ - 0.2);
        building.add(doorGlass);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), buildingMetalMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(doorX + (doorX < 0 ? 0.35 : -0.35), baseY + 1.52, facadeZ - 0.25);
        building.add(handle);
      }
      const doorDivider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.55, 0.1), windowFrameMaterial);
      doorDivider.position.set(0, baseY + 1.57, facadeZ - 0.25);
      building.add(doorDivider);
      const canopy = new THREE.Mesh(new RoundedBoxGeometry(5.1, 0.16, 1.25, 4, 0.08), balconyMaterial);
      canopy.position.set(0, baseY + 3.45, facadeZ - 0.52);
      canopy.rotation.x = -0.08;
      canopy.castShadow = true;
      building.add(canopy);
      for (const stepSize of [4.35, 3.65]) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(stepSize, 0.14, 0.48), balconyMaterial);
        step.position.set(0, 0.07 + (4.35 - stepSize) * 0.08, facadeZ - 0.34 - (4.35 - stepSize) * 0.18);
        step.castShadow = true;
        building.add(step);
      }

      world.add(building);
      registerObstacle(x, z, buildingWidth / 2 + 0.6, buildingDepth / 2 + 0.6, "building");
    };
    addBuilding(-69, -34, 0);
    addBuilding(-66, 45, 1);
    addBuilding(-13, -37, 2);
    addBuilding(22, -36, 3);
    addBuilding(67, 34, 4);
    addBuilding(68, 62, 0);
    addBuilding(-76, 77, 2);

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#5d4035", roughness: 1 });
    const leafMaterials = ["#6e8f5c", "#779967", "#86a46c"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
    );
    const addTree = (x: number, z: number, scale = 1) => {
      if (overlapsRoad(x, z, 0.9 * scale, 0.9 * scale, 0.35)) return;
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      const rootCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.66, 0.12, 12), trunkMaterial);
      rootCollar.position.y = 0.06;
      rootCollar.castShadow = true;
      tree.add(rootCollar);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.34, 2.2, 8), trunkMaterial);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), leafMaterials[Math.abs(Math.round(x + z)) % leafMaterials.length]);
      crown.position.y = 2.75;
      crown.castShadow = true;
      tree.add(crown);
      const crownTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), leafMaterials[(Math.abs(Math.round(x + z)) + 1) % leafMaterials.length]);
      crownTop.position.y = 3.65;
      crownTop.castShadow = true;
      tree.add(crownTop);
      world.add(tree);
      registerObstacle(x, z, 0.82 * scale, 0.82 * scale, "tree");
    };

    [
      [-19, 23, 1.1], [-27, 23, 0.85], [17, 23, 1.15], [26, 24, 0.9],
      [-22, -1, 1], [-18, -1, 0.78], [29, -46, 1.05], [37, -46, 0.8],
      [77, -5, 1.1], [84, -5, 0.75], [-82, 4, 1.2], [-86, 4, 0.9],
      [-54, 85, 1], [-45, 86, 0.75],
    ].forEach(([x, z, scale]) => addTree(x, z, scale));

    const lampPostMaterial = new THREE.MeshStandardMaterial({ color: "#25323a", metalness: 0.6, roughness: 0.55 });
    const lampGlowMaterial = new THREE.MeshStandardMaterial({
      color: "#ffcf7b",
      emissive: "#ff9d3f",
      emissiveIntensity: 2.4,
    });
    const addLamp = (x: number, z: number) => {
      if (overlapsRoad(x, z, 0.35, 0.35, 0.3)) return;
      const post = new THREE.Group();
      post.position.set(x, 0, z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.16, 10), lampPostMaterial);
      base.position.y = 0.08;
      base.castShadow = true;
      post.add(base);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.4, 8), lampPostMaterial);
      stem.position.y = 2.2;
      stem.castShadow = true;
      post.add(stem);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), lampPostMaterial);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 4.05;
      post.add(collar);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), lampPostMaterial);
      arm.position.set(0.38, 4.32, 0);
      post.add(arm);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.18, 12), lampPostMaterial);
      shade.position.set(0.8, 4.31, 0);
      shade.rotation.x = Math.PI;
      post.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), lampGlowMaterial);
      bulb.position.set(0.8, 4.16, 0);
      post.add(bulb);
      const light = new THREE.PointLight("#ffb85c", 0.65, 8, 2);
      light.position.set(0.8, 4.15, 0);
      post.add(light);
      world.add(post);
      registerObstacle(x, z, 0.35, 0.35, "lamp");
    };
    [-86, -64, -54, -24, 8, 30, 62, 86].forEach((x) => {
      addLamp(x, 24);
      addLamp(x, 6);
    });
    [-82, -25, 5, 35, 70].forEach((z) => {
      addLamp(-46, z);
      addLamp(-30, z);
      addLamp(50, z);
      addLamp(34, z);
    });

    const sign = new THREE.Group();
    sign.position.set(-8, 0, 24.5);
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3, 8), lampPostMaterial);
    signPole.position.y = 1.5;
    sign.add(signPole);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 1.3, 0.16),
      new THREE.MeshStandardMaterial({ color: "#223a47", roughness: 0.7, metalness: 0.25 }),
    );
    signBoard.position.y = 3.05;
    signBoard.castShadow = true;
    sign.add(signBoard);
    world.add(sign);
    registerObstacle(-8, 24.5, 2.5, 0.45, "sign");

    const wallMaterial = new THREE.MeshStandardMaterial({ color: "#263a45", roughness: 0.88, metalness: 0.12 });
    const wallCapMaterial = new THREE.MeshStandardMaterial({ color: "#53616a", roughness: 0.72, metalness: 0.28 });
    const wallLightMaterial = new THREE.MeshStandardMaterial({ color: "#f6c978", emissive: "#d9792e", emissiveIntensity: 1.8 });
    const wallLimit = 104;
    const wallLength = 208;
    const wallHeight = 11;
    const wallThickness = 2.6;
    const addBoundaryWall = (axis: "x" | "z", coordinate: number) => {
      const horizontal = axis === "x";
      const wall = new THREE.Mesh(
        new RoundedBoxGeometry(horizontal ? wallLength : wallThickness, wallHeight, horizontal ? wallThickness : wallLength, 4, 0.18),
        wallMaterial,
      );
      wall.position.set(horizontal ? 0 : coordinate, wallHeight / 2, horizontal ? coordinate : 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      world.add(wall);

      const cap = new THREE.Mesh(
        new RoundedBoxGeometry(horizontal ? wallLength + 0.5 : wallThickness + 0.5, 0.3, horizontal ? wallThickness + 0.5 : wallLength + 0.5, 3, 0.08),
        wallCapMaterial,
      );
      cap.position.set(horizontal ? 0 : coordinate, wallHeight + 0.16, horizontal ? coordinate : 0);
      cap.castShadow = true;
      world.add(cap);

      for (let offset = -wallLength / 2 + 14; offset < wallLength / 2; offset += 28) {
        const pillar = new THREE.Mesh(
          new RoundedBoxGeometry(horizontal ? 1.35 : wallThickness + 0.45, wallHeight + 0.9, horizontal ? wallThickness + 0.45 : 1.35, 4, 0.12),
          wallCapMaterial,
        );
        pillar.position.set(horizontal ? offset : coordinate, (wallHeight + 0.9) / 2, horizontal ? coordinate : offset);
        pillar.castShadow = true;
        world.add(pillar);

        const lantern = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.42, 0.18, 3, 0.04), wallLightMaterial);
        lantern.position.set(horizontal ? offset : coordinate - (coordinate > 0 ? 1.45 : -1.45), wallHeight - 1.35, horizontal ? coordinate - (coordinate > 0 ? 1.45 : -1.45) : offset);
        world.add(lantern);
        const lanternLight = new THREE.PointLight("#ffb34f", 0.35, 7, 2);
        lanternLight.position.copy(lantern.position);
        world.add(lanternLight);
      }

      if (horizontal) registerObstacle(0, coordinate, wallLength / 2, wallThickness / 2, "wall");
      else registerObstacle(coordinate, 0, wallThickness / 2, wallLength / 2, "wall");
    };
    addBoundaryWall("x", -wallLimit);
    addBoundaryWall("x", wallLimit);
    addBoundaryWall("z", -wallLimit);
    addBoundaryWall("z", wallLimit);

    const cornerTowerMaterial = new THREE.MeshStandardMaterial({ color: "#314954", roughness: 0.82, metalness: 0.18 });
    for (const x of [-wallLimit, wallLimit]) {
      for (const z of [-wallLimit, wallLimit]) {
        const tower = new THREE.Mesh(new RoundedBoxGeometry(4.8, 14.5, 4.8, 5, 0.2), cornerTowerMaterial);
        tower.position.set(x, 7.25, z);
        tower.castShadow = true;
        world.add(tower);
        registerObstacle(x, z, 2.7, 2.7, "wall");
      }
    }

    const starCount = 320;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = ((i * 83) % 240) - 120;
      starPositions[i * 3 + 1] = 18 + ((i * 47) % 80);
      starPositions[i * 3 + 2] = ((i * 131) % 220) - 110;
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(starPositions, 3)),
      new THREE.PointsMaterial({ color: "#cfe9ff", size: 0.18, transparent: true, opacity: 0.7 }),
    );
    scene.add(stars);

    const car = new THREE.Group();
    car.position.set(0, 0.32, 29);
    world.add(car);

    const carBodyMaterial = new THREE.MeshPhysicalMaterial({
      color: "#d9573b",
      roughness: 0.24,
      metalness: 0.28,
      clearcoat: 0.65,
      clearcoatRoughness: 0.14,
    });
    const carAccentMaterial = new THREE.MeshPhysicalMaterial({
      color: "#f0a15c",
      roughness: 0.3,
      metalness: 0.2,
      clearcoat: 0.45,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: "#101b22", roughness: 0.34, metalness: 0.72 });
    const rubberMaterial = new THREE.MeshStandardMaterial({ color: "#14171a", roughness: 0.92, metalness: 0.03 });
    const rimMaterial = new THREE.MeshStandardMaterial({ color: "#b8c0bf", roughness: 0.26, metalness: 0.82 });
    const brakeMaterial = new THREE.MeshStandardMaterial({ color: "#6e7472", roughness: 0.36, metalness: 0.78 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#183441",
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.86,
    });
    const headlightMaterial = new THREE.MeshPhysicalMaterial({ color: "#fff6c5", emissive: "#ffd15f", emissiveIntensity: 2.6, roughness: 0.18, metalness: 0.05 });
    const tailLightMaterial = new THREE.MeshPhysicalMaterial({ color: "#fa5149", emissive: "#d51d1b", emissiveIntensity: 1.8, roughness: 0.2, metalness: 0.08 });
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: "#f7a33d", emissive: "#e36b1e", emissiveIntensity: 1.25 });

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.05, 32),
      new THREE.MeshBasicMaterial({ color: "#17232a", transparent: true, opacity: 0.34, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1, 1.45, 1);
    shadow.position.y = -0.28;
    car.add(shadow);

    const underbody = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.38, 4.18, 4, 0.15), trimMaterial);
    underbody.position.y = 0.55;
    underbody.castShadow = true;
    car.add(underbody);

    const body = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.72, 3.78, 5, 0.2), carBodyMaterial);
    body.position.y = 0.88;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);

    const hood = new THREE.Mesh(new RoundedBoxGeometry(2.08, 0.18, 1.18, 4, 0.09), carAccentMaterial);
    hood.position.set(0, 1.3, -1.18);
    hood.castShadow = true;
    car.add(hood);

    const rearDeck = new THREE.Mesh(new RoundedBoxGeometry(2.05, 0.16, 0.66, 4, 0.08), carBodyMaterial);
    rearDeck.position.set(0, 1.2, 1.42);
    car.add(rearDeck);

    const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.78, 0.74, 1.95, 5, 0.17), carBodyMaterial);
    cabin.position.set(0, 1.42, 0.16);
    cabin.castShadow = true;
    car.add(cabin);

    const windshield = new THREE.Mesh(new RoundedBoxGeometry(1.53, 0.44, 0.06, 3, 0.025), glassMaterial);
    windshield.position.set(0, 1.52, -0.78);
    windshield.rotation.x = -0.17;
    car.add(windshield);

    const rearGlass = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.4, 0.06, 3, 0.025), glassMaterial);
    rearGlass.position.set(0, 1.51, 1.1);
    rearGlass.rotation.x = 0.17;
    car.add(rearGlass);

    const roof = new THREE.Mesh(new RoundedBoxGeometry(1.65, 0.1, 1.84, 3, 0.04), trimMaterial);
    roof.position.set(0, 1.82, 0.16);
    car.add(roof);

    for (const x of [-1, 1]) {
      for (const z of [-0.34, 0.63]) {
        const sideWindow = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.4, 0.72, 3, 0.018), glassMaterial);
        sideWindow.position.set(x * 0.91, 1.5, z);
        sideWindow.rotation.y = x * 0.02;
        car.add(sideWindow);
      }

      const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.13, 0.32, 3, 0.05), carAccentMaterial);
      mirror.position.set(x * 1.16, 1.54, -0.64);
      mirror.rotation.y = x * 0.16;
      mirror.castShadow = true;
      car.add(mirror);

      const doorHandle = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.045, 0.25, 3, 0.018), rimMaterial);
      doorHandle.position.set(x * 1.17, 1.08, 0.22);
      car.add(doorHandle);
    }

    const frontBumper = new THREE.Mesh(new RoundedBoxGeometry(2.18, 0.28, 0.18, 4, 0.08), carAccentMaterial);
    frontBumper.position.set(0, 0.7, -1.94);
    frontBumper.castShadow = true;
    car.add(frontBumper);
    const rearBumper = new THREE.Mesh(new RoundedBoxGeometry(2.18, 0.27, 0.18, 4, 0.08), trimMaterial);
    rearBumper.position.set(0, 0.7, 1.94);
    car.add(rearBumper);

    const grille = new THREE.Mesh(new RoundedBoxGeometry(1.08, 0.17, 0.055, 3, 0.04), trimMaterial);
    grille.position.set(0, 0.83, -2.035);
    car.add(grille);
    const frontPlate = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.12, 0.035, 3, 0.025), new THREE.MeshStandardMaterial({ color: "#e9e7dc", roughness: 0.55, metalness: 0.1 }));
    frontPlate.position.set(0, 0.66, -2.045);
    car.add(frontPlate);

    const tailStrip = new THREE.Mesh(new RoundedBoxGeometry(1.46, 0.08, 0.05, 3, 0.02), trimMaterial);
    tailStrip.position.set(0, 1.02, 1.98);
    car.add(tailStrip);

    const wheels: THREE.Group[] = [];
    for (const x of [-1.14, 1.14]) {
      for (const z of [-1.16, 1.16]) {
        const wheel = new THREE.Group();
        wheel.position.set(x, 0.54, z);
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.16, 16, 28), rubberMaterial);
        tire.rotation.y = Math.PI / 2;
        tire.castShadow = true;
        wheel.add(tire);

        const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 20), brakeMaterial);
        brakeDisc.rotation.z = Math.PI / 2;
        wheel.add(brakeDisc);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.13, 20), rimMaterial);
        rim.rotation.z = Math.PI / 2;
        wheel.add(rim);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 14), trimMaterial);
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);
        const caliper = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.2, 0.22, 3, 0.025), tailLightMaterial);
        caliper.position.set(0, 0.14, 0.12);
        wheel.add(caliper);
        car.add(wheel);
        wheels.push(wheel);
      }
    }

    for (const x of [-0.68, 0.68]) {
      const headlight = new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.2, 0.07, 3, 0.045), headlightMaterial);
      headlight.position.set(x, 1.0, -1.99);
      car.add(headlight);
      const indicator = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.12, 0.075, 3, 0.03), indicatorMaterial);
      indicator.position.set(x * 1.32, 0.96, -1.99);
      car.add(indicator);
      const tailLight = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.2, 0.07, 3, 0.045), tailLightMaterial);
      tailLight.position.set(x, 1.0, 1.99);
      car.add(tailLight);
    }

    const exhaustMaterial = new THREE.MeshStandardMaterial({ color: "#8d9391", roughness: 0.28, metalness: 0.85 });
    for (const x of [-0.62, 0.62]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.18, 12), exhaustMaterial);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(x, 0.64, 2.02);
      car.add(exhaust);
    }

    type ImpactSpark = { mesh: THREE.Mesh; velocity: THREE.Vector3 };
    type ImpactEffect = { root: THREE.Group; ring: THREE.Mesh; sparks: ImpactSpark[]; light: THREE.PointLight; age: number };
    const impactEffects: ImpactEffect[] = [];
    const impactGeometry = new THREE.OctahedronGeometry(0.085, 0);
    const impactRingGeometry = new THREE.TorusGeometry(0.42, 0.055, 8, 24);
    const findObstacleAt = (x: number, z: number) => {
      const carRadius = 1.28;
      for (const obstacle of obstacles) {
        const closestX = THREE.MathUtils.clamp(x, obstacle.minX, obstacle.maxX);
        const closestZ = THREE.MathUtils.clamp(z, obstacle.minZ, obstacle.maxZ);
        const dx = x - closestX;
        const dz = z - closestZ;
        if (dx * dx + dz * dz < carRadius * carRadius) return obstacle;
      }
      return null;
    };

    const spawnImpactEffect = (obstacle: Obstacle) => {
      const contactX = THREE.MathUtils.clamp(car.position.x, obstacle.minX, obstacle.maxX);
      const contactZ = THREE.MathUtils.clamp(car.position.z, obstacle.minZ, obstacle.maxZ);
      const normal = new THREE.Vector3(car.position.x - contactX, 0, car.position.z - contactZ);
      if (normal.lengthSq() < 0.001) normal.copy(cameraForward).negate();
      normal.normalize();

      const root = new THREE.Group();
      root.position.set(contactX, 0.62, contactZ);
      const ringMaterial = new THREE.MeshBasicMaterial({ color: "#ffbd68", transparent: true, opacity: 0.95, depthWrite: false });
      const ring = new THREE.Mesh(impactRingGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);

      const sparkMaterial = new THREE.MeshBasicMaterial({ color: "#ffe7a4", transparent: true, opacity: 1, depthWrite: false });
      const sparks: ImpactSpark[] = [];
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * Math.PI * 2 + Math.random() * 0.35;
        const spark = new THREE.Mesh(impactGeometry, sparkMaterial.clone());
        spark.position.set(Math.cos(angle) * 0.18, Math.random() * 0.3, Math.sin(angle) * 0.18);
        root.add(spark);
        sparks.push({
          mesh: spark,
          velocity: new THREE.Vector3(
            normal.x * (1.6 + Math.random() * 1.5) + Math.cos(angle) * 0.9,
            1.2 + Math.random() * 1.5,
            normal.z * (1.6 + Math.random() * 1.5) + Math.sin(angle) * 0.9,
          ),
        });
      }
      const light = new THREE.PointLight("#ff9c42", 2.5, 7, 2);
      light.position.y = 0.2;
      root.add(light);
      world.add(root);
      impactEffects.push({ root, ring, sparks, light, age: 0 });
    };

    const updateImpactEffects = (dt: number) => {
      for (let index = impactEffects.length - 1; index >= 0; index -= 1) {
        const effect = impactEffects[index];
        effect.age += dt;
        const progress = effect.age / 0.46;
        const fade = Math.max(0, 1 - progress);
        effect.ring.scale.setScalar(1 + progress * 2.8);
        (effect.ring.material as THREE.MeshBasicMaterial).opacity = fade * 0.95;
        effect.light.intensity = fade * 2.5;
        effect.sparks.forEach((spark) => {
          spark.mesh.position.addScaledVector(spark.velocity, dt);
          spark.velocity.y -= 4.2 * dt;
          spark.mesh.rotation.x += dt * 8;
          spark.mesh.rotation.z += dt * 6;
          (spark.mesh.material as THREE.MeshBasicMaterial).opacity = fade;
        });
        if (effect.age >= 0.46) {
          world.remove(effect.root);
          impactEffects.splice(index, 1);
        }
      }
    };

    const keys = new Set<string>();
    let speedValue = 0;
    let animationFrame = 0;
    let lastTime = performance.now();
    let hudTimer = 0;
    const clock = new THREE.Clock();
    const cameraOffset = new THREE.Vector3(0, 5.6, 8.8);
    const cameraPosition = new THREE.Vector3();
    const cameraLookTarget = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const cameraUp = new THREE.Vector3(0, 1, 0);
    const candidatePosition = new THREE.Vector3();
    let impactCooldown = 0;
    let impactStatusTimer = 0;
    let cameraShake = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    onResize();

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock.getDelta();
      impactCooldown = Math.max(0, impactCooldown - dt);
      impactStatusTimer = Math.max(0, impactStatusTimer - dt);

      const accelerate = keys.has("ArrowUp") || keys.has("KeyW");
      const reverse = keys.has("ArrowDown") || keys.has("KeyS");
      const steerLeft = keys.has("ArrowLeft") || keys.has("KeyA");
      const steerRight = keys.has("ArrowRight") || keys.has("KeyD");
      if (accelerate) speedValue += 16 * dt;
      if (reverse) speedValue -= 11 * dt;
      if (!accelerate && !reverse) speedValue = THREE.MathUtils.damp(speedValue, 0, 4.8, dt);
      speedValue = THREE.MathUtils.clamp(speedValue, -6, 15);

      const steer = (steerLeft ? 1 : 0) - (steerRight ? 1 : 0);
      const steeringStrength = 1.65 * Math.min(Math.abs(speedValue) / 5, 1.25);
      // Steering is always relative to the car itself. Left stays left and right stays right,
      // regardless of where the camera or the world happens to be facing.
      car.rotation.y += steer * steeringStrength * dt;
      car.rotation.z = THREE.MathUtils.damp(car.rotation.z, -steer * 0.055, 8, dt);
      // The car's actual front is its local -Z axis. Transform that local axis
      // into world space so movement always follows the direction the body faces.
      cameraForward.set(0, 0, -1).applyAxisAngle(cameraUp, car.rotation.y);
      candidatePosition.copy(car.position).addScaledVector(cameraForward, speedValue * dt);
      const hitObstacle = findObstacleAt(candidatePosition.x, candidatePosition.z);
      if (hitObstacle) {
        const impactSpeed = Math.abs(speedValue);
        speedValue *= -0.22;
        car.rotation.x = -0.12 * Math.sign(speedValue || 1);
        if (impactCooldown <= 0 && impactSpeed > 0.6) {
          spawnImpactEffect(hitObstacle);
          impactCooldown = 0.42;
          impactStatusTimer = 0.58;
          cameraShake = 0.18;
        }
      } else {
        car.position.copy(candidatePosition);
        car.position.x = THREE.MathUtils.clamp(car.position.x, -94, 94);
        car.position.z = THREE.MathUtils.clamp(car.position.z, -92, 94);
      }
      car.rotation.x = THREE.MathUtils.damp(car.rotation.x, 0, 10, dt);

      wheels.forEach((wheel) => {
        wheel.rotation.x -= speedValue * dt * 2.2;
      });

      // Keep the chase camera rigidly attached to the car's local back/top offset.
      // This prevents the camera from falling behind during turns or acceleration.
      cameraPosition.copy(cameraOffset).applyAxisAngle(cameraUp, car.rotation.y).add(car.position);
      camera.position.copy(cameraPosition);
      if (cameraShake > 0) {
        camera.position.x += (Math.random() - 0.5) * cameraShake;
        camera.position.y += (Math.random() - 0.5) * cameraShake * 0.7;
        cameraShake = Math.max(0, cameraShake - dt * 1.8);
      }
      cameraLookTarget.copy(car.position);
      cameraLookTarget.y += 0.9;
      camera.lookAt(cameraLookTarget);

      stars.rotation.y += dt * 0.002;
      updateImpactEffects(dt);
      hudTimer += dt;
      if (hudTimer > 0.12) {
        hudTimer = 0;
        const kmh = Math.round(Math.abs(speedValue) * 4.2);
        setSpeed(kmh);
        setHeading(headingLabel(-car.rotation.y));
        setStatus(impactStatusTimer > 0 ? "IMPACT" : kmh < 2 ? "PARKED" : speedValue < 0 ? "REVERSING" : "CRUISING");
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main className="game-shell">
      <div ref={sceneRef} className="scene-host" aria-label="Interactive 3D free drive world" />

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

      <div className="world-badge"><span className="badge-line" /><span>HARBOR DISTRICT</span><small>Low-poly sandbox / dusk</small></div>
      <div className="bottom-note"><span className="note-icon">✦</span> EXPLORE A LITTLE. STAY A WHILE.</div>
      <div className="vignette" aria-hidden="true" />
    </main>
  );
}
