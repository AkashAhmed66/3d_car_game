import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { CarRig } from "../types";

export function createCar(world: THREE.Group): CarRig {    const car = new THREE.Group();
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


  return { car, wheels };
}