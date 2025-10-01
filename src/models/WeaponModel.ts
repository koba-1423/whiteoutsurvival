import * as THREE from "three";

/**
 * 剣の3Dモデルを作成
 * 剣身と柄で構成されます
 */
export function createSwordModel(): THREE.Group {
  const group = new THREE.Group();

  // 剣身（長方形）
  const bladeGeometry = new THREE.BoxGeometry(0.1, 1.0, 0.05);
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.y = 0.5;
  blade.castShadow = true;
  group.add(blade);

  // 柄（円柱）
  const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.y = -0.15;
  handle.castShadow = true;
  group.add(handle);

  return group;
}
