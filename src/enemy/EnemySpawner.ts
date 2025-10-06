import { createPolarBearModel } from "../models/EnemyModel.js";
import { EnemyHealthBar } from "./EnemyHealthBar.js";
import { EnemyAI } from "./EnemyAI.js";
import type { EnemyData } from "./EnemyManager.js";

/**
 * 敵のスポーン処理を管理するクラス
 */
export class EnemySpawner {
  private healthBarManager: EnemyHealthBar;
  private ai: EnemyAI;
  private safeZoneRadius: number;
  private spawnAreaWidth: number;
  private spawnAreaDepth: number;
  private enemyMaxHp: number;

  constructor(
    healthBarManager: EnemyHealthBar,
    ai: EnemyAI,
    safeZoneRadius: number,
    spawnAreaWidth: number,
    spawnAreaDepth: number,
    enemyMaxHp: number
  ) {
    this.healthBarManager = healthBarManager;
    this.ai = ai;
    this.safeZoneRadius = safeZoneRadius;
    this.spawnAreaWidth = spawnAreaWidth;
    this.spawnAreaDepth = spawnAreaDepth;
    this.enemyMaxHp = enemyMaxHp;
  }

  /**
   * 単体の敵をスポーン
   */
  public spawnSingleEnemy(): EnemyData {
    const enemyMesh = createPolarBearModel();

    // セーフゾーンの外側にスポーンする位置を探す
    let x = 0;
    let z = 0;
    let distanceFromOrigin = 0;

    do {
      x = (Math.random() - 0.5) * this.spawnAreaWidth;
      z = -Math.random() * this.spawnAreaDepth;
      distanceFromOrigin = Math.sqrt(x * x + z * z);
    } while (distanceFromOrigin < this.safeZoneRadius);

    enemyMesh.position.set(x, 0, z);

    // 大きさを3倍にする
    enemyMesh.scale.set(3, 3, 3);

    // 主人公の方向を向ける（主人公は原点にいる）
    enemyMesh.lookAt(0, 0, 0);

    // HPゲージを作成
    const healthBar = this.healthBarManager.createHealthBar();
    healthBar.position.set(0, 1.5, 0); // 敵の上に配置
    enemyMesh.add(healthBar);

    // 敵データを作成
    const enemyData: EnemyData = {
      mesh: enemyMesh,
      hp: this.enemyMaxHp,
      maxHp: this.enemyMaxHp,
      healthBar: healthBar,
      wanderTarget: this.ai.generateWanderTarget(),
      lastAttackTime: 0,
    };

    return enemyData;
  }
}
