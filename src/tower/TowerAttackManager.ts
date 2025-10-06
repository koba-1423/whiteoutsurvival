import * as THREE from "three";
import { EnemyManager } from "../enemy/EnemyManager.js";

/**
 * タワー攻撃管理クラス
 * タワーの自動攻撃機能を管理します
 */
export class TowerAttackManager {
  private lastAttackTime: number = 0;
  private attackCooldown: number = 1.0; // 攻撃間隔（秒）
  private attackRange: number = 15.0; // 攻撃範囲
  private towerPosition: THREE.Vector3;
  private clock: THREE.Clock;
  private isActive: boolean = false; // タワーがアクティブかどうか
  private towerLevel: number = 0; // タワーのレベル

  constructor(towerPosition: THREE.Vector3, clock: THREE.Clock) {
    this.towerPosition = towerPosition;
    this.clock = clock;
  }

  /**
   * タワーの攻撃処理
   * 範囲内の敵を自動で攻撃します
   */
  public update(enemyManager: EnemyManager): void {
    // タワーがアクティブでない場合は攻撃しない
    if (!this.isActive) {
      return;
    }

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
    // タワーの攻撃力を計算（レベルに応じて1.1倍ずつ増加）
    const baseDamage = 10; // 基本ダメージ（主人公の初期攻撃力）
    const damage = Math.floor(baseDamage * Math.pow(1.1, this.towerLevel));

    // 敵にダメージを与える
    enemyManager.damageEnemy(enemy, damage);
  }

  /**
   * タワーをアップグレード
   */
  public upgradeTower(): boolean {
    if (!this.isActive) {
      // 初回アップグレードでタワーをアクティブ化
      this.isActive = true;
      this.towerLevel = 1;
      return true;
    } else {
      // 2回目以降はレベルを上げる
      this.towerLevel += 1;
      return true;
    }
  }

  /**
   * タワーの攻撃力を取得
   */
  public getTowerAttackPower(): number {
    if (!this.isActive) return 0;
    const baseDamage = 10; // 基本ダメージ（主人公の初期攻撃力）
    return Math.floor(baseDamage * Math.pow(1.1, this.towerLevel - 1));
  }

  /**
   * タワーがアクティブかどうか
   */
  public isTowerActive(): boolean {
    return this.isActive;
  }

  /**
   * タワーのレベルを取得
   */
  public getTowerLevel(): number {
    return this.towerLevel;
  }

  /**
   * タワーの攻撃範囲を取得
   */
  public getAttackRange(): number {
    return this.attackRange;
  }
}
