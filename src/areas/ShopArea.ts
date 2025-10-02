import * as THREE from "three";
import { CollisionBox } from "../rendering/SceneManager.js";

const WOOD_COLOR = 0x8b6f47;
const DARK_WOOD_COLOR = 0x654321;
const GOLD_COLOR = 0xffea00;
const MEAT_COLOR = 0xa04040;

/**
 * テーブルを作成
 */
function createShopTable(scene: THREE.Scene, x: number, z: number): void {
  const tableTopGeometry = new THREE.BoxGeometry(4, 0.2, 2);
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
    [-1.7, 0.6, -0.8],
    [1.7, 0.6, -0.8],
    [-1.7, 0.6, 0.8],
    [1.7, 0.6, 0.8],
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
 * 金貨を作成
 */
function createCoins(scene: THREE.Scene, x: number, z: number): void {
  const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: GOLD_COLOR,
    roughness: 0.2,
    metalness: 1.0,
  });

  const coinPositions = [
    [-1.2, 1.35, -0.3],
    [-0.9, 1.35, -0.2],
    [-1.05, 1.35, 0.0],
    [-1.05, 1.45, -0.25],
    [-1.0, 1.45, 0.0],
    [-1.0, 1.55, -0.1],
  ];

  coinPositions.forEach((pos) => {
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(x + pos[0], pos[1], z + pos[2]);
    coin.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    coin.castShadow = true;
    scene.add(coin);
  });
}

/**
 * 加工肉を作成
 */
function createMeat(scene: THREE.Scene, x: number, z: number): void {
  const meatGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.4);
  const meatMaterial = new THREE.MeshStandardMaterial({
    color: MEAT_COLOR,
    roughness: 0.8,
  });

  const meatPositions = [
    [0.8, 1.35, -0.2],
    [1.1, 1.35, 0.1],
  ];

  meatPositions.forEach((pos) => {
    const meat = new THREE.Mesh(meatGeometry, meatMaterial);
    meat.position.set(x + pos[0], pos[1], z + pos[2]);
    meat.rotation.y = (Math.random() - 0.5) * 0.5;
    meat.castShadow = true;
    scene.add(meat);
  });
}

/**
 * 看板を作成
 */
function createSign(scene: THREE.Scene, x: number, z: number): void {
  const signGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.1);
  const signMaterial = new THREE.MeshStandardMaterial({
    color: DARK_WOOD_COLOR,
    roughness: 0.8,
  });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(x, 1.8, z - 0.9);
  sign.castShadow = true;
  scene.add(sign);

  const markGeometry = new THREE.CircleGeometry(0.2, 16);
  const markMaterial = new THREE.MeshStandardMaterial({
    color: GOLD_COLOR,
    roughness: 0.2,
    metalness: 1.0,
  });
  const mark = new THREE.Mesh(markGeometry, markMaterial);
  mark.position.set(x, 1.8, z - 0.85);
  mark.rotation.y = Math.PI;
  scene.add(mark);
}

/**
 * 換金エリア（ショップ）を作成
 * 加工肉を売る場所
 */
export function createShopArea(
  scene: THREE.Scene,
  x: number,
  z: number
): CollisionBox[] {
  createShopTable(scene, x, z);
  createCoins(scene, x, z);
  createMeat(scene, x, z);
  createSign(scene, x, z);

  return [
    {
      minX: x - 2,
      maxX: x + 2,
      minZ: z - 1,
      maxZ: z + 1,
    },
  ];
}
