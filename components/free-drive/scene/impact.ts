import * as THREE from "three";
import type { ImpactSystem, Obstacle } from "../types";

type ImpactSpark = { mesh: THREE.Mesh; velocity: THREE.Vector3 };
type ImpactEffect = { root: THREE.Group; ring: THREE.Mesh; sparks: ImpactSpark[]; light: THREE.PointLight; age: number };

export function createImpactSystem(world: THREE.Group, car: THREE.Group, obstacles: Obstacle[]): ImpactSystem {    const impactEffects: ImpactEffect[] = [];
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

    const spawnImpactEffect = (obstacle: Obstacle, fallbackDirection: THREE.Vector3) => {
      const contactX = THREE.MathUtils.clamp(car.position.x, obstacle.minX, obstacle.maxX);
      const contactZ = THREE.MathUtils.clamp(car.position.z, obstacle.minZ, obstacle.maxZ);
      const normal = new THREE.Vector3(car.position.x - contactX, 0, car.position.z - contactZ);
      if (normal.lengthSq() < 0.001) normal.copy(fallbackDirection).negate();
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


  return { findObstacleAt, spawnImpactEffect, updateImpactEffects };
}