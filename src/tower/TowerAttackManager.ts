import * as THREE from "three";
import { EnemyManager } from "../enemy/EnemyManager.js";
import { calculateDamage } from "../state/frost_survival_design.js";

/**
 * タワー攻撃管理クラス
 * タワーの自動攻撃機能を管理します
 */
export class TowerAttackManager {
  private lastAttackTime: number = 0;
  private attackCooldown: number = 2.0; // 攻撃間隔（秒）
  private attackRange: number = 15.0; // 攻撃範囲
  private towerPosition: THREE.Vector3;
  private clock: THREE.Clock;

  constructor(towerPosition: THREE.Vector3, clock: THREE.Clock) {
    this.towerPosition = towerPosition;
    this.clock = clock;
  }

  /**
   * タワーの攻撃処理
   * 範囲内の敵を自動で攻撃します
   */
  public update(enemyManager: EnemyManager): void {
    const currentTime = this.clock.getElapsedTime();

    // 攻撃クールダウンチェック
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    // 攻撃範囲内の敵を検索
    const enemiesInRange = this.getEnemiesInRange(enemyManager);

    if (enemiesInRange.length > 0) {
      // 最も近い敵を攻撃
      const target = this.getNearestEnemy(enemiesInRange);
      if (target) {
        this.attackEnemy(target, enemyManager);
        this.lastAttackTime = currentTime;
      }
    }
  }

  /**
   * 攻撃範囲内の敵を取得
   */
  private getEnemiesInRange(enemyManager: EnemyManager): THREE.Object3D[] {
    const enemies = enemyManager.getEnemies();
    return enemies.filter((enemy) => {
      const distance = enemy.position.distanceTo(this.towerPosition);
      return distance <= this.attackRange;
    });
  }

  /**
   * 最も近い敵を取得
   */
  private getNearestEnemy(enemies: THREE.Object3D[]): THREE.Object3D | null {
    if (enemies.length === 0) return null;

    let nearestEnemy = enemies[0];
    let nearestDistance = nearestEnemy.position.distanceTo(this.towerPosition);

    for (let i = 1; i < enemies.length; i++) {
      const distance = enemies[i].position.distanceTo(this.towerPosition);
      if (distance < nearestDistance) {
        nearestEnemy = enemies[i];
        nearestDistance = distance;
      }
    }

    return nearestEnemy;
  }

  /**
   * 敵を攻撃
   */
  private attackEnemy(enemy: THREE.Object3D, enemyManager: EnemyManager): void {
    // タワーの攻撃力を計算（プレイヤーと同じ攻撃力）
    const towerWeaponLevel = 1; // タワーの武器レベル（固定）
    const damage = calculateDamage(towerWeaponLevel);

    // 敵にダメージを与える
    enemyManager.damageEnemy(enemy, damage);
  }

  /**
   * タワーの攻撃力を取得
   */
  public getTowerAttackPower(): number {
    const towerWeaponLevel = 1; // タワーの武器レベル（固定）
    return calculateDamage(towerWeaponLevel);
  }

  /**
   * タワーの攻撃範囲を取得
   */
  public getAttackRange(): number {
    return this.attackRange;
  }
}
