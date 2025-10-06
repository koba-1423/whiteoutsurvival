import * as THREE from "three";
import { CollisionBox } from "../rendering/SceneManager.js";

const STONE_COLOR = 0x808080;
const DARK_STONE_COLOR = 0x505050;
const WOOD_COLOR = 0x8b6f47;

/**
 * タワーの土台を作成
 */
function createTowerBase(scene: THREE.Scene, x: number, z: number): void {
  // 石の土台（四角錐台）
  const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1.0, 8);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: DARK_STONE_COLOR,
    roughness: 0.9,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(x, 0.5, z);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);
}

/**
 * タワーの本体を作成
 */
function createTowerBody(scene: THREE.Scene, x: number, z: number): void {
  // 石のタワー本体
  const bodyGeometry = new THREE.CylinderGeometry(1.0, 1.0, 3.0, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: STONE_COLOR,
    roughness: 0.8,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(x, 2.5, z);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);

  // 窓（装飾）
  const windowGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.1);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
  });

  const windowPositions = [
    { x: 0.9, y: 2.5, z: 0, rotation: 0 },
    { x: -0.9, y: 2.5, z: 0, rotation: Math.PI },
    { x: 0, y: 2.5, z: 0.9, rotation: Math.PI / 2 },
    { x: 0, y: 2.5, z: -0.9, rotation: -Math.PI / 2 },
  ];

  windowPositions.forEach((pos) => {
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(x + pos.x, pos.y, z + pos.z);
    window.rotation.y = pos.rotation;
    scene.add(window);
  });
}

/**
 * タワーの屋根を作成
 */
function createTowerRoof(scene: THREE.Scene, x: number, z: number): void {
  // 円錐形の屋根
  const roofGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: WOOD_COLOR,
    roughness: 0.8,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(x, 4.75, z);
  roof.castShadow = true;
  scene.add(roof);

  // 旗のポール
  const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.6,
    metalness: 0.8,
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.set(x, 6.0, z);
  scene.add(pole);

  // 旗
  const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
  const flagMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(x + 0.3, 6.3, z);
  scene.add(flag);
}

/**
 * タワーエリアを作成
 * 自動で敵を攻撃する防衛タワー
 */
export function createTowerArea(
  scene: THREE.Scene,
  x: number,
  z: number
): CollisionBox[] {
  createTowerBase(scene, x, z);
  createTowerBody(scene, x, z);
  createTowerRoof(scene, x, z);

  return [
    {
      minX: x - 1.5,
      maxX: x + 1.5,
      minZ: z - 1.5,
      maxZ: z + 1.5,
    },
  ];
}
