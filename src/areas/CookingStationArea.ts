import * as THREE from "three";
import { CollisionBox } from "../rendering/SceneManager.js";

const WOOD_COLOR = 0x8b6f47;
const DARK_WOOD_COLOR = 0x654321;

/**
 * テーブルを作成
 */
function createTable(scene: THREE.Scene, x: number, z: number): void {
  const tableTopGeometry = new THREE.BoxGeometry(3, 0.2, 2);
  const tableTopMaterial = new THREE.MeshStandardMaterial({
    color: WOOD_COLOR,
    roughness: 0.8,
  });
  const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
  tableTop.position.set(x, 1.2, z);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  scene.add(tableTop);

  const legGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: DARK_WOOD_COLOR,
    roughness: 0.9,
  });

  const legPositions = [
    [-1.2, 0.6, -0.8],
    [1.2, 0.6, -0.8],
    [-1.2, 0.6, 0.8],
    [1.2, 0.6, 0.8],
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x + pos[0], pos[1], z + pos[2]);
    leg.castShadow = true;
    leg.receiveShadow = true;
    scene.add(leg);
  });
}

/**
 * 装飾品を作成
 */
function createDecorations(scene: THREE.Scene, x: number, z: number): void {
  const bowlGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.3, 16);
  const bowlMaterial = new THREE.MeshStandardMaterial({
    color: DARK_WOOD_COLOR,
    roughness: 0.7,
  });
  const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
  bowl.position.set(x - 0.5, 1.5, z);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  const knifeGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.15);
  const knifeMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    roughness: 0.3,
    metalness: 0.8,
  });
  const knife = new THREE.Mesh(knifeGeometry, knifeMaterial);
  knife.position.set(x + 0.6, 1.4, z + 0.3);
  knife.rotation.y = Math.PI / 4;
  knife.castShadow = true;
  scene.add(knife);
}

/**
 * 加工エリア（調理台）を作成
 * 北欧風の木製作業台で、肉を加工するエリア
 */
export function createCookingStationArea(
  scene: THREE.Scene,
  x: number,
  z: number
): CollisionBox[] {
  createTable(scene, x, z);
  createDecorations(scene, x, z);

  return [
    {
      minX: x - 2.0,
      maxX: x + 2.0,
      minZ: z - 1.4,
      maxZ: z + 1.4,
    },
  ];
}
