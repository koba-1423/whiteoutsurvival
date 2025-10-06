import * as THREE from "three";
import { createPolarBearModel } from "../models/EnemyModel.js";
import { PlayerManager } from "../player/PlayerManager.js";
import { EffectManager } from "../ui/EffectManager.js";
import { GameState } from "../state/frost_survival_design.js";
import { EnemyAnimator } from "./EnemyAnimator.js";
import { EnemyHealthBar } from "./EnemyHealthBar.js";
import { EnemyAI } from "./EnemyAI.js";

/**
 * 敵のデータ型定義
 */
interface EnemyData {
  mesh: THREE.Object3D;
  hp: number;
  maxHp: number;
  healthBar: THREE.Group;
  wanderTarget: THREE.Vector3; // ランダムに歩く時の目標地点
  lastAttackTime: number; // この敵の最後の攻撃時刻
}

/**
 * 敵管理クラス
 * 敵の生成、AI、攻撃、アニメーション、HP管理を管理します
 */

export class EnemyManager {
  private enemies: EnemyData[] = [];
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private effectManager: EffectManager;
  private enemySpeed: number = 2.0;
  private enemyAttackRange: number = 3.5;
  private enemyAttackCooldown: number = 1.5;
  private safeZoneRadius: number = 4.0; // セーフゾーンの半径
  private spawnAreaWidth: number = 100; // スポーンエリアの幅（X方向）
  private spawnAreaDepth: number = 50; // スポーンエリアの奥行き（Z方向）
  private enemyMaxHp: number = 100; // 敵の最大HP
  private animator: EnemyAnimator;
  private healthBarManager: EnemyHealthBar;
  private ai: EnemyAI;
  private separationRadius: number = 3.5; // 敵同士の最小距離（半径）
  private separationStrength: number = 2.5; // 離反の強さ（移動速度に乗算）
  private playerCollisionRadius: number = 3.5; // プレイヤーとの衝突半径
  private maxChasers: number = 5; // 追跡に参加できる最大の敵数

  constructor(
    scene: THREE.Scene,
    clock: THREE.Clock,
    effectManager: EffectManager
  ) {
    this.scene = scene;
    this.clock = clock;
    this.effectManager = effectManager;
    this.animator = new EnemyAnimator();
    this.healthBarManager = new EnemyHealthBar();
    this.ai = new EnemyAI(
      this.animator,
      this.enemySpeed,
      this.safeZoneRadius,
      this.spawnAreaWidth,
      this.spawnAreaDepth
    );
  }

  /**
   * 敵を生成
   * スポーンエリア内に30体のシロクマを配置します
   * セーフゾーンの外側にのみスポーンします
   */
  public spawnEnemies(): void {
    for (let i = 0; i < 30; i++) {
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

      this.scene.add(enemyMesh);

      // 敵データを作成
      const enemyData: EnemyData = {
        mesh: enemyMesh,
        hp: this.enemyMaxHp,
        maxHp: this.enemyMaxHp,
        healthBar: healthBar,
        wanderTarget: this.ai.generateWanderTarget(),
        lastAttackTime: 0,
      };

      this.enemies.push(enemyData);
    }
  }

  /**
   * 敵を更新
   * プレイヤーに向かって移動し、攻撃範囲内で攻撃します
   * 追跡範囲はスポーンエリアの範囲と同じです
   * ただし、プレイヤーがセーフゾーン内にいる場合は近づきません
   */
  public update(
    deltaTime: number,
    playerManager: PlayerManager,
    state: GameState,
    camera: THREE.Camera
  ): void {
    const currentTime = this.clock.getElapsedTime();
    const playerPosition = playerManager.getPosition();

    // プレイヤーが原点（セーフゾーン中心）からどれだけ離れているか
    const playerDistanceFromOrigin = Math.sqrt(
      playerPosition.x * playerPosition.x + playerPosition.z * playerPosition.z
    );

    // プレイヤーがセーフゾーン内にいるかどうか
    const isPlayerInSafeZone = playerDistanceFromOrigin < this.safeZoneRadius;

    // プレイヤーがスポーンエリア内にいるかどうか
    const isPlayerInSpawnArea =
      playerPosition.x >= -this.spawnAreaWidth / 2 &&
      playerPosition.x <= this.spawnAreaWidth / 2 &&
      playerPosition.z <= 0 &&
      playerPosition.z >= -this.spawnAreaDepth;

    // 追跡に参加する最も近い敵（最大maxChasers体）を算出
    const chasers = this.selectNearestChasers(
      playerPosition,
      isPlayerInSafeZone,
      isPlayerInSpawnArea
    );

    // 敵ごとの更新
    this.enemies.forEach((enemyData) => {
      const isChaser = chasers.has(enemyData);
      this.updateSingleEnemy(
        enemyData,
        deltaTime,
        playerPosition,
        isChaser,
        currentTime,
        playerManager,
        state,
        camera
      );
    });

    // 敵同士の重なりを軽減（単純な分離ベクトル）
    this.applyEnemySeparation(deltaTime);
  }

  /**
   * 追跡に参加する最も近い敵を選出（最大 maxChasers 体）
   */
  private selectNearestChasers(
    playerPosition: THREE.Vector3,
    isPlayerInSafeZone: boolean,
    isPlayerInSpawnArea: boolean
  ): Set<EnemyData> {
    const eligible = this.enemies.filter((e) => {
      if (!isPlayerInSpawnArea || isPlayerInSafeZone) {
        return false;
      }
      // 範囲内（任意に広い）にいる敵のみ対象
      const d = e.mesh.position.distanceTo(playerPosition);
      return d < 100;
    });

    // 距離でソートして先頭 maxChasers 体を採用
    eligible.sort((a, b) => {
      const da = a.mesh.position.distanceTo(playerPosition);
      const db = b.mesh.position.distanceTo(playerPosition);
      return da - db;
    });

    return new Set(eligible.slice(0, this.maxChasers));
  }

  /**
   * 個別の敵を更新
   */
  private updateSingleEnemy(
    enemyData: EnemyData,
    deltaTime: number,
    playerPosition: THREE.Vector3,
    isChaser: boolean,
    currentTime: number,
    playerManager: PlayerManager,
    state: GameState,
    camera: THREE.Camera
  ): void {
    const enemy = enemyData.mesh;
    const distance = enemy.position.distanceTo(playerPosition);

    // HPゲージを常にカメラの方に向ける（ビルボード効果）
    this.healthBarManager.updateBillboard(enemyData.healthBar, camera.position);

    if (isChaser && distance < 100) {
      // プレイヤーがスポーンエリア内かつセーフゾーン外にいる場合は追跡
      this.ai.chasePlayer(
        enemy,
        playerPosition,
        deltaTime,
        currentTime,
        (e) => {
          this.enforceSafeZoneBoundary(e);
          this.enforcePlayerCollision(e, playerPosition);
        }
      );

      // 攻撃範囲内で攻撃
      if (distance <= this.enemyAttackRange) {
        if (
          currentTime - enemyData.lastAttackTime >=
          this.enemyAttackCooldown
        ) {
          this.handleEnemyAttack(enemy, playerManager, state);
          enemyData.lastAttackTime = currentTime;
        }
      }
    } else {
      // 追跡モードでない場合はランダムに歩く
      enemyData.wanderTarget = this.ai.wanderRandomly(
        enemy,
        enemyData.wanderTarget,
        deltaTime,
        currentTime,
        (e) => {
          this.enforceSafeZoneBoundary(e);
          this.enforcePlayerCollision(e, playerPosition);
        }
      );
    }
  }

  /**
   * 敵がセーフゾーン内に入らないように制限
   */
  private enforceSafeZoneBoundary(enemy: THREE.Object3D): void {
    const enemyDistanceFromOrigin = Math.sqrt(
      enemy.position.x * enemy.position.x + enemy.position.z * enemy.position.z
    );

    // 敵の見た目が黄色い円と被らないように、余裕を持たせる
    const enemySafeDistance = this.safeZoneRadius + 2;

    if (enemyDistanceFromOrigin < enemySafeDistance) {
      // セーフゾーンの境界線上に押し戻す
      const angle = Math.atan2(enemy.position.z, enemy.position.x);
      enemy.position.x = Math.cos(angle) * enemySafeDistance;
      enemy.position.z = Math.sin(angle) * enemySafeDistance;
    }
  }

  /**
   * 敵同士が近すぎる場合に互いに反発して重なりを軽減
   * シンプルなO(n^2)だが体数が少ないため許容
   */
  private applyEnemySeparation(deltaTime: number): void {
    const minDist = this.separationRadius;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i].mesh.position;

      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j].mesh.position;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const distSq = dx * dx + dz * dz;

        if (distSq > 0 && distSq < minDistSq) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const overlap = (minDist - dist) / dist; // 正規化

          // 反発方向に移動（お互い半分ずつ）
          const pushX =
            dx * overlap * 0.5 * this.separationStrength * deltaTime;
          const pushZ =
            dz * overlap * 0.5 * this.separationStrength * deltaTime;

          this.enemies[i].mesh.position.x += pushX;
          this.enemies[i].mesh.position.z += pushZ;
          this.enemies[j].mesh.position.x -= pushX;
          this.enemies[j].mesh.position.z -= pushZ;

          // セーフゾーンの外に保つ
          this.enforceSafeZoneBoundary(this.enemies[i].mesh);
          this.enforceSafeZoneBoundary(this.enemies[j].mesh);
        }
      }
    }
  }

  /**
   * 敵の攻撃処理
   */
  private handleEnemyAttack(
    _enemy: THREE.Object3D,
    playerManager: PlayerManager,
    state: GameState
  ): void {
    // プレイヤーにダメージ
    playerManager.takeDamage(state);
  }

  /**
   * 敵にダメージを与える
   */
  public damageEnemy(
    enemy: THREE.Object3D,
    playerManager: PlayerManager,
    state: GameState
  ): void {
    // ダメージ計算
    const damage = playerManager.calculateDamage(state.weaponLevel);

    // 対応する敵データを検索
    const enemyData = this.enemies.find((data) => data.mesh === enemy);
    if (!enemyData) {
      return;
    }

    // HPを減らす
    enemyData.hp -= damage;

    // HPゲージを更新
    this.healthBarManager.updateHealthBar(
      enemyData.healthBar,
      enemyData.hp,
      enemyData.maxHp
    );

    // ダメージテキスト表示
    this.effectManager.showDamageText(enemy.position, damage);

    // HPが0以下になったら敵を削除
    if (enemyData.hp <= 0) {
      this.scene.remove(enemy);
      const enemyIndex = this.enemies.indexOf(enemyData);
      if (enemyIndex > -1) {
        this.enemies.splice(enemyIndex, 1);
      }

      // リソース獲得
      playerManager.gainResources(state);
    }
  }

  /**
   * プレイヤーとの衝突を防ぐ
   */
  private enforcePlayerCollision(
    enemy: THREE.Object3D,
    playerPosition: THREE.Vector3
  ): void {
    const dx = enemy.position.x - playerPosition.x;
    const dz = enemy.position.z - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = this.playerCollisionRadius;

    if (distance < minDistance && distance > 0) {
      // プレイヤーから離れる方向に押し戻す
      const pushX = (dx / distance) * (minDistance - distance);
      const pushZ = (dz / distance) * (minDistance - distance);

      enemy.position.x += pushX;
      enemy.position.z += pushZ;
    }
  }

  /**
   * 敵のリストを取得
   */
  public getEnemies(): THREE.Object3D[] {
    return this.enemies.map((data) => data.mesh);
  }
}
