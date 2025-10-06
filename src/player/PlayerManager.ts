import * as THREE from "three";
import {
  GameState,
  calculateDamage,
  calculateDefense,
} from "../state/frost_survival_design.js";
import { createPlayerModel } from "../models/PlayerModel.js";
import { EffectManager } from "../ui/EffectManager.js";
import type { EnemyManager } from "../enemy/EnemyManager.js";
import { EnemyHealthBar } from "../enemy/EnemyHealthBar.js";
import {
  createRawMeatVisual,
  createCookedMeatVisual,
  createCoinVisual,
} from "./MeatAndCoinVisuals.js";
import { removeCoinStack } from "./CoinStackManager.js";
import { WeaponUpgradeManager } from "./WeaponUpgradeManager.js";
import type { CollisionBox } from "../rendering/SceneManager.js";

/**
 * プレイヤー管理クラス
 * プレイヤーの状態、移動、攻撃、ダメージ処理を管理します
 */
export class PlayerManager {
  public mesh: THREE.Object3D;
  private currentSword: THREE.Group | null = null;
  private lastPlayerAttack: number = 0;
  private attackCooldown: number = 0.3;
  private clock: THREE.Clock;
  private effectManager: EffectManager;
  private healthBarManager: EnemyHealthBar;
  private healthBar?: THREE.Group;
  private lastDamagedAt: number = -Infinity; // 最後に被弾した時刻
  private damageIFrames: number = 0.6; // 被弾後の無敵時間（秒）
  private meatStackGroup: THREE.Group = new THREE.Group();
  private meatStackCount: number = 0;
  private weaponUpgradeManager: WeaponUpgradeManager;

  constructor(
    scene: THREE.Scene,
    clock: THREE.Clock,
    effectManager: EffectManager,
    weaponLevel: number
  ) {
    this.clock = clock;
    this.effectManager = effectManager;

    // プレイヤーモデルを作成
    this.mesh = createPlayerModel();
    // モデルを2.5倍に拡大
    this.mesh.scale.set(2.5, 2.5, 2.5);
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // 武器アップグレード管理を初期化
    this.weaponUpgradeManager = new WeaponUpgradeManager();

    // 武器を作成
    this.updateSword(weaponLevel);

    // HPゲージを作成
    this.healthBarManager = new EnemyHealthBar();
    this.healthBar = this.healthBarManager.createHealthBar();
    this.healthBar.position.set(0, 2.2, 0);
    this.mesh.add(this.healthBar);

    // 肉スタック用グループを頭上に追加
    this.meatStackGroup.position.set(0, 2.5, 0);
    this.mesh.add(this.meatStackGroup);
  }

  /**
   * 武器を更新
   */
  public updateSword(weaponLevel: number): void {
    this.weaponUpgradeManager.updateSword(
      weaponLevel,
      this.mesh as THREE.Group
    );
  }

  /**
   * プレイヤーの移動を更新
   */
  public updateMovement(
    moveVector: THREE.Vector3,
    deltaTime: number,
    collisionBoxes: CollisionBox[] = []
  ): void {
    const moveSpeed = 5.0;

    // 正規化して移動
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(moveSpeed * deltaTime);

      // 新しい位置を計算
      const newPosition = this.mesh.position.clone().add(moveVector);

      // 衝突チェック
      const playerRadius = 0.5; // プレイヤーの半径
      let canMove = true;

      for (const box of collisionBoxes) {
        if (
          newPosition.x + playerRadius > box.minX &&
          newPosition.x - playerRadius < box.maxX &&
          newPosition.z + playerRadius > box.minZ &&
          newPosition.z - playerRadius < box.maxZ
        ) {
          canMove = false;
          break;
        }
      }

      // 衝突しない場合のみ移動
      if (canMove) {
        this.mesh.position.add(moveVector);
      }
    }
  }

  /**
   * プレイヤーの状態を更新
   * 攻撃範囲内に敵がいれば自動的に攻撃します
   */
  public update(
    enemyManager: EnemyManager,
    state: GameState,
    camera: THREE.PerspectiveCamera
  ): void {
    this.handleAttack(enemyManager.getEnemies(), (enemy) => {
      const damage = this.calculateDamage(state.weaponLevel);
      const wasKilled = enemyManager.damageEnemy(enemy, damage);
      if (wasKilled) {
        this.gainResources(state);
        this.addMeatStack(1);
      }
    });

    // HPゲージ更新とカメラ向き
    if (this.healthBar) {
      this.healthBarManager.updateHealthBar(
        this.healthBar,
        state.health,
        state.maxHealth
      );
      this.healthBarManager.updateBillboard(this.healthBar, camera.position);
    }
  }

  /**
   * 肉スタックを頭上に追加表示する
   * 倒した数分だけ積み上がる
   */
  public addMeatStack(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const meat = createRawMeatVisual();
      const index = this.meatStackCount;
      // 縦方向に少しずつ積む。横は微小なランダムで見た目にバリエーション
      const yOffset = index * 0.095; // 1個あたりの厚み分だけ積む
      const xJitter = (Math.random() - 0.5) * 0.06;
      const zJitter = (Math.random() - 0.5) * 0.06;
      meat.position.set(xJitter, yOffset, zJitter);
      this.meatStackGroup.add(meat);
      this.meatStackCount += 1;
    }
  }

  /**
   * 焼いた肉を頭上に追加
   */
  public addCookedMeatStack(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const meat = createCookedMeatVisual();
      const index = this.meatStackCount;
      const yOffset = index * 0.095;
      const xJitter = (Math.random() - 0.5) * 0.06;
      const zJitter = (Math.random() - 0.5) * 0.06;
      meat.position.set(xJitter, yOffset, zJitter);
      this.meatStackGroup.add(meat);
      this.meatStackCount += 1;
    }
  }

  /** 焼肉を上から優先的に取り除く */
  public removeCookedMeatStack(count: number = 1): number {
    let removed = 0;
    for (let i = 0; i < count; i++) {
      let removedOne = false;
      for (let idx = this.meatStackGroup.children.length - 1; idx >= 0; idx--) {
        const child = this.meatStackGroup.children[idx] as THREE.Object3D;
        const type =
          (child.userData && (child.userData as any).meatType) || undefined;
        if (type === "cooked") {
          this.meatStackGroup.remove(child);
          this.meatStackCount = Math.max(0, this.meatStackCount - 1);
          removed += 1;
          removedOne = true;
          break;
        }
      }
      if (!removedOne) break;
    }
    // 高さを詰める
    this.meatStackGroup.children.forEach((child, index) => {
      child.position.y = index * 0.095;
    });
    return removed;
  }

  /**
   * 頭上の肉スタックから取り除く
   * 戻り値: 実際に取り除けた枚数
   */
  public removeRawMeatStack(count: number = 1): number {
    let removed = 0;
    for (let i = 0; i < count; i++) {
      let removedOne = false;
      for (let idx = this.meatStackGroup.children.length - 1; idx >= 0; idx--) {
        const child = this.meatStackGroup.children[idx] as THREE.Object3D;
        const type =
          (child.userData && (child.userData as any).meatType) || undefined;
        if (type === "raw") {
          this.meatStackGroup.remove(child);
          this.meatStackCount = Math.max(0, this.meatStackCount - 1);
          removed += 1;
          removedOne = true;
          break;
        }
      }
      if (!removedOne) {
        break;
      }
    }
    // 高さを詰める
    this.meatStackGroup.children.forEach((child, index) => {
      child.position.y = index * 0.095;
    });
    return removed;
  }

  /** コインを頭上に追加 */
  public addCoinStack(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const coin = createCoinVisual();
      const index = this.meatStackGroup.children.length;
      const yOffset = index * 0.095;
      const xJitter = (Math.random() - 0.5) * 0.06;
      const zJitter = (Math.random() - 0.5) * 0.06;
      coin.position.set(xJitter, yOffset, zJitter);
      this.meatStackGroup.add(coin);
      this.meatStackCount += 1;
    }
  }

  /** 頭上からコインを取り除く */
  public removeCoinStack(count: number = 1): number {
    const removed = removeCoinStack(
      this.meatStackGroup,
      this.meatStackCount,
      count
    );
    this.meatStackCount = Math.max(0, this.meatStackCount - removed);
    return removed;
  }

  /**
   * 肉の見た目を作成（簡易的な直方体）
   */

  /**
   * プレイヤーの攻撃処理
   * 攻撃範囲内の敵を取得して攻撃します
   */
  public handleAttack(
    enemies: THREE.Object3D[],
    onEnemyKilled: (_enemy: THREE.Object3D) => void
  ): void {
    const currentTime = this.clock.getElapsedTime();

    // 攻撃クールダウンチェック
    if (currentTime - this.lastPlayerAttack < this.attackCooldown) {
      return;
    }

    // 攻撃範囲内の敵を検索
    const attackRange = 3.5;
    const enemiesInRange = enemies.filter((targetEnemy) => {
      const distance = targetEnemy.position.distanceTo(this.mesh.position);
      return distance <= attackRange;
    });

    // 攻撃範囲内に敵がいれば攻撃アニメーション開始
    if (enemiesInRange.length > 0) {
      this.lastPlayerAttack = currentTime;

      // 攻撃範囲内の敵にダメージ
      enemiesInRange.forEach((targetEnemy) => {
        onEnemyKilled(targetEnemy);
      });
    }
  }

  /**
   * プレイヤーにダメージを与える
   */
  public takeDamage(state: GameState): void {
    // 無敵時間中はダメージ無効
    const now = this.clock.getElapsedTime();
    if (now - this.lastDamagedAt < this.damageIFrames) {
      return;
    }

    const enemyDamage = 10; // 敵の基本ダメージ
    const defense = calculateDefense(state.armorLevel);
    const actualDamage = Math.max(1, enemyDamage - defense);

    state.health -= actualDamage;

    // 被弾時刻を更新
    this.lastDamagedAt = now;

    // 体力が0以下になった場合の処理
    if (state.health <= 0) {
      this.handleDeath(state);
    }
  }

  /**
   * プレイヤーの死亡処理
   */
  private handleDeath(state: GameState): void {
    // 将来的にゲームオーバー画面を表示
    state.health = state.maxHealth; // 一時的に体力を回復
  }

  /**
   * プレイヤーのダメージ計算
   */
  public calculateDamage(weaponLevel: number): number {
    return calculateDamage(weaponLevel);
  }

  /**
   * リソース獲得処理
   */
  public gainResources(state: GameState): void {
    // 肉を1個獲得
    state.meatCount += 1;

    // お金を少し獲得（1コイン=10円の価値）
    state.money += 5;

    // 経験値を獲得
    this.gainExperience(state, 10);
  }

  /**
   * 経験値獲得処理
   */
  private gainExperience(state: GameState, exp: number): void {
    state.experience += exp;

    // レベルアップチェック
    const requiredExp = this.getExperienceRequired(state.level + 1);
    if (state.experience >= requiredExp) {
      this.levelUp(state);
    }
  }

  /**
   * レベルアップ処理
   */
  private levelUp(state: GameState): void {
    state.level += 1;
    state.maxHealth += 20;
    state.health = state.maxHealth; // 体力全回復
  }

  /**
   * 必要経験値を取得
   */
  private getExperienceRequired(level: number): number {
    return level * 100 + (level - 1) * 50;
  }

  /**
   * プレイヤーの位置を取得
   */
  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }
}
