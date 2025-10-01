import * as THREE from "three";

/**
 * シロクマの3Dモデルを作成
 * 体、頭、耳、鼻、4本の脚で構成されます
 * 脚には名前をつけて、歩行アニメーションができるようにしています
 */
export function createPolarBearModel(): THREE.Group {
  const group = new THREE.Group();
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  // 体（楕円形の球体）
  const bodyGeometry = new THREE.SphereGeometry(0.4, 12, 12);
  const body = new THREE.Mesh(bodyGeometry, whiteMaterial);
  body.scale.set(1, 0.8, 1.2); // 楕円形にする
  body.position.y = 0.3;
  body.castShadow = true;
  body.name = "body"; // アニメーション用に名前をつける
  group.add(body);

  // 頭（球体）
  const headGeometry = new THREE.SphereGeometry(0.25, 12, 12);
  const head = new THREE.Mesh(headGeometry, whiteMaterial);
  head.position.set(0, 0.5, 0.4);
  head.castShadow = true;
  head.name = "head";
  group.add(head);

  // 左耳（小さな球体）
  const earGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const leftEar = new THREE.Mesh(earGeometry, whiteMaterial);
  leftEar.position.set(-0.15, 0.65, 0.4);
  leftEar.castShadow = true;
  group.add(leftEar);

  // 右耳（小さな球体）
  const rightEar = new THREE.Mesh(earGeometry, whiteMaterial);
  rightEar.position.set(0.15, 0.65, 0.4);
  rightEar.castShadow = true;
  group.add(rightEar);

  // 鼻（黒い小さな球体）
  const noseGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 0.5, 0.62);
  nose.castShadow = true;
  group.add(nose);

  // 脚（4本）- 歩行アニメーション用に名前をつける
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
  const positions = [
    { x: -0.2, z: 0.2, name: "legFrontLeft" },
    { x: 0.2, z: 0.2, name: "legFrontRight" },
    { x: -0.2, z: -0.2, name: "legBackLeft" },
    { x: 0.2, z: -0.2, name: "legBackRight" },
  ];

  positions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeometry, whiteMaterial);
    leg.position.set(pos.x, 0.05, pos.z);
    leg.castShadow = true;
    leg.name = pos.name; // アニメーション用に名前をつける
    group.add(leg);
  });

  return group;
}
