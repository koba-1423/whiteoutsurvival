import * as THREE from "three";

/**
 * タワーの矢クラス
 * タワーから敵に向かって飛ぶ矢を管理します
 */
export class TowerArrow {
  public mesh: THREE.Group;
  private target: THREE.Object3D | null = null;
  private speed: number = 20.0; // 矢の速度
  private isActive: boolean = true;
  private onHitCallback?: (_target: THREE.Object3D) => void;

  constructor(
    startPosition: THREE.Vector3,
    target: THREE.Object3D,
    onHit?: (_target: THREE.Object3D) => void
  ) {
    this.target = target;
    this.onHitCallback = onHit;
    this.mesh = this.createArrowMesh();
    this.mesh.position.copy(startPosition);

    // 矢をターゲットの方向に向ける
    this.aimAtTarget();
  }

  /**
   * 矢のメッシュを作成
   */
  private createArrowMesh(): THREE.Group {
    const group = new THREE.Group();

    // 矢の軸（木製）
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
    const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.z = Math.PI / 2; // 横に向ける
    group.add(shaft);

    // 矢じり（金属）
    const headGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5, 0, 0);
    head.rotation.z = Math.PI / 2;
    group.add(head);

    // 矢羽（羽根）
    const featherGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.02);
    const featherMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // 3枚の羽根
    for (let i = 0; i < 3; i++) {
      const feather = new THREE.Mesh(featherGeometry, featherMaterial);
      const angle = i * 120 * (Math.PI / 180);
      feather.position.set(-0.4, Math.cos(angle) * 0.1, Math.sin(angle) * 0.1);
      feather.rotation.z = Math.PI / 2;
      group.add(feather);
    }

    return group;
  }

  /**
   * ターゲットの方向に矢を向ける
   */
  private aimAtTarget(): void {
    if (!this.target) return;

    const direction = new THREE.Vector3();
    direction.subVectors(this.target.position, this.mesh.position);
    direction.normalize();

    // 矢をターゲットの方向に向ける
    this.mesh.lookAt(
      this.mesh.position.x + direction.x,
      this.mesh.position.y + direction.y,
      this.mesh.position.z + direction.z
    );
  }

  /**
   * 矢を更新（移動と衝突判定）
   */
  public update(deltaTime: number): boolean {
    if (!this.isActive || !this.target) return false;

    // ターゲットの方向に移動
    const direction = new THREE.Vector3();
    direction.subVectors(this.target.position, this.mesh.position);
    direction.normalize();

    // 矢を移動
    this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));

    // ターゲットとの距離をチェック
    const distance = this.mesh.position.distanceTo(this.target.position);
    if (distance < 0.5) {
      // ヒット！
      this.isActive = false;
      if (this.onHitCallback) {
        this.onHitCallback(this.target);
      }
      return true; // 矢を削除
    }

    // 一定時間経過したら削除
    if (this.mesh.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
      this.isActive = false;
      return true; // 矢を削除
    }

    return false;
  }

  /**
   * 矢がアクティブかどうか
   */
  public getIsActive(): boolean {
    return this.isActive;
  }
}
