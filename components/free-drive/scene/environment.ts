import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Environment, Obstacle, ObstacleKind, RoadZone } from "../types";

export function createEnvironment(scene: THREE.Scene): Environment {    const world = new THREE.Group();
    scene.add(world);


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


  return { world, stars, obstacles };
}
