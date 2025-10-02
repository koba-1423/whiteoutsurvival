import * as THREE from "three";
import {
  createInitialState,
  GameState,
} from "./state/frost_survival_design.js";
import { SceneManager } from "./rendering/SceneManager.js";
import { PlayerManager } from "./player/PlayerManager.js";
import { EnemyManager } from "./enemy/EnemyManager.js";
import { UIManager } from "./ui/UIManager.js";
import { EffectManager } from "./ui/EffectManager.js";
import { InputManager } from "./input/InputManager.js";
import { SnowParticles } from "./effects/SnowParticles.js";

/**
 * グローバル型定義
 */
declare global {
  interface Window {
    game?: Game;
  }
}

/**
 * メインゲームクラス
 * 各マネージャーを統合して、ゲームループを管理します
 */
class Game {
  private sceneManager: SceneManager;
  private playerManager: PlayerManager;
  private enemyManager: EnemyManager;
  private uiManager: UIManager;
  private effectManager: EffectManager;
  private inputManager: InputManager;
  private snowParticles: SnowParticles;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private state: GameState;

  constructor() {
    // 時計を作成
    this.clock = new THREE.Clock();

    // シーンマネージャーを作成（レンダリング基盤）
    this.sceneManager = new SceneManager();

    // エフェクトマネージャーを作成
    this.effectManager = new EffectManager();

    // プレイヤーマネージャーを作成
    this.state = createInitialState(1);
    this.playerManager = new PlayerManager(
      this.sceneManager.scene,
      this.clock,
      this.effectManager,
      this.state.weaponLevel
    );

    // 敵マネージャーを作成
    this.enemyManager = new EnemyManager(
      this.sceneManager.scene,
      this.clock,
      this.effectManager
    );
    this.enemyManager.spawnEnemies();

    // UIマネージャーを作成
    this.uiManager = new UIManager();
    this.uiManager.hideLoadingScreen();

    // 入力マネージャーを作成
    this.inputManager = new InputManager();

    // 雪のパーティクルを作成
    this.snowParticles = new SnowParticles(this.sceneManager.scene);

    // ゲームループを開始
    this.startGameLoop();
  }

  /**
   * ゲームループを開始
   */
  private startGameLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }

  /**
   * ゲームを更新
   */
  private update(): void {
    const deltaTime = this.clock.getDelta();

    // プレイヤーの移動
    const moveVector = this.inputManager.getMovementInput();
    this.playerManager.updateMovement(moveVector, deltaTime);

    // 敵の更新
    this.enemyManager.update(
      deltaTime,
      this.playerManager,
      this.state,
      this.sceneManager.camera
    );

    // プレイヤーの更新（自動攻撃を含む）
    this.playerManager.update(this.enemyManager, this.state);

    // カメラを更新
    this.sceneManager.updateCamera(this.playerManager.getPosition());

    // UIを更新
    this.uiManager.update(this.state);

    // 雪のパーティクルを更新
    this.snowParticles.update(deltaTime);
  }

  /**
   * レンダリング
   */
  private render(): void {
    this.sceneManager.render();
  }
}

// ゲームを開始
window.addEventListener("load", () => {
  new Game();
});

// DOMContentLoadedでも初期化（本番環境での互換性向上）
document.addEventListener("DOMContentLoaded", () => {
  if (!window.game) {
    window.game = new Game();
  }
});
