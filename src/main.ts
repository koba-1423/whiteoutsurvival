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
import { TowerAttackManager } from "./tower/TowerAttackManager.js";
import { TutorialScreen } from "./ui/TutorialScreen.js";

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
  private towerAttackManager: TowerAttackManager;
  private tutorialScreen: TutorialScreen;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private state: GameState;
  // 加工用のタイマー
  private lastProcessAt: number = 0;
  private lastCashInAt: number = 0;
  private lastWeaponUpgradeAt: number = 0;
  private lastTowerUpgradeAt: number = 0;
  // コイン表示用のタグ
  private static readonly COIN_TAG = "__coin__";
  // 焼肉回収用のタグ
  private static readonly COOKED_MEAT_TAG = "__cooked_meat__";

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

    // タワー攻撃管理を作成
    const towerPosition = new THREE.Vector3(14, 0, 15); // タワーの位置
    this.towerAttackManager = new TowerAttackManager(
      towerPosition,
      this.clock,
      this.sceneManager.scene,
      (_enemy) => {
        // タワーが敵を倒した時の処理（主人公の頭上に生肉を追加）
        this.playerManager.addMeatStack(1);
      }
    );

    // チュートリアル画面を作成（DOM読み込み完了を待つ）
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.tutorialScreen = new TutorialScreen(() => {
          this.startGame();
        });
      });
    } else {
      this.tutorialScreen = new TutorialScreen(() => {
        this.startGame();
      });
    }

    // ゲームループを開始（チュートリアル表示中は停止）
    this.startGameLoop();
  }

  /**
   * ゲームループを開始
   */
  private startGameLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // チュートリアル表示中はゲーム更新を停止
      if (this.tutorialScreen.isTutorialVisible()) {
        this.render();
        return;
      }

      this.update();
      this.render();
    };
    animate();
  }

  /**
   * ゲーム開始処理
   */
  private startGame(): void {
    // チュートリアル画面を非表示
    this.tutorialScreen.hide();

    // ゲーム開始時の初期化処理があればここに追加
    console.log("ゲーム開始！");
  }

  /**
   * ゲームを更新
   */
  private update(): void {
    const deltaTime = this.clock.getDelta();

    // プレイヤーの移動
    const moveVector = this.inputManager.getMovementInput();
    this.playerManager.updateMovement(
      moveVector,
      deltaTime,
      this.sceneManager.collisionBoxes
    );

    // 敵の更新
    this.enemyManager.update(
      deltaTime,
      this.playerManager,
      this.state,
      this.sceneManager.camera
    );

    // プレイヤーの更新（自動攻撃を含む）
    this.playerManager.update(
      this.enemyManager,
      this.state,
      this.sceneManager.camera
    );

    // 加工エリア内にいる場合、1秒ごとに生肉→焼き肉へ変換
    this.updateCookingProcess();

    // 焼肉の近接回収
    this.collectCookedMeatIfNearby();

    // コインの近接回収
    this.collectCoinsIfNearby();

    // 換金エリア内では1秒ごとに焼肉を1枚換金
    this.updateCashInProcess();

    // 武器エリア内では50円で武器アップグレード
    this.updateWeaponUpgradeProcess();

    // タワーエリア内では50円でタワーアップグレード
    this.updateTowerUpgradeProcess();

    // タワーの自動攻撃
    this.towerAttackManager.update(this.enemyManager, deltaTime);

    // カメラを更新
    this.sceneManager.updateCamera(this.playerManager.getPosition());

    // UIを更新
    this.uiManager.update(this.state);

    // 雪のパーティクルを更新
    this.snowParticles.update(deltaTime);
  }

  private updateCookingProcess(): void {
    const box = this.sceneManager.cookingAreaBox;
    const outPos = this.sceneManager.cookingOutputPosition;
    if (!box || !outPos) return;

    const p = this.playerManager.getPosition();
    // 少しマージンを広げて、境界上も含める
    const margin = 0.6;
    const inside =
      p.x >= box.minX - margin &&
      p.x <= box.maxX + margin &&
      p.z >= box.minZ - margin &&
      p.z <= box.maxZ + margin;
    if (!inside) return;

    const now = this.clock.getElapsedTime();
    if (now - this.lastProcessAt < 1.0) return;

    // プレイヤーから1枚取り外す
    const removed = this.playerManager.removeRawMeatStack(1);
    if (removed > 0) {
      // 焼いた肉を右側に縦積み
      this.spawnCookedMeat(outPos);
      this.lastProcessAt = now;
    }
  }

  private spawnCookedMeat(basePos: THREE.Vector3): void {
    // 頭上スタックと同じ焼肉の見た目で作成
    const group = new THREE.Group();

    // ステーキ本体
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

    // 脂身の白い帯
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

    // 自然なブレ
    group.rotation.y = Math.random() * Math.PI * 2;
    group.rotation.x = (Math.random() - 0.5) * 0.02;
    group.rotation.z = (Math.random() - 0.5) * 0.02;

    // 縦に積み上げる
    const xJ = (Math.random() - 0.5) * 0.08;
    const zJ = (Math.random() - 0.5) * 0.08;

    // 同座標近傍の焼肉数をカウントして高さを決定
    let countNearby = 0;
    const radius = 0.2;
    this.sceneManager.scene.traverse((obj) => {
      if (obj.userData && obj.userData[Game.COOKED_MEAT_TAG] && obj !== group) {
        const d = obj.position.distanceTo(basePos);
        if (d < radius && Math.abs(obj.position.x - basePos.x) < 0.3) {
          countNearby++;
        }
      }
    });

    group.position.set(
      basePos.x + xJ,
      basePos.y + countNearby * 0.09,
      basePos.z + zJ
    );

    // 焼肉タグを設定
    group.userData[Game.COOKED_MEAT_TAG] = true;
    this.sceneManager.scene.add(group);
  }

  private updateCashInProcess(): void {
    const box = this.sceneManager.shopAreaBox;
    if (!box) return;

    const p = this.playerManager.getPosition();
    const margin = 0.6;
    const inside =
      p.x >= box.minX - margin &&
      p.x <= box.maxX + margin &&
      p.z >= box.minZ - margin &&
      p.z <= box.maxZ + margin;
    if (!inside) return;

    const now = this.clock.getElapsedTime();
    if (now - this.lastCashInAt < 1.0) return;

    const removed = this.playerManager.removeCookedMeatStack(1);
    if (removed > 0) {
      this.state.money += removed; // 1枚=1コイン（表示時は10倍）
      // コインを視覚的に表示
      this.spawnCoin(this.sceneManager.shopOutputPosition!);
      this.lastCashInAt = now;
    }
  }

  private spawnCoin(basePos: THREE.Vector3): void {
    // コインの3Dモデルを作成（サイズを大きく）
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // 金色
      metalness: 0.8,
      roughness: 0.2,
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);

    // コインを寝かせる（円柱を横に）
    coin.rotation.z = Math.PI / 2;

    // 既存のコイン数をカウントして高さを決定
    let coinCount = 0;
    this.sceneManager.scene.traverse((obj) => {
      if (obj.userData && obj.userData[Game.COIN_TAG]) {
        const d = obj.position.distanceTo(basePos);
        if (d < 0.3) {
          coinCount++;
        }
      }
    });

    // 位置を設定（少しランダムに散らばらせる）
    const xJitter = (Math.random() - 0.5) * 0.15;
    const zJitter = (Math.random() - 0.5) * 0.15;
    coin.position.set(
      basePos.x + xJitter,
      basePos.y + coinCount * 0.08, // コインの厚み分ずつ積む
      basePos.z + zJitter
    );

    coin.castShadow = false;
    coin.receiveShadow = false;

    // コインタグを設定
    coin.userData[Game.COIN_TAG] = true;
    this.sceneManager.scene.add(coin);
  }

  // 近くのコインを回収して所持金に追加
  private collectCoinsIfNearby(): void {
    const p = this.playerManager.getPosition();
    const pickupRadius = 2.5; // コイン回収半径
    const toRemove: THREE.Object3D[] = [];

    this.sceneManager.scene.traverse((obj) => {
      if (obj.userData && obj.userData[Game.COIN_TAG]) {
        const dx = obj.position.x - p.x;
        const dz = obj.position.z - p.z;
        const horizDist = Math.sqrt(dx * dx + dz * dz);
        if (horizDist <= pickupRadius) {
          toRemove.push(obj);
        }
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach((coin) => this.sceneManager.scene.remove(coin));
      this.state.money += toRemove.length; // 回収したコイン数を所持金に追加（表示時は10倍）
      // 頭上にコインを追加
      this.playerManager.addCoinStack(toRemove.length);
    }
  }

  private updateWeaponUpgradeProcess(): void {
    const box = this.sceneManager.forgeAreaBox;
    if (!box) return;

    const p = this.playerManager.getPosition();
    const margin = 0.6;
    const inside =
      p.x >= box.minX - margin &&
      p.x <= box.maxX + margin &&
      p.z >= box.minZ - margin &&
      p.z <= box.maxZ + margin;
    if (!inside) return;

    const now = this.clock.getElapsedTime();
    if (now - this.lastWeaponUpgradeAt < 1.0) return;

    // 50円（5コイン）で武器アップグレード
    const upgradeCost = 5; // 5コイン = 50円
    if (this.state.money >= upgradeCost) {
      // 頭上からコインを5枚取り除く
      const removedCoins = this.playerManager.removeCoinStack(5);
      if (removedCoins >= 5) {
        this.state.money -= upgradeCost;
        this.state.weaponLevel += 1;
        this.lastWeaponUpgradeAt = now;

        // プレイヤーの武器を更新
        this.playerManager.updateSword(this.state.weaponLevel);
      }
    }
  }

  // 近くの焼肉を回収して頭上に積む
  private collectCookedMeatIfNearby(): void {
    const p = this.playerManager.getPosition();
    const pickupRadius = 2.2; // 水平距離で判定、拾いやすく拡大
    const toRemove: THREE.Object3D[] = [];
    this.sceneManager.scene.traverse((obj) => {
      // Groupオブジェクトも対象にする
      if (obj.userData && obj.userData[Game.COOKED_MEAT_TAG]) {
        const dx = obj.position.x - p.x;
        const dz = obj.position.z - p.z;
        const horizDist = Math.sqrt(dx * dx + dz * dz);
        if (horizDist <= pickupRadius) {
          toRemove.push(obj);
        }
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach((m) => this.sceneManager.scene.remove(m));
      this.playerManager.addCookedMeatStack(toRemove.length);
    }
  }

  /**
   * タワーアップグレード処理
   */
  private updateTowerUpgradeProcess(): void {
    const box = this.sceneManager.towerAreaBox;
    if (!box) return;

    const p = this.playerManager.getPosition();
    const margin = 0.6;
    const inside =
      p.x >= box.minX - margin &&
      p.x <= box.maxX + margin &&
      p.z >= box.minZ - margin &&
      p.z <= box.maxZ + margin;
    if (!inside) return;

    const now = this.clock.getElapsedTime();
    if (now - this.lastTowerUpgradeAt < 1.0) return;

    // 50円（5コイン）でタワーアップグレード
    const upgradeCost = 5; // 5コイン = 50円
    if (this.state.money >= upgradeCost) {
      // 頭上からコインを5枚取り除く
      const removedCoins = this.playerManager.removeCoinStack(5);
      if (removedCoins >= 5) {
        this.state.money -= upgradeCost;
        this.lastTowerUpgradeAt = now;

        // タワーをアップグレード
        this.towerAttackManager.upgradeTower();
      }
    }
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
