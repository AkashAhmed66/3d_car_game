import * as THREE from "three";

export type HudHeading = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type RoadZone = {
  axis: "x" | "z";
  center: number;
  alongCenter: number;
  halfLength: number;
  halfWidth: number;
};

export type ObstacleKind = "building" | "tree" | "lamp" | "sign" | "wall";

export type Obstacle = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  kind: ObstacleKind;
  x: number;
  z: number;
};

export type HudSnapshot = {
  speed: number;
  heading: HudHeading;
  status: string;
};

export type CarRig = {
  car: THREE.Group;
  wheels: THREE.Group[];
};

export type Environment = {
  world: THREE.Group;
  stars: THREE.Points;
  obstacles: Obstacle[];
};

export type ImpactSystem = {
  findObstacleAt: (x: number, z: number) => Obstacle | null;
  spawnImpactEffect: (obstacle: Obstacle, fallbackDirection: THREE.Vector3) => void;
  updateImpactEffects: (dt: number) => void;
};
