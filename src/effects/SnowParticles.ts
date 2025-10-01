import * as THREE from "three";

/**
 * 雪のパーティクルシステム
 * 空から雪が降ってくるエフェクトを管理します
 */
export class SnowParticles {
  private particles: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.particles = this.createSnowParticles();
    scene.add(this.particles);
  }

  /**
   * 雪のパーティクルシステムを作成
   * 1000個の雪の粒を上空に配置します
   */
  private createSnowParticles(): THREE.Points {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // 雪のパーティクルの初期位置と速度を設定
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // ランダムな位置（上空から）
      positions[i3] = (Math.random() - 0.5) * 200; // x
      positions[i3 + 1] = Math.random() * 50 + 20; // y (高さ)
      positions[i3 + 2] = (Math.random() - 0.5) * 200; // z

      // ランダムな速度
      velocities[i3] = (Math.random() - 0.5) * 0.5; // x方向の速度
      velocities[i3 + 1] = -Math.random() * 2 - 1; // y方向の速度（下向き）
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.5; // z方向の速度
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    // 雪のマテリアル（白くて少し透明）
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * 雪のパーティクルを更新
   * 雪を下に落として、地面に落ちたら上空に戻します
   */
  public update(deltaTime: number): void {
    const positions = this.particles.geometry.attributes.position
      .array as Float32Array;
    const velocities = this.particles.geometry.attributes.velocity
      .array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // 位置を更新（速度を足す）
      positions[i] += velocities[i] * deltaTime; // x
      positions[i + 1] += velocities[i + 1] * deltaTime; // y
      positions[i + 2] += velocities[i + 2] * deltaTime; // z

      // 地面に落ちた雪を上に戻す
      if (positions[i + 1] < 0) {
        positions[i] = (Math.random() - 0.5) * 200; // x
        positions[i + 1] = 50 + Math.random() * 20; // y (上空)
        positions[i + 2] = (Math.random() - 0.5) * 200; // z
      }

      // 画面外に出た雪を戻す
      if (Math.abs(positions[i]) > 100 || Math.abs(positions[i + 2]) > 100) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = Math.random() * 50 + 20;
        positions[i + 2] = (Math.random() - 0.5) * 200;
      }
    }

    // ジオメトリの更新を通知
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
