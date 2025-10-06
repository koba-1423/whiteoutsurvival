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
  private arrows: any[] = []; // 飛んでいる矢の配列（一時的にany型）
  private scene: THREE.Scene;
  private onEnemyKilled?: (_enemy: THREE.Object3D) => void; // 敵を倒した時のコールバック

  constructor(
    towerPosition: THREE.Vector3,
    clock: THREE.Clock,
    scene: THREE.Scene,
    onEnemyKilled?: (_enemy: THREE.Object3D) => void
  ) {
    this.towerPosition = towerPosition;
    this.clock = clock;
    this.scene = scene;
    this.onEnemyKilled = onEnemyKilled;
    this.isActive = false;
    this.towerLevel = 0;
    this.arrows = [];
  }

  /**
   * タワーの攻撃処理
   * 範囲内の敵を自動で攻撃します
   */
  public update(enemyManager: EnemyManager, deltaTime: number): void {
    // タワーがアクティブでない場合は攻撃しない
    if (!this.isActive) {
      return;
    }

    const currentTime = this.clock.getElapsedTime();

    // 攻撃クールダウンチェック
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      // 矢の更新
      this.updateArrows(deltaTime);
      return;
    }

    // 攻撃範囲内の敵を検索
    const enemiesInRange = this.getEnemiesInRange(enemyManager);

    if (enemiesInRange.length > 0) {
      // 最も近い敵を攻撃
      const target = this.getNearestEnemy(enemiesInRange);
      if (target) {
        this.shootArrow(target, enemyManager);
        this.lastAttackTime = currentTime;
      }
    }

    // 矢の更新
    this.updateArrows(deltaTime);
  }

  /**
   * 攻撃範囲内の敵を取得
   */
  private getEnemiesInRange(enemyManager: EnemyManager): THREE.Object3D[] {
    const enemies = enemyManager.getEnemies();
    const enemiesInRange = enemies.filter((enemy) => {
      const distance = enemy.position.distanceTo(this.towerPosition);
      return distance <= this.attackRange;
    });


    return enemiesInRange;
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
   * 矢を放つ（一時的にシンプルな実装）
   */
  private shootArrow(target: THREE.Object3D, enemyManager: EnemyManager): void {
    // 一時的に直接ダメージを与える（矢のエフェクトは後で実装）
    this.handleArrowHit(target, enemyManager);
  }

  /**
   * 矢が敵に当たった時の処理
   */
  private handleArrowHit(
    target: THREE.Object3D,
    enemyManager: EnemyManager
  ): void {
    // タワーの攻撃力を計算（レベルに応じて1.1倍ずつ増加）
    const baseDamage = 10; // 基本ダメージ（主人公の初期攻撃力）
    const damage = Math.floor(baseDamage * Math.pow(1.1, this.towerLevel));

    // 敵にダメージを与える
    const wasKilled = enemyManager.damageEnemy(target, damage);

    // 敵が倒された場合、主人公の頭上に生肉を追加
    if (wasKilled && this.onEnemyKilled) {
      this.onEnemyKilled(target);
    }
  }

  /**
   * 矢の更新（一時的に空の実装）
   */
  private updateArrows(_deltaTime: number): void {
    // 矢のエフェクトは後で実装
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
