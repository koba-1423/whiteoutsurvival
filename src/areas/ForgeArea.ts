import * as THREE from "three";
import { CollisionBox } from "../rendering/SceneManager.js";

const DARK_METAL_COLOR = 0x404040;
const METAL_COLOR = 0x808080;
const DARK_WOOD_COLOR = 0x654321;

/**
 * 金床（anvil）を作成
 */
function createAnvil(scene: THREE.Scene, x: number, z: number): void {
  // 金床の台座
  const baseGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: DARK_METAL_COLOR,
    roughness: 0.6,
    metalness: 0.9,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(x, 0.8, z);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // 金床の上部
  const topGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.5);
  const topMaterial = new THREE.MeshStandardMaterial({
    color: METAL_COLOR,
    roughness: 0.5,
    metalness: 1.0,
  });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.set(x, 1.25, z);
  top.castShadow = true;
  scene.add(top);
}

/**
 * 大きな剣を作成（アイコン的に）
 */
function createBigSword(scene: THREE.Scene, x: number, z: number): void {
  // 大きな剣の刃
  const bladeGeometry = new THREE.BoxGeometry(0.3, 3.0, 0.1);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, // シルバー
    roughness: 0.3,
    metalness: 1.0,
  });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.set(x, 2.5, z);
  blade.castShadow = true;
  blade.receiveShadow = true;
  scene.add(blade);

  // 剣の鍔（つば）
  const guardGeometry = new THREE.BoxGeometry(1.0, 0.15, 0.15);
  const guardMaterial = new THREE.MeshStandardMaterial({
    color: METAL_COLOR,
    roughness: 0.4,
    metalness: 0.9,
  });
  const guard = new THREE.Mesh(guardGeometry, guardMaterial);
  guard.position.set(x, 1.0, z);
  guard.castShadow = true;
  scene.add(guard);

  // 剣の柄
  const handleGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: DARK_WOOD_COLOR,
    roughness: 0.7,
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(x, 0.5, z);
  handle.castShadow = true;
  scene.add(handle);

  // 剣の柄頭（ポンメル）
  const pommelGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const pommelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700, // 金色
    roughness: 0.3,
    metalness: 1.0,
  });
  const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
  pommel.position.set(x, 0.15, z);
  pommel.castShadow = true;
  scene.add(pommel);
}

/**
 * 武器アップグレードエリア（鍛冶場）を作成
 * 武器をアップグレードする場所
 */
export function createForgeArea(
  scene: THREE.Scene,
  x: number,
  z: number
): CollisionBox[] {
  createBigSword(scene, x, z);
  createAnvil(scene, x - 1.2, z - 0.3);

  return [
    {
      minX: x - 1.8,
      maxX: x + 0.3,
      minZ: z - 0.6,
      maxZ: z + 0.6,
    },
  ];
}
