import * as THREE from "three";

/**
 * プレイヤー（人間）の3Dモデルを作成
 * 体、頭、腕、脚のパーツで構成されます
 */
export function createPlayerModel(): THREE.Group {
  const group = new THREE.Group();

  // 体（円柱）
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // 頭（球体）
  const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.4;
  head.castShadow = true;
  group.add(head);

  // 左腕（円柱）
  const armGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.4, 0.8, 0);
  leftArm.rotation.z = 0.3;
  leftArm.castShadow = true;
  group.add(leftArm);

  // 右腕（円柱）
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.4, 0.8, 0);
  rightArm.rotation.z = -0.3;
  rightArm.castShadow = true;
  group.add(rightArm);

  // 脚のジオメトリとマテリアル
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });

  // 左脚
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, -0.4, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  // 右脚
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.15, -0.4, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  return group;
}
