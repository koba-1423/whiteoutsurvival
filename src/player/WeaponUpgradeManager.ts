import * as THREE from "three";
import { createSwordModel } from "../models/WeaponModel.js";

/**
 * 武器アップグレード管理クラス
 */
export class WeaponUpgradeManager {
  private currentSword: THREE.Group | null = null;

  /**
   * 武器を更新
   */
  public updateSword(weaponLevel: number, mesh: THREE.Group): void {
    // 既存の武器を削除
    if (this.currentSword) {
      mesh.remove(this.currentSword);
    }

    // 新しい武器を作成
    this.currentSword = createSwordModel();
    this.currentSword.position.set(0.3, 0.8, 0);
    this.currentSword.rotation.z = -Math.PI / 4;

    // 武器の見た目を段階的に変化させる
    if (weaponLevel >= 1) {
      // レベル1: 基本の剣（デフォルト）
      this.currentSword.scale.set(1, 1, 1);
      this.updateSwordColor(0x888888);
    }

    if (weaponLevel >= 2) {
      // レベル2: 少し大きく、色を青に
      this.currentSword.scale.set(1.1, 1.1, 1.1);
      this.updateSwordColor(0x4444ff);
    }

    if (weaponLevel >= 3) {
      // レベル3: さらに大きく、色を緑に
      this.currentSword.scale.set(1.2, 1.2, 1.2);
      this.updateSwordColor(0x44ff44);
    }

    if (weaponLevel >= 4) {
      // レベル4: さらに大きく、色を赤に
      this.currentSword.scale.set(1.3, 1.3, 1.3);
      this.updateSwordColor(0xff4444);
    }

    if (weaponLevel >= 5) {
      // レベル5: 最大サイズ、色を金色に
      this.currentSword.scale.set(1.4, 1.4, 1.4);
      this.updateSwordColor(0xffdd44);
    }

    // プレイヤーメッシュに武器を追加
    mesh.add(this.currentSword);
  }

  /**
   * 武器の色を更新
   */
  private updateSwordColor(color: number): void {
    if (this.currentSword) {
      this.currentSword.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshLambertMaterial) {
                mat.color.setHex(color);
              }
            });
          } else if (child.material instanceof THREE.MeshLambertMaterial) {
            child.material.color.setHex(color);
          }
        }
      });
    }
  }
}
