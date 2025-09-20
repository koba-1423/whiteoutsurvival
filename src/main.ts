import * as THREE from 'three';
import { createInitialState, GameState } from './state/frost_survival_design.js';

/**
 * メインゲームクラス
 */
class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  
  // ゲーム状態
  private state: GameState;
  private playerMesh: THREE.Object3D | null = null;
  private currentSword: THREE.Group | null = null;
  private lastAttackTime: number = 0;
  private lastPlayerAttack: number = 0;
  private attackCooldown: number = 0.3;
  
  // 入力管理
  private keys: { [key: string]: boolean } = {};
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isPointerLocked: boolean = false;
  
  // 敵管理
  private enemies: THREE.Mesh[] = [];
  private enemySpeed: number = 2.0;
  private enemyAttackRange: number = 1.5;
  private enemyAttackCooldown: number = 2.0;
  private lastEnemyAttack: number = 0;
  
  // UI要素
  private loadingScreen: HTMLElement | null = null;
  private loadingProgress: HTMLElement | null = null;
  private meatCountEl: HTMLElement | null = null;
  private processedCountEl: HTMLElement | null = null;
  private moneyCountEl: HTMLElement | null = null;
  private controlStatusEl: HTMLElement | null = null;
  private controlModeEl: HTMLElement | null = null;
  private controlStatusIndicatorEl: HTMLElement | null = null;
  
  // エフェクト
  private damageTexts: Array<{ element: HTMLElement; timeLeft: number; position: THREE.Vector3 }> = [];
  
  constructor() {
    this.initializeCoreSystems();
    this.initializeGameState();
    this.initializeUI();
    this.initialize();
  }

  /**
   * コアシステムを初期化
   */
  private initializeCoreSystems(): void {
    // シーン設定
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    
    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    
    // 地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x90EE90,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // フィールド（三角形エリア）
    this.createFieldTriangles();
    this.createWoodenFence();
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
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingProgress = document.getElementById('loadingProgress');
    
    // HUD要素
    this.meatCountEl = document.getElementById('meatCount');
    this.processedCountEl = document.getElementById('processedCount');
    this.moneyCountEl = document.getElementById('moneyCount');
    this.controlStatusEl = document.getElementById('controlStatus');
    this.controlModeEl = document.getElementById('controlMode');
    this.controlStatusIndicatorEl = document.getElementById('controlStatusIndicator');
    
    // 入力イベント
    this.setupInputEvents();
  }

  /**
   * 入力イベントを設定
   */
  private setupInputEvents(): void {
    // キーボードイベント
    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
    });
    
    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
    
    // マウスイベント
    document.addEventListener('mousemove', (event) => {
      if (this.isPointerLocked) {
        this.mouseX += event.movementX * 0.002;
        this.mouseY += event.movementY * 0.002;
        this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
      }
    });
    
    // クリックイベント
    document.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });
    
    // ポインターロックイベント
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
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
    
    // 武器を作成
    this.updateSword();
  }

  /**
   * 人間モデルを作成
   */
  private createHumanModel(weaponLevel: number): THREE.Group {
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
  private createSword(level: number): THREE.Group {
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
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.15;
    handle.castShadow = true;
    group.add(handle);
    
    return group;
  }

  /**
   * 三角形エリアを作成
   */
  private createFieldTriangles(): void {
    // 中心点
    const center = new THREE.Vector3(0, 0, 0);
    
    // 4つの三角形の頂点
    const topLeft = new THREE.Vector3(-50, 0, 50);
    const topRight = new THREE.Vector3(50, 0, 50);
    const bottomLeft = new THREE.Vector3(-50, 0, -50);
    const bottomRight = new THREE.Vector3(50, 0, -50);

    // 三角形エリアの色
    const colors = [0x66ffff, 0xffff66, 0x6666ff, 0x90ee90];
    const positions = [
      [center, topLeft, topRight],      // 上（北）
      [center, topRight, bottomRight],  // 右（東）
      [center, bottomRight, bottomLeft], // 下（南）
      [center, bottomLeft, topLeft]     // 左（西）
    ];

    positions.forEach((triangle, index) => {
      this.createTriangleArea(triangle, colors[index]);
    });
  }

  /**
   * 三角形エリアを作成
   */
  private createTriangleArea(vertices: THREE.Vector3[], color: number): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(9);
    
    vertices.forEach((vertex, index) => {
      positions[index * 3] = vertex.x;
      positions[index * 3 + 1] = vertex.y;
      positions[index * 3 + 2] = vertex.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  /**
   * 木製の柵を作成
   */
  private createWoodenFence(): void {
    const fenceGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    // 柵の柱を配置
    const fencePositions = [
      new THREE.Vector3(-2, 1, 0),
      new THREE.Vector3(2, 1, 0),
      new THREE.Vector3(0, 1, -2),
      new THREE.Vector3(0, 1, 2)
    ];
    
    fencePositions.forEach(pos => {
      const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.copy(pos);
      fence.castShadow = true;
      fence.receiveShadow = true;
      this.scene.add(fence);
    });
    
    // 柵の接続部分
    const connectionGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
    const connectionMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    // 水平の接続
    const horizontalConnection = new THREE.Mesh(connectionGeometry, connectionMaterial);
    horizontalConnection.rotation.z = Math.PI / 2;
    horizontalConnection.position.set(0, 1, 0);
    this.scene.add(horizontalConnection);
    
    // 垂直の接続
    const verticalConnection = new THREE.Mesh(connectionGeometry, connectionMaterial);
    verticalConnection.rotation.x = Math.PI / 2;
    verticalConnection.position.set(0, 1, 0);
    this.scene.add(verticalConnection);
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
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none';
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
  }

  /**
   * プレイヤーの移動を更新
   */
  private updatePlayerMovement(deltaTime: number): void {
    if (!this.playerMesh) return;
    
    const moveSpeed = 5.0;
    const moveVector = new THREE.Vector3();
    
    // キーボード入力
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;
    
    // 正規化
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(moveSpeed * deltaTime);
      
      // プレイヤーを移動
      this.playerMesh.position.add(moveVector);
    }
  }

  /**
   * 敵を更新
   */
  private updateEnemies(deltaTime: number): void {
    if (!this.playerMesh) return;
    
    this.enemies.forEach(enemy => {
      const distance = enemy.position.distanceTo(this.playerMesh!.position);
      
      if (distance < 20) {
        // プレイヤーに向かって移動
        const direction = new THREE.Vector3()
          .subVectors(this.playerMesh.position, enemy.position)
          .normalize();
        
        enemy.position.add(direction.multiplyScalar(this.enemySpeed * deltaTime));
      }
    });
  }

  /**
   * カメラを更新
   */
  private updateCamera(): void {
    if (this.playerMesh) {
      this.camera.position.x = this.playerMesh.position.x;
      this.camera.position.z = this.playerMesh.position.z + 20;
    }
  }

  /**
   * UIを更新
   */
  private updateUI(): void {
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
      this.controlStatusEl.textContent = this.isPointerLocked ? 'ON' : 'OFF';
    }
    if (this.controlModeEl) {
      this.controlModeEl.textContent = 'FPS';
    }
    if (this.controlStatusIndicatorEl) {
      this.controlStatusIndicatorEl.className = this.isPointerLocked ? 'status-on' : 'status-off';
    }
  }

  /**
   * ダメージテキストを更新
   */
  private updateDamageTexts(deltaTime: number): void {
    this.damageTexts = this.damageTexts.filter(damageText => {
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
window.addEventListener('load', () => {
  const game = new Game();
});
