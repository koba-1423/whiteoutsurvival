import * as THREE from "three";

/**
 * シーン、カメラ、レンダラー、ライティングを管理するクラス
 * 3D空間の基本的な設定を担当します
 */
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  constructor() {
    // シーンの作成と背景色の設定
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // カメラの作成（視野角75度、アスペクト比は画面サイズに合わせる）
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // レンダラーの作成と設定
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // レンダラーをHTMLに追加
    document.body.appendChild(this.renderer.domElement);

    // ウィンドウサイズ変更時の処理を設定
    this.setupResizeHandler();

    // ライトを設定
    this.setupLighting();

    // 地面を作成
    this.createGround();
  }

  /**
   * ライティングを設定
   * 環境光と方向光を追加して、影を有効にします
   */
  private setupLighting(): void {
    // 環境光（全体を明るくする光）
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // 方向光（太陽のような光）影を落とす設定を有効化
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
  }

  /**
   * 雪原の地面を作成
   * 白い平面を水平に配置して、影を受けるようにします
   */
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f8ff, // 雪のような白い色
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // 地面を水平にする
    ground.receiveShadow = true; // 影を受ける
    this.scene.add(ground);
  }

  /**
   * ウィンドウサイズ変更時の処理
   * カメラとレンダラーのサイズを画面サイズに合わせて更新します
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
   * カメラをプレイヤーに追従させる
   * カメラは常にプレイヤーの後ろから追従し、プレイヤーを見下ろします
   */
  public updateCamera(playerPosition: THREE.Vector3): void {
    this.camera.position.x = playerPosition.x;
    this.camera.position.y = 20; // 高さは常に20に保つ
    this.camera.position.z = playerPosition.z + 20;
    this.camera.lookAt(playerPosition); // カメラを常にプレイヤーに向ける
  }

  /**
   * シーンをレンダリング（描画）
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
