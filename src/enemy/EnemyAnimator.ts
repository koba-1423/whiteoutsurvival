import * as THREE from "three";

/**
 * 敵のアニメーション管理クラス
 * 敵の歩行アニメーションを担当します
 */
export class EnemyAnimator {
  /**
   * 歩くアニメーション
   * 脚を前後に動かして、体を上下に揺らします
   */
  public animateWalking(enemy: THREE.Object3D, currentTime: number): void {
    // 歩行サイクルの速度
    const walkSpeed = 4.0;
    const walkCycle = Math.sin(currentTime * walkSpeed);

    // 脚を取得
    const legFrontLeft = enemy.getObjectByName("legFrontLeft");
    const legFrontRight = enemy.getObjectByName("legFrontRight");
    const legBackLeft = enemy.getObjectByName("legBackLeft");
    const legBackRight = enemy.getObjectByName("legBackRight");

    // 体を取得
    const body = enemy.getObjectByName("body");

    // 脚を前後に動かす（前左と後右が同期、前右と後左が同期）
    if (legFrontLeft) {
      legFrontLeft.rotation.x = walkCycle * 0.3;
    }
    if (legBackRight) {
      legBackRight.rotation.x = walkCycle * 0.3;
    }
    if (legFrontRight) {
      legFrontRight.rotation.x = -walkCycle * 0.3;
    }
    if (legBackLeft) {
      legBackLeft.rotation.x = -walkCycle * 0.3;
    }

    // 体を上下に揺らす
    if (body) {
      body.position.y = 0.3 + Math.abs(walkCycle) * 0.05;
    }
  }
}
