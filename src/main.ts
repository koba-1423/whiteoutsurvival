import * as THREE from "three";
import {
  createInitialState,
  GameState,
  calculateDamage,
  calculateDefense,
} from "./state/frost_survival_design.js";

// グローバル型定義
declare global {
  interface Window {
    game?: Game;
  }
}

/**
 * メインゲームクラス
 */
class Game {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;
  private animationId: number | null = null;

  // ゲーム状態
  private state!: GameState;
  private playerMesh: THREE.Object3D | null = null;
  private currentSword: THREE.Group | null = null;
  private lastAttackTime: number = 0;
  private lastPlayerAttack: number = 0;
  private attackCooldown: number = 0.3;

  // 入力管理
  private keys: { [key: string]: boolean } = {};
  private isMobile: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchCurrentX: number = 0;
  private touchCurrentY: number = 0;
  private isTouching: boolean = false;

  // 敵管理
  private enemies: THREE.Mesh[] = [];
  private enemySpeed: number = 2.0;
  private enemyAttackRange: number = 1.5;
  private enemyAttackCooldown: number = 2.0;
  private lastEnemyAttack: number = 0;

  // UI要素
  private loadingScreen: HTMLElement | null = null;
  private loadingProgress: HTMLElement | null = null;
  private healthCountEl: HTMLElement | null = null;
  private maxHealthCountEl: HTMLElement | null = null;
  private levelCountEl: HTMLElement | null = null;
  private expCountEl: HTMLElement | null = null;
  private meatCountEl: HTMLElement | null = null;
  private processedCountEl: HTMLElement | null = null;
  private moneyCountEl: HTMLElement | null = null;
  private controlStatusEl: HTMLElement | null = null;
  private controlModeEl: HTMLElement | null = null;
  private controlStatusIndicatorEl: HTMLElement | null = null;
  private zoneTitleEl: HTMLElement | null = null;

  // エフェクト
  private damageTexts: Array<{
    element: HTMLElement;
    timeLeft: number;
    position: THREE.Vector3;
  }> = [];

  // 雪のパーティクル
  private snowParticles: THREE.Points | null = null;

  constructor() {
    this.detectDevice();
    this.initializeCoreSystems();
    this.initializeGameState();
    this.initializeUI();
    this.initialize();
  }

  /**
   * デバイスを検出
   */
  private detectDevice(): void {
    // タッチデバイスかどうかを検出
    this.isMobile =
      "ontouchstart" in window ||
      (typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.maxTouchPoints > 0);

    // ユーザーエージェントでも確認
    if (!this.isMobile && typeof window !== "undefined" && window.navigator) {
      this.isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          window.navigator.userAgent
        );
    }

    // デバッグ用ログ（本番環境での問題調査）
    if (typeof window !== "undefined" && window.location) {
      const isProduction = window.location.hostname === "koba-1423.github.io";
      if (isProduction) {
        console.log("🔍 本番環境デバッグ情報:");
        console.log("- デバイス:", this.isMobile ? "モバイル" : "PC");
        console.log("- URL:", window.location.href);
        console.log("- User Agent:", window.navigator.userAgent);
        console.log("- Touch Support:", "ontouchstart" in window);
        console.log("- Max Touch Points:", window.navigator.maxTouchPoints);
      }
    }
  }

  /**
   * コアシステムを初期化
   */
  private initializeCoreSystems(): void {
    // シーン設定
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // DOMに追加
    document.body.appendChild(this.renderer.domElement);

    // 時計
    this.clock = new THREE.Clock();

    // ウィンドウリサイズイベントリスナーを追加
    this.setupResizeHandler();

    // ライティング
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    // 雪原の地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f8ff, // 雪のような白い色
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 雪のパーティクルシステムを作成
    this.createSnowParticles();
  }

  /**
   * 雪のパーティクルシステムを作成
   */
  private createSnowParticles(): void {
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

    // 雪のマテリアル
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.snowParticles = new THREE.Points(geometry, material);
    this.scene.add(this.snowParticles);
  }

  /**
   * ウィンドウリサイズハンドラーを設定
   */
  private setupResizeHandler(): void {
    window.addEventListener("resize", () => {
      // カメラのアスペクト比を更新
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      // レンダラーのサイズを更新
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    });
  }

  /**
   * ゲーム状態を初期化
   */
  private initializeGameState(): void {
    this.state = createInitialState(1);
  }

  /**
   * UIを初期化
   */
  private initializeUI(): void {
    // ローディング画面
    this.loadingScreen = document.getElementById("loadingScreen");
    this.loadingProgress = document.getElementById("loadingProgress");

    // HUD要素
    this.healthCountEl = document.getElementById("healthCount");
    this.maxHealthCountEl = document.getElementById("maxHealthCount");
    this.levelCountEl = document.getElementById("levelCount");
    this.expCountEl = document.getElementById("expCount");
    this.meatCountEl = document.getElementById("meatCount");
    this.processedCountEl = document.getElementById("processedCount");
    this.moneyCountEl = document.getElementById("moneyCount");
    this.controlStatusEl = document.getElementById("controlStatus");
    this.controlModeEl = document.getElementById("controlMode");
    this.controlStatusIndicatorEl = document.getElementById(
      "controlStatusIndicator"
    );
    this.zoneTitleEl = document.getElementById("zoneTitle");

    // 入力イベント
    this.setupInputEvents();
  }

  /**
   * 入力イベントを設定
   */
  private setupInputEvents(): void {
    if (this.isMobile) {
      this.setupMobileControls();
    } else {
      this.setupPCControls();
    }
  }

  /**
   * PC用の操作を設定
   */
  private setupPCControls(): void {
    // デバッグ用ログ（本番環境での問題調査）
    const isProduction =
      typeof window !== "undefined" &&
      window.location &&
      window.location.hostname === "koba-1423.github.io";
    if (isProduction) {
      console.log("🎮 PC操作設定開始");
    }

    // フォーカスを確保するためのクリックイベント
    document.addEventListener("click", (event) => {
      // フォーカスを確保
      if (document.body) {
        document.body.focus();
        document.body.tabIndex = -1;
      }

      event.preventDefault();
      this.handlePlayerAttack();

      if (isProduction) {
        console.log("🖱️ クリック攻撃 - フォーカス確保");
      }
    });

    // キーボードイベント（矢印キー対応）- documentとwindowの両方に設定
    const keyHandler = (event: KeyboardEvent) => {
      event.preventDefault();
      this.keys[event.code] = true;

      if (isProduction) {
        console.log(
          "⌨️ キー押下:",
          event.code,
          "現在のキー状態:",
          Object.keys(this.keys).filter((key) => this.keys[key])
        );
      }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      event.preventDefault();
      this.keys[event.code] = false;

      if (isProduction) {
        console.log(
          "⌨️ キー離上:",
          event.code,
          "現在のキー状態:",
          Object.keys(this.keys).filter((key) => this.keys[key])
        );
      }
    };

    // documentとwindowの両方にイベントリスナーを追加
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyUpHandler);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("keyup", keyUpHandler);

    // フォーカスが外れた時の処理
    window.addEventListener("blur", () => {
      this.keys = {};
      if (isProduction) {
        console.log("👁️ フォーカス外れ - キー状態リセット");
      }
    });

    // フォーカスが戻った時の処理
    window.addEventListener("focus", () => {
      if (isProduction) {
        console.log("👁️ フォーカス復帰");
      }
    });

    // 本番環境では追加のフォーカス確保
    if (isProduction) {
      // ページロード後にフォーカスを確保
      const focusAttempts = [500, 1000, 1500, 2000, 3000];
      focusAttempts.forEach((delay) => {
        setTimeout(() => {
          if (document.body) {
            document.body.focus();
            document.body.tabIndex = -1;
            console.log(`🎯 フォーカス確保試行 (${delay}ms)`);
          }
        }, delay);
      });

      // キーイベントが検出されない場合の警告
      setTimeout(() => {
        console.log("⚠️ キーイベント検出テスト開始");
        console.log("- フォーカス状態:", document.hasFocus());
        console.log("- アクティブ要素:", document.activeElement?.tagName);
        console.log("- キーイベントリスナー設定済み");
      }, 5000);
    }
  }

  /**
   * モバイル用の操作を設定
   */
  private setupMobileControls(): void {
    // タッチ開始
    document.addEventListener("touchstart", (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchCurrentX = touch.clientX;
      this.touchCurrentY = touch.clientY;
      this.isTouching = true;
    });

    // タッチ移動
    document.addEventListener("touchmove", (event) => {
      event.preventDefault();
      if (this.isTouching) {
        const touch = event.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
      }
    });

    // タッチ終了
    document.addEventListener("touchend", (event) => {
      event.preventDefault();
      this.isTouching = false;
    });

    // タッチキャンセル
    document.addEventListener("touchcancel", (event) => {
      event.preventDefault();
      this.isTouching = false;
    });
  }

  /**
   * ゲームを初期化
   */
  private initialize(): void {
    // プレイヤーモデルを初期化
    this.initializePlayerModel();

    // 敵を生成
    this.spawnEnemies();

    // ローディング画面を非表示
    this.hideLoadingScreen();

    // ゲームループを開始
    this.startGameLoop();
  }

  /**
   * プレイヤーモデルを初期化
   */
  private initializePlayerModel(): void {
    // プレイヤーモデルを作成
    const playerMesh = this.createHumanModel(this.state.weaponLevel);
    playerMesh.position.set(0, 0, 0);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    this.scene.add(playerMesh);
    this.playerMesh = playerMesh;

    // デバッグ用ログ（本番環境での問題調査）
    const isProduction =
      typeof window !== "undefined" &&
      window.location &&
      window.location.hostname === "koba-1423.github.io";
    if (isProduction) {
      console.log("👤 プレイヤーモデル初期化:", {
        position: {
          x: playerMesh.position.x,
          y: playerMesh.position.y,
          z: playerMesh.position.z,
        },
        sceneChildren: this.scene.children.length,
        playerMeshExists: !!this.playerMesh,
      });
    }

    // 武器を作成
    this.updateSword();
  }

  /**
   * 人間モデルを作成
   */
  private createHumanModel(_weaponLevel: number): THREE.Group {
    const group = new THREE.Group();

    // 体
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // 頭
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);

    // 腕
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.8, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.8, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    group.add(rightArm);

    // 脚
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
  }

  /**
   * 武器を更新
   */
  private updateSword(): void {
    // 既存の武器を削除
    if (this.currentSword) {
      this.scene.remove(this.currentSword);
    }

    // 新しい武器を作成
    this.currentSword = this.createSword(this.state.weaponLevel);
    this.currentSword.position.set(0.3, 0.8, 0);
    this.currentSword.rotation.z = -Math.PI / 4;

    // プレイヤーメッシュに武器を追加
    if (this.playerMesh) {
      this.playerMesh.add(this.currentSword);
    }
  }

  /**
   * 剣を作成
   */
  private createSword(_level: number): THREE.Group {
    const group = new THREE.Group();

    // 剣身
    const bladeGeometry = new THREE.BoxGeometry(0.1, 1.0, 0.05);
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.5;
    blade.castShadow = true;
    group.add(blade);

    // 柄
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.15;
    handle.castShadow = true;
    group.add(handle);

    return group;
  }

  /**
   * 敵を生成
   */
  private spawnEnemies(): void {
    // 敵のジオメトリとマテリアル
    const enemyGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

    // 敵を生成
    for (let i = 0; i < 30; i++) {
      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

      // ランダムな位置に配置
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      enemy.position.set(x, 0.3, z);
      enemy.castShadow = true;
      enemy.receiveShadow = true;

      this.scene.add(enemy);
      this.enemies.push(enemy);
    }
  }

  /**
   * ローディング画面を非表示
   */
  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = "0";
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = "none";
        }
      }, 500);
    }
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
    this.updatePlayerMovement(deltaTime);

    // 敵の更新
    this.updateEnemies(deltaTime);

    // カメラを更新
    this.updateCamera();

    // UIを更新
    this.updateUI();

    // ダメージテキストを更新
    this.updateDamageTexts(deltaTime);

    // 雪のパーティクルを更新
    this.updateSnowParticles(deltaTime);
  }

  /**
   * プレイヤーの移動を更新
   */
  private updatePlayerMovement(deltaTime: number): void {
    if (!this.playerMesh) return;

    const moveSpeed = 5.0;
    const moveVector = new THREE.Vector3();

    if (this.isMobile) {
      // モバイル用のタッチ操作
      this.updateMobileMovement(moveVector, deltaTime);
    } else {
      // PC用のキーボード操作
      this.updatePCMovement(moveVector);
    }

    // 正規化
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(moveSpeed * deltaTime);

      // デバッグ用ログ（本番環境での問題調査）
      const isProduction =
        typeof window !== "undefined" &&
        window.location &&
        window.location.hostname === "koba-1423.github.io";
      if (isProduction) {
        console.log("🚶 移動処理詳細:", {
          beforePosition: {
            x: this.playerMesh.position.x,
            y: this.playerMesh.position.y,
            z: this.playerMesh.position.z,
          },
          moveVector: { x: moveVector.x, y: moveVector.y, z: moveVector.z },
          deltaTime: deltaTime,
          moveSpeed: moveSpeed,
        });
      }

      // プレイヤーを移動
      this.playerMesh.position.add(moveVector);

      // 移動後の位置をログ出力
      if (isProduction) {
        console.log("🚶 移動後位置:", {
          afterPosition: {
            x: this.playerMesh.position.x,
            y: this.playerMesh.position.y,
            z: this.playerMesh.position.z,
          },
        });
      }
    }
  }

  /**
   * PC用の移動処理
   */
  private updatePCMovement(moveVector: THREE.Vector3): void {
    // 矢印キーとWASDキーに対応
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveVector.z -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveVector.z += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveVector.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveVector.x += 1;

    // デバッグ用ログ（本番環境での問題調査）
    const isProduction =
      typeof window !== "undefined" &&
      window.location &&
      window.location.hostname === "koba-1423.github.io";
    if (isProduction && moveVector.length() > 0) {
      console.log("🎮 移動入力検出:", {
        keys: Object.keys(this.keys).filter((key) => this.keys[key]),
        moveVector: { x: moveVector.x, z: moveVector.z },
        length: moveVector.length(),
      });
    }
  }

  /**
   * モバイル用の移動処理
   */
  private updateMobileMovement(
    moveVector: THREE.Vector3,
    _deltaTime: number
  ): void {
    if (!this.isTouching) return;

    // タッチの移動量を計算
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;

    // 移動の閾値（小さな動きは無視）
    const threshold = 10;
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return;

    // タッチの方向に基づいて移動
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 左右の移動
      if (deltaX > 0) {
        moveVector.x += 1; // 右
      } else {
        moveVector.x -= 1; // 左
      }
    } else {
      // 上下の移動
      if (deltaY > 0) {
        moveVector.z += 1; // 下
      } else {
        moveVector.z -= 1; // 上
      }
    }
  }

  /**
   * プレイヤーの攻撃処理
   */
  private handlePlayerAttack(): void {
    if (!this.playerMesh) return;

    const currentTime = this.clock.getElapsedTime();

    // 攻撃クールダウンチェック
    if (currentTime - this.lastPlayerAttack < this.attackCooldown) {
      return;
    }

    this.lastPlayerAttack = currentTime;

    // 攻撃範囲内の敵を検索
    const attackRange = 2.0;
    const enemiesInRange = this.enemies.filter((enemy) => {
      const distance = enemy.position.distanceTo(this.playerMesh!.position);
      return distance <= attackRange;
    });

    // 攻撃範囲内の敵にダメージ
    enemiesInRange.forEach((enemy) => {
      this.damageEnemy(enemy);
    });

    // 攻撃エフェクト表示
    this.showAttackEffect();
  }

  /**
   * 敵にダメージを与える
   */
  private damageEnemy(enemy: THREE.Mesh): void {
    // ダメージ計算
    const damage = this.calculatePlayerDamage();

    // ダメージテキスト表示
    this.showDamageText(enemy.position, damage);

    // 敵を削除（倒した）
    this.scene.remove(enemy);
    const enemyIndex = this.enemies.indexOf(enemy);
    if (enemyIndex > -1) {
      this.enemies.splice(enemyIndex, 1);
    }

    // リソース獲得
    this.gainResources();
  }

  /**
   * プレイヤーのダメージ計算
   */
  private calculatePlayerDamage(): number {
    return calculateDamage(this.state.weaponLevel);
  }

  /**
   * リソース獲得処理
   */
  private gainResources(): void {
    // 肉を1個獲得
    this.state.meatCount += 1;

    // お金を少し獲得
    this.state.money += 5;

    // 経験値を獲得
    this.gainExperience(10);

    // リソース獲得エフェクト
    this.showResourceGainEffect();
  }

  /**
   * 経験値獲得処理
   */
  private gainExperience(exp: number): void {
    this.state.experience += exp;

    // レベルアップチェック
    const requiredExp = this.getExperienceRequired(this.state.level + 1);
    if (this.state.experience >= requiredExp) {
      this.levelUp();
    }
  }

  /**
   * レベルアップ処理
   */
  private levelUp(): void {
    this.state.level += 1;
    this.state.maxHealth += 20;
    this.state.health = this.state.maxHealth; // 体力全回復

    // レベルアップエフェクト
    this.showLevelUpEffect();
  }

  /**
   * 必要経験値を取得
   */
  private getExperienceRequired(level: number): number {
    return level * 100 + (level - 1) * 50;
  }

  /**
   * リソース獲得エフェクト表示
   */
  private showResourceGainEffect(): void {
    const effectText = document.createElement("div");
    effectText.textContent = "+肉 +お金 +経験値";
    effectText.style.position = "absolute";
    effectText.style.left = "50%";
    effectText.style.top = "40%";
    effectText.style.transform = "translate(-50%, -50%)";
    effectText.style.color = "#00ff00";
    effectText.style.fontSize = "18px";
    effectText.style.fontWeight = "bold";
    effectText.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
    effectText.style.pointerEvents = "none";
    effectText.style.zIndex = "2000";

    document.body.appendChild(effectText);

    // アニメーション
    let opacity = 1;
    let yOffset = 0;
    const animate = () => {
      opacity -= 0.02;
      yOffset += 1;
      effectText.style.opacity = opacity.toString();
      effectText.style.transform = `translate(-50%, calc(-50% - ${yOffset}px))`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(effectText);
      }
    };
    animate();
  }

  /**
   * レベルアップエフェクト表示
   */
  private showLevelUpEffect(): void {
    const levelUpText = document.createElement("div");
    levelUpText.textContent = `レベルアップ！ Lv.${this.state.level}`;
    levelUpText.style.position = "absolute";
    levelUpText.style.left = "50%";
    levelUpText.style.top = "30%";
    levelUpText.style.transform = "translate(-50%, -50%)";
    levelUpText.style.color = "#ffff00";
    levelUpText.style.fontSize = "28px";
    levelUpText.style.fontWeight = "bold";
    levelUpText.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
    levelUpText.style.pointerEvents = "none";
    levelUpText.style.zIndex = "2000";

    document.body.appendChild(levelUpText);

    // アニメーション
    let opacity = 1;
    let yOffset = 0;
    const animate = () => {
      opacity -= 0.015;
      yOffset += 1.5;
      levelUpText.style.opacity = opacity.toString();
      levelUpText.style.transform = `translate(-50%, calc(-50% - ${yOffset}px))`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(levelUpText);
      }
    };
    animate();
  }

  /**
   * 攻撃エフェクト表示
   */
  private showAttackEffect(): void {
    // 攻撃エフェクトの実装（将来的にパーティクルエフェクトなど）
  }

  /**
   * ダメージテキスト表示
   */
  private showDamageText(position: THREE.Vector3, damage: number): void {
    const damageText = document.createElement("div");
    damageText.className = "damage-text";
    damageText.textContent = `-${damage}`;
    damageText.style.position = "absolute";
    damageText.style.left = "50%";
    damageText.style.top = "50%";
    damageText.style.transform = "translate(-50%, -50%)";
    damageText.style.color = "#ff4444";
    damageText.style.fontSize = "24px";
    damageText.style.fontWeight = "bold";
    damageText.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
    damageText.style.pointerEvents = "none";
    damageText.style.zIndex = "2000";

    document.body.appendChild(damageText);

    // アニメーション
    let opacity = 1;
    let yOffset = 0;
    const animate = () => {
      opacity -= 0.02;
      yOffset += 2;
      damageText.style.opacity = opacity.toString();
      damageText.style.transform = `translate(-50%, calc(-50% - ${yOffset}px))`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(damageText);
      }
    };
    animate();
  }

  /**
   * 敵を更新
   */
  private updateEnemies(deltaTime: number): void {
    if (!this.playerMesh) return;

    const currentTime = this.clock.getElapsedTime();

    this.enemies.forEach((enemy) => {
      const distance = enemy.position.distanceTo(this.playerMesh!.position);

      if (distance < 20) {
        // プレイヤーに向かって移動
        const direction = new THREE.Vector3()
          .subVectors(this.playerMesh!.position, enemy.position)
          .normalize();

        enemy.position.add(
          direction.multiplyScalar(this.enemySpeed * deltaTime)
        );

        // 攻撃範囲内で攻撃
        if (distance <= this.enemyAttackRange) {
          if (currentTime - this.lastEnemyAttack >= this.enemyAttackCooldown) {
            this.handleEnemyAttack(enemy);
            this.lastEnemyAttack = currentTime;
          }
        }
      }
    });
  }

  /**
   * 敵の攻撃処理
   */
  private handleEnemyAttack(enemy: THREE.Mesh): void {
    if (!this.playerMesh) return;

    // プレイヤーにダメージ
    this.damagePlayer();

    // 攻撃エフェクト
    this.showEnemyAttackEffect(enemy.position);
  }

  /**
   * プレイヤーにダメージを与える
   */
  private damagePlayer(): void {
    const enemyDamage = 10; // 敵の基本ダメージ
    const defense = this.calculatePlayerDefense();
    const actualDamage = Math.max(1, enemyDamage - defense);

    this.state.health -= actualDamage;

    // ダメージテキスト表示
    this.showPlayerDamageText(actualDamage);

    // 体力が0以下になった場合の処理
    if (this.state.health <= 0) {
      this.handlePlayerDeath();
    }
  }

  /**
   * プレイヤーの防御力計算
   */
  private calculatePlayerDefense(): number {
    return calculateDefense(this.state.armorLevel);
  }

  /**
   * プレイヤーのダメージテキスト表示
   */
  private showPlayerDamageText(damage: number): void {
    const damageText = document.createElement("div");
    damageText.className = "damage-text";
    damageText.textContent = `-${damage}`;
    damageText.style.position = "absolute";
    damageText.style.left = "50%";
    damageText.style.top = "50%";
    damageText.style.transform = "translate(-50%, -50%)";
    damageText.style.color = "#ff0000";
    damageText.style.fontSize = "32px";
    damageText.style.fontWeight = "bold";
    damageText.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
    damageText.style.pointerEvents = "none";
    damageText.style.zIndex = "2000";

    document.body.appendChild(damageText);

    // アニメーション
    let opacity = 1;
    let yOffset = 0;
    const animate = () => {
      opacity -= 0.02;
      yOffset += 3;
      damageText.style.opacity = opacity.toString();
      damageText.style.transform = `translate(-50%, calc(-50% - ${yOffset}px))`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(damageText);
      }
    };
    animate();
  }

  /**
   * 敵の攻撃エフェクト表示
   */
  private showEnemyAttackEffect(_position: THREE.Vector3): void {
    // 敵の攻撃エフェクト（将来的にパーティクルエフェクトなど）
  }

  /**
   * プレイヤーの死亡処理
   */
  private handlePlayerDeath(): void {
    // 将来的にゲームオーバー画面を表示
    this.state.health = this.state.maxHealth; // 一時的に体力を回復
  }

  /**
   * カメラを更新
   */
  private updateCamera(): void {
    if (this.playerMesh) {
      const isProduction =
        typeof window !== "undefined" &&
        window.location &&
        window.location.hostname === "koba-1423.github.io";

      if (isProduction) {
        console.log("📷 カメラ更新:", {
          playerPosition: {
            x: this.playerMesh.position.x,
            y: this.playerMesh.position.y,
            z: this.playerMesh.position.z,
          },
          cameraPosition: {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z,
          },
        });
      }

      this.camera.position.x = this.playerMesh.position.x;
      this.camera.position.z = this.playerMesh.position.z + 20;

      if (isProduction) {
        console.log("📷 カメラ更新後:", {
          newCameraPosition: {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z,
          },
        });
      }
    }
  }

  /**
   * UIを更新
   */
  private updateUI(): void {
    if (this.healthCountEl) {
      this.healthCountEl.textContent = this.state.health.toString();
    }
    if (this.maxHealthCountEl) {
      this.maxHealthCountEl.textContent = this.state.maxHealth.toString();
    }
    if (this.levelCountEl) {
      this.levelCountEl.textContent = this.state.level.toString();
    }
    if (this.expCountEl) {
      this.expCountEl.textContent = this.state.experience.toString();
    }
    if (this.meatCountEl) {
      this.meatCountEl.textContent = this.state.meatCount.toString();
    }
    if (this.processedCountEl) {
      this.processedCountEl.textContent = this.state.processedMeats.toString();
    }
    if (this.moneyCountEl) {
      this.moneyCountEl.textContent = this.state.money.toString();
    }
    if (this.controlStatusEl) {
      this.controlStatusEl.textContent = "ON";
    }
    if (this.controlModeEl) {
      this.controlModeEl.textContent = "NORMAL";
    }
    if (this.controlStatusIndicatorEl) {
      this.controlStatusIndicatorEl.className = "status-on";
    }
    if (this.zoneTitleEl) {
      this.zoneTitleEl.textContent = "雪原";
    }
  }

  /**
   * 雪のパーティクルを更新
   */
  private updateSnowParticles(deltaTime: number): void {
    if (!this.snowParticles) return;

    const positions = this.snowParticles.geometry.attributes.position
      .array as Float32Array;
    const velocities = this.snowParticles.geometry.attributes.velocity
      .array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // 位置を更新
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

    // ジオメトリを更新
    this.snowParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * ダメージテキストを更新
   */
  private updateDamageTexts(deltaTime: number): void {
    this.damageTexts = this.damageTexts.filter((damageText) => {
      damageText.timeLeft -= deltaTime;
      if (damageText.timeLeft <= 0) {
        document.body.removeChild(damageText.element);
        return false;
      }
      return true;
    });
  }

  /**
   * レンダリング
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}

// ゲームを開始
window.addEventListener("load", () => {
  console.log("🚀 ゲーム初期化開始 (load event)");
  new Game();
});

// DOMContentLoadedでも初期化（本番環境での互換性向上）
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 ゲーム初期化開始 (DOMContentLoaded event)");
  if (!window.game) {
    window.game = new Game();
  }
});

// 本番環境での追加デバッグ
if (
  typeof window !== "undefined" &&
  window.location &&
  window.location.hostname === "koba-1423.github.io"
) {
  console.log("🌐 本番環境検出");
  console.log("- 現在のURL:", window.location.href);
  console.log("- プロトコル:", window.location.protocol);
  console.log("- ホスト:", window.location.hostname);

  // 本番環境でのフォーカス確保
  const ensureFocus = () => {
    if (document.body) {
      document.body.focus();
      document.body.tabIndex = -1;
      console.log("🎯 フォーカス確保実行");
    }
  };

  // 複数のタイミングでフォーカス確保
  setTimeout(ensureFocus, 500);
  setTimeout(ensureFocus, 1000);
  setTimeout(ensureFocus, 2000);

  // ユーザーインタラクション時にフォーカス確保
  document.addEventListener("click", ensureFocus);
  document.addEventListener("touchstart", ensureFocus);
  document.addEventListener("keydown", ensureFocus);

  // イベントリスナーの状態確認
  setTimeout(() => {
    console.log("🔍 イベントリスナー状態確認:");
    console.log("- document readyState:", document.readyState);
    console.log("- window loaded:", document.readyState === "complete");
    console.log("- document.activeElement:", document.activeElement?.tagName);
    console.log("- document.hasFocus():", document.hasFocus());
  }, 1000);
}
