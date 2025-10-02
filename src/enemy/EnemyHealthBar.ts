import * as THREE from "three";

/**
 * 敵のHPゲージ管理クラス
 * HPゲージの作成、更新、カメラ追従を担当します
 */
export class EnemyHealthBar {
  /**
   * HPゲージを作成
   * 敵の上部に細く短いゲージを表示します
   */
  public createHealthBar(): THREE.Group {
    const healthBarGroup = new THREE.Group();

    // 背景（赤いバー）
    const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    healthBarGroup.add(background);

    // 前景（緑のバー、HP残量を示す）
    const fgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const fgMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const foreground = new THREE.Mesh(fgGeometry, fgMaterial);
    foreground.position.z = 0.01; // 少し前に配置
    foreground.name = "healthBarForeground"; // 後で更新できるように名前を付ける
    healthBarGroup.add(foreground);

    return healthBarGroup;
  }

  /**
   * HPゲージを更新
   * HP残量に応じてバーの幅を変更します
   */
  public updateHealthBar(
    healthBar: THREE.Group,
    hp: number,
    maxHp: number
  ): void {
    const foreground = healthBar.getObjectByName("healthBarForeground");

    if (foreground) {
      const hpRatio = Math.max(0, hp / maxHp);
      foreground.scale.x = hpRatio;
      foreground.position.x = -(1 - hpRatio);
    }
  }

  /**
   * HPゲージをカメラの方に向ける（ビルボード効果）
   */
  public updateBillboard(
    healthBar: THREE.Group,
    cameraPosition: THREE.Vector3
  ): void {
    healthBar.lookAt(cameraPosition);
  }
}
