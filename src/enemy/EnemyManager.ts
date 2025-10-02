import * as THREE from "three";
import { createPolarBearModel } from "../models/EnemyModel.js";
import { PlayerManager } from "../player/PlayerManager.js";
import { EffectManager } from "../ui/EffectManager.js";
import { GameState } from "../state/frost_survival_design.js";

/**
 * 敵のデータ型定義
 */
interface EnemyData {
  mesh: THREE.Object3D;
  hp: number;
  maxHp: number;
  healthBar: THREE.Group;
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
  private enemyAttackRange: number = 1.5;
  private enemyAttackCooldown: number = 2.0;
  private lastEnemyAttack: number = 0;
  private safeZoneRadius: number = 4.0; // セーフゾーンの半径
  private spawnAreaWidth: number = 100; // スポーンエリアの幅（X方向）
  private spawnAreaDepth: number = 50; // スポーンエリアの奥行き（Z方向）
  private enemyMaxHp: number = 100; // 敵の最大HP

  constructor(
    scene: THREE.Scene,
    clock: THREE.Clock,
    effectManager: EffectManager
  ) {
    this.scene = scene;
    this.clock = clock;
    this.effectManager = effectManager;
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
      const healthBar = this.createHealthBar();
      healthBar.position.set(0, 1.5, 0); // 敵の上に配置
      enemyMesh.add(healthBar);

      this.scene.add(enemyMesh);

      // 敵データを作成
      const enemyData: EnemyData = {
        mesh: enemyMesh,
        hp: this.enemyMaxHp,
        maxHp: this.enemyMaxHp,
        healthBar: healthBar,
      };

      this.enemies.push(enemyData);
    }
  }

  /**
   * HPゲージを作成
   * 敵の上部に細く短いゲージを表示します
   */
  private createHealthBar(): THREE.Group {
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

    this.enemies.forEach((enemyData) => {
      const enemy = enemyData.mesh;
      const distance = enemy.position.distanceTo(playerPosition);

      // HPゲージを常にカメラの方に向ける（ビルボード効果）
      enemyData.healthBar.lookAt(camera.position);

      if (isPlayerInSpawnArea && !isPlayerInSafeZone && distance < 100) {
        // プレイヤーがスポーンエリア内かつセーフゾーン外にいる場合のみ向かっていく
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, enemy.position)
          .normalize();

        enemy.position.add(
          direction.multiplyScalar(this.enemySpeed * deltaTime)
        );

        // 敵がセーフゾーン内に入らないように制限
        const enemyDistanceFromOrigin = Math.sqrt(
          enemy.position.x * enemy.position.x +
            enemy.position.z * enemy.position.z
        );

        // 敵の見た目が黄色い円と被らないように、余裕を持たせる
        const enemySafeDistance = this.safeZoneRadius + 2;

        if (enemyDistanceFromOrigin < enemySafeDistance) {
          // セーフゾーンの境界線上に押し戻す
          const angle = Math.atan2(enemy.position.z, enemy.position.x);
          enemy.position.x = Math.cos(angle) * enemySafeDistance;
          enemy.position.z = Math.sin(angle) * enemySafeDistance;
        }

        // プレイヤーの方を向く
        enemy.lookAt(playerPosition);

        // 歩くアニメーション
        this.animateWalking(enemy, currentTime);

        // 攻撃範囲内で攻撃
        if (distance <= this.enemyAttackRange) {
          if (currentTime - this.lastEnemyAttack >= this.enemyAttackCooldown) {
            this.handleEnemyAttack(enemy, playerManager, state);
            this.lastEnemyAttack = currentTime;
          }
        }
      }
    });
  }

  /**
   * 歩くアニメーション
   * 脚を前後に動かして、体を上下に揺らします
   */
  private animateWalking(enemy: THREE.Object3D, currentTime: number): void {
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
    this.updateHealthBar(enemyData);

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
   * HPゲージを更新
   */
  private updateHealthBar(enemyData: EnemyData): void {
    const healthBar = enemyData.healthBar;
    const foreground = healthBar.getObjectByName("healthBarForeground");

    if (foreground) {
      const hpRatio = Math.max(0, enemyData.hp / enemyData.maxHp);
      foreground.scale.x = hpRatio;
      foreground.position.x = -(1 - hpRatio);
    }
  }

  /**
   * 敵のリストを取得
   */
  public getEnemies(): THREE.Object3D[] {
    return this.enemies.map((data) => data.mesh);
  }
}
