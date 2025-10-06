import * as THREE from "three";

/**
 * コインスタック管理用のユーティリティ関数
 */
export function removeCoinStack(
  meatStackGroup: THREE.Group,
  meatStackCount: number,
  count: number = 1
): number {
  let removed = 0;
  for (let i = 0; i < count; i++) {
    let removedOne = false;
    for (let idx = meatStackGroup.children.length - 1; idx >= 0; idx--) {
      const child = meatStackGroup.children[idx] as THREE.Object3D;
      const type =
        (child.userData && (child.userData as any).meatType) || undefined;
      if (type === "coin") {
        meatStackGroup.remove(child);
        removed += 1;
        removedOne = true;
        break;
      }
    }
    if (!removedOne) break;
  }
  // 高さを詰める
  meatStackGroup.children.forEach((child, index) => {
    child.position.y = index * 0.095;
  });
  return removed;
}
