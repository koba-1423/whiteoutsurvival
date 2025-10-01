import * as THREE from "three";
import {
  GameState,
  calculateDamage,
  calculateDefense,
} from "../state/frost_survival_design.js";
import { createPlayerModel } from "../models/PlayerModel.js";
import { createSwordModel } from "../models/WeaponModel.js";
import { EffectManager } from "../ui/EffectManager.js";

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
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // 武器を作成
    this.updateSword(weaponLevel);
  }

  /**
   * 武器を更新
   */
  public updateSword(_weaponLevel: number): void {
    // 既存の武器を削除
    if (this.currentSword) {
      this.mesh.remove(this.currentSword);
    }

    // 新しい武器を作成
    this.currentSword = createSwordModel();
    this.currentSword.position.set(0.3, 0.8, 0);
    this.currentSword.rotation.z = -Math.PI / 4;

    // プレイヤーメッシュに武器を追加
    this.mesh.add(this.currentSword);
  }

  /**
   * プレイヤーの移動を更新
   */
  public updateMovement(moveVector: THREE.Vector3, deltaTime: number): void {
    const moveSpeed = 5.0;

    // 正規化して移動
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(moveSpeed * deltaTime);
      this.mesh.position.add(moveVector);
    }
  }

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

    this.lastPlayerAttack = currentTime;

    // 攻撃範囲内の敵を検索
    const attackRange = 2.0;
    const enemiesInRange = enemies.filter((targetEnemy) => {
      const distance = targetEnemy.position.distanceTo(this.mesh.position);
      return distance <= attackRange;
    });

    // 攻撃範囲内の敵にダメージ
    enemiesInRange.forEach((targetEnemy) => {
      onEnemyKilled(targetEnemy);
    });
  }

  /**
   * プレイヤーにダメージを与える
   */
  public takeDamage(state: GameState): void {
    const enemyDamage = 10; // 敵の基本ダメージ
    const defense = calculateDefense(state.armorLevel);
    const actualDamage = Math.max(1, enemyDamage - defense);

    state.health -= actualDamage;

    // ダメージテキスト表示
    this.effectManager.showPlayerDamageText(actualDamage);

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

    // お金を少し獲得
    state.money += 5;

    // 経験値を獲得
    this.gainExperience(state, 10);

    // リソース獲得エフェクト
    this.effectManager.showResourceGainEffect();
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

    // レベルアップエフェクト
    this.effectManager.showLevelUpEffect(state.level);
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
