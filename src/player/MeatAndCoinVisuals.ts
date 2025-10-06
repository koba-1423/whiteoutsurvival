import * as THREE from "three";

export function createRawMeatVisual(): THREE.Object3D {
  const group = new THREE.Group();

  const steakGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.08, 20);
  const steakMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    metalness: 0.05,
    roughness: 0.8,
  });
  const steakMesh = new THREE.Mesh(steakGeometry, steakMaterial);
  steakMesh.scale.set(1.6, 1.0, 1.2);
  steakMesh.castShadow = false;
  steakMesh.receiveShadow = false;
  group.add(steakMesh);

  const fatGeometry = new THREE.BoxGeometry(0.06, 0.008, 0.36);
  const fatMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff2cc,
    metalness: 0.1,
    roughness: 0.6,
    emissive: 0x000000,
  });
  const fatMesh = new THREE.Mesh(fatGeometry, fatMaterial);
  fatMesh.position.set(0, 0.042, 0);
  fatMesh.rotation.y = (Math.random() - 0.5) * 0.4;
  fatMesh.castShadow = false;
  group.add(fatMesh);

  group.rotation.y = Math.random() * Math.PI * 2;
  group.rotation.x = (Math.random() - 0.5) * 0.02;
  group.rotation.z = (Math.random() - 0.5) * 0.02;
  group.userData.meatType = "raw";
  return group;
}

export function createCookedMeatVisual(): THREE.Object3D {
  const group = new THREE.Group();
  const steakGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.06, 20);
  const steakMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a1a1a,
    metalness: 0.0,
    roughness: 0.85,
  });
  const steakMesh = new THREE.Mesh(steakGeometry, steakMaterial);
  steakMesh.scale.set(1.6, 1.0, 1.2);
  steakMesh.castShadow = false;
  steakMesh.receiveShadow = false;
  group.add(steakMesh);

  const fatGeometry = new THREE.BoxGeometry(0.06, 0.006, 0.36);
  const fatMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8,
    metalness: 0.05,
    roughness: 0.6,
  });
  const fatMesh = new THREE.Mesh(fatGeometry, fatMaterial);
  fatMesh.position.set(0, 0.038, 0);
  fatMesh.rotation.y = (Math.random() - 0.5) * 0.4;
  fatMesh.castShadow = false;
  group.add(fatMesh);

  group.rotation.y = Math.random() * Math.PI * 2;
  group.rotation.x = (Math.random() - 0.5) * 0.02;
  group.rotation.z = (Math.random() - 0.5) * 0.02;
  group.userData.meatType = "cooked";
  return group;
}

export function createCoinVisual(): THREE.Object3D {
  const group = new THREE.Group();
  const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    metalness: 0.6,
    roughness: 0.3,
  });
  const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
  // 広い面を水平に
  coinMesh.castShadow = false;
  coinMesh.receiveShadow = false;
  group.add(coinMesh);

  group.rotation.y = Math.random() * Math.PI * 2;
  group.rotation.x = (Math.random() - 0.5) * 0.02;
  group.rotation.z = (Math.random() - 0.5) * 0.02;
  group.userData.meatType = "coin";
  return group;
}
