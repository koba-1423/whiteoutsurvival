import * as THREE from "three";
import {
  GameState,
  calculateDamage,
  calculateDefense,
} from "../state/frost_survival_design.js";
import { createPlayerModel } from "../models/PlayerModel.js";
import { createSwordModel } from "../models/WeaponModel.js";
import { EffectManager } from "../ui/EffectManager.js";
import type { EnemyManager } from "../enemy/EnemyManager.js";
import { EnemyHealthBar } from "../enemy/EnemyHealthBar.js";
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
      enemyManager.damageEnemy(enemy, this, state);
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
      const meat = this.createMeatVisual();
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
      const meat = this.createCookedMeatVisual();
      const index = this.meatStackCount;
      const yOffset = index * 0.095;
      const xJitter = (Math.random() - 0.5) * 0.06;
      const zJitter = (Math.random() - 0.5) * 0.06;
      meat.position.set(xJitter, yOffset, zJitter);
      this.meatStackGroup.add(meat);
      this.meatStackCount += 1;
    }
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

  /**
   * 肉の見た目を作成（簡易的な直方体）
   */
  private createMeatVisual(): THREE.Object3D {
    const group = new THREE.Group();

    // ステーキ本体（薄い円柱を楕円にスケール）
    const steakGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.08, 20);
    const steakMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3b3b, // 鮮やかな赤
      metalness: 0.05,
      roughness: 0.8,
    });
    const steakMesh = new THREE.Mesh(steakGeometry, steakMaterial);
    // 回転はさせず、広い面（円形の面）を地面と平行に保持
    // XZ方向にスケールして楕円の広い面を作る。Yが厚み。
    steakMesh.scale.set(1.6, 1.0, 1.2);
    steakMesh.castShadow = false;
    steakMesh.receiveShadow = false;
    group.add(steakMesh);

    // 脂身の白い帯
    const fatGeometry = new THREE.BoxGeometry(0.06, 0.008, 0.36);
    const fatMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff2cc,
      metalness: 0.1,
      roughness: 0.6,
      emissive: 0x000000,
    });
    const fatMesh = new THREE.Mesh(fatGeometry, fatMaterial);
    fatMesh.position.set(0, 0.042, 0); // 上面近くに配置
    fatMesh.rotation.y = (Math.random() - 0.5) * 0.4; // 少し斜めに
    fatMesh.castShadow = false;
    group.add(fatMesh);

    // 自然なブレ
    group.rotation.y = Math.random() * Math.PI * 2; // 水平回転のみ強め
    group.rotation.x = (Math.random() - 0.5) * 0.02; // 傾きはごく小さく
    group.rotation.z = (Math.random() - 0.5) * 0.02;
    // 種別タグ
    group.userData.meatType = "raw";

    return group;
  }

  /** 焼肉の見た目（少し濃い色で薄め） */
  private createCookedMeatVisual(): THREE.Object3D {
    const group = new THREE.Group();
    const steakGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.06, 20);
    const steakMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a1a1a,
      metalness: 0.0,
      roughness: 0.85,
    });
    const steakMesh = new THREE.Mesh(steakGeometry, steakMaterial);
    steakMesh.scale.set(1.6, 1.0, 1.2);
    steakMesh.castShadow = false;
    steakMesh.receiveShadow = false;
    group.add(steakMesh);

    const fatGeometry = new THREE.BoxGeometry(0.06, 0.006, 0.36);
    const fatMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5e6c8,
      metalness: 0.05,
      roughness: 0.6,
    });
    const fatMesh = new THREE.Mesh(fatGeometry, fatMaterial);
    fatMesh.position.set(0, 0.038, 0);
    fatMesh.rotation.y = (Math.random() - 0.5) * 0.4;
    fatMesh.castShadow = false;
    group.add(fatMesh);

    group.rotation.y = Math.random() * Math.PI * 2;
    group.rotation.x = (Math.random() - 0.5) * 0.02;
    group.rotation.z = (Math.random() - 0.5) * 0.02;
    group.userData.meatType = "cooked";
    return group;
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

    // お金を少し獲得
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
