import * as THREE from "three";
import { createPolarBearModel } from "../models/EnemyModel.js";
import { PlayerManager } from "../player/PlayerManager.js";
import { EffectManager } from "../ui/EffectManager.js";
import { GameState } from "../state/frost_survival_design.js";

/**
 * 敵管理クラス
 * 敵の生成、AI、攻撃、アニメーションを管理します
 */
export class EnemyManager {
  private enemies: THREE.Object3D[] = [];
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private effectManager: EffectManager;
  private enemySpeed: number = 2.0;
  private enemyAttackRange: number = 1.5;
  private enemyAttackCooldown: number = 2.0;
  private lastEnemyAttack: number = 0;

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
   * プレイヤーの上半分（画面上側）に30体のシロクマを配置します
   */
  public spawnEnemies(): void {
    for (let i = 0; i < 30; i++) {
      const enemy = createPolarBearModel();

      // 主人公の上半分（画面上側）にランダムに配置
      const x = (Math.random() - 0.5) * 100;
      const z = -Math.random() * 50; // 0から-50の範囲（上半分）
      enemy.position.set(x, 0, z);

      // 大きさを3倍にする
      enemy.scale.set(3, 3, 3);

      // 主人公の方向を向ける（主人公は原点にいる）
      enemy.lookAt(0, 0, 0);

      this.scene.add(enemy);
      this.enemies.push(enemy);
    }
  }

  /**
   * 敵を更新
   * プレイヤーに向かって移動し、攻撃範囲内で攻撃します
   */
  public update(
    deltaTime: number,
    playerManager: PlayerManager,
    state: GameState
  ): void {
    const currentTime = this.clock.getElapsedTime();
    const playerPosition = playerManager.getPosition();

    this.enemies.forEach((enemy) => {
      const distance = enemy.position.distanceTo(playerPosition);

      if (distance < 20) {
        // プレイヤーに向かって移動
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, enemy.position)
          .normalize();

        enemy.position.add(
          direction.multiplyScalar(this.enemySpeed * deltaTime)
        );

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

    // ダメージテキスト表示
    this.effectManager.showDamageText(enemy.position, damage);

    // 敵を削除（倒した）
    this.scene.remove(enemy);
    const enemyIndex = this.enemies.indexOf(enemy);
    if (enemyIndex > -1) {
      this.enemies.splice(enemyIndex, 1);
    }

    // リソース獲得
    playerManager.gainResources(state);
  }

  /**
   * 敵のリストを取得
   */
  public getEnemies(): THREE.Object3D[] {
    return this.enemies;
  }
}
