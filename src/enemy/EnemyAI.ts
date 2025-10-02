import * as THREE from "three";
import { EnemyAnimator } from "./EnemyAnimator.js";

/**
 * 敵のAI管理クラス
 * プレイヤー追跡とランダム徘徊のロジックを担当します
 */
export class EnemyAI {
  private animator: EnemyAnimator;
  private enemySpeed: number;
  private safeZoneRadius: number;
  private spawnAreaWidth: number;
  private spawnAreaDepth: number;

  constructor(
    animator: EnemyAnimator,
    enemySpeed: number,
    safeZoneRadius: number,
    spawnAreaWidth: number,
    spawnAreaDepth: number
  ) {
    this.animator = animator;
    this.enemySpeed = enemySpeed;
    this.safeZoneRadius = safeZoneRadius;
    this.spawnAreaWidth = spawnAreaWidth;
    this.spawnAreaDepth = spawnAreaDepth;
  }

  /**
   * プレイヤーを追跡
   */
  public chasePlayer(
    enemy: THREE.Object3D,
    playerPosition: THREE.Vector3,
    deltaTime: number,
    currentTime: number,
    enforceBoundary: (_enemy: THREE.Object3D) => void
  ): void {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemy.position)
      .normalize();

    enemy.position.add(direction.multiplyScalar(this.enemySpeed * deltaTime));

    // 敵がセーフゾーン内に入らないように制限
    enforceBoundary(enemy);

    // プレイヤーの方を向く
    enemy.lookAt(playerPosition);

    // 歩くアニメーション
    this.animator.animateWalking(enemy, currentTime);
  }

  /**
   * ランダムに歩く
   */
  public wanderRandomly(
    enemy: THREE.Object3D,
    wanderTarget: THREE.Vector3,
    deltaTime: number,
    currentTime: number,
    enforceBoundary: (_enemy: THREE.Object3D) => void
  ): THREE.Vector3 {
    const distanceToTarget = enemy.position.distanceTo(wanderTarget);

    // 目標地点に近づいたら新しい目標地点を生成
    if (distanceToTarget < 2) {
      wanderTarget = this.generateWanderTarget();
    }

    // 目標地点に向かって移動
    const direction = new THREE.Vector3()
      .subVectors(wanderTarget, enemy.position)
      .normalize();

    enemy.position.add(
      direction.multiplyScalar(this.enemySpeed * 0.5 * deltaTime)
    );

    // 敵がセーフゾーン内に入らないように制限
    enforceBoundary(enemy);

    // 目標地点の方を向く
    enemy.lookAt(wanderTarget);

    // 歩くアニメーション
    this.animator.animateWalking(enemy, currentTime);

    return wanderTarget;
  }

  /**
   * ランダムな徘徊目標地点を生成
   */
  public generateWanderTarget(): THREE.Vector3 {
    let x = 0;
    let z = 0;
    let distanceFromOrigin = 0;

    do {
      x = (Math.random() - 0.5) * this.spawnAreaWidth;
      z = -Math.random() * this.spawnAreaDepth;
      distanceFromOrigin = Math.sqrt(x * x + z * z);
    } while (distanceFromOrigin < this.safeZoneRadius);

    return new THREE.Vector3(x, 0, z);
  }
}
