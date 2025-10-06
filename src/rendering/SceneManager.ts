import * as THREE from "three";
import { createCookingStationArea } from "../areas/CookingStationArea.js";
import { createShopArea } from "../areas/ShopArea.js";
import { createForgeArea } from "../areas/ForgeArea.js";
import { createTowerArea } from "../areas/TowerArea.js";

/**
 * シーン、カメラ、レンダラー、ライティングを管理するクラス
 * 3D空間の基本的な設定を担当します
 */
/**
 * 衝突判定用の境界ボックス
 */
export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public collisionBoxes: CollisionBox[] = [];
  // 加工エリアのAABBと右側の出力座標（積み上げ位置）
  public cookingAreaBox?: CollisionBox;
  public cookingOutputPosition?: THREE.Vector3;
  // 換金エリアのAABBと右側の出力座標（コイン積み上げ位置）
  public shopAreaBox?: CollisionBox;
  public shopOutputPosition?: THREE.Vector3;

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

    // 主人公の初期位置の周りに円を描画
    this.createSpawnCircle();

    // セーフゾーンの周りに木の柵を配置
    this.createSafeZoneFence();

    // 拠点エリアを作成
    this.createBaseAreas();
  }

  /**
   * 主人公の初期スポーン位置に円を描画
   * 半径4の黄色い円を表示します
   */
  private createSpawnCircle(): void {
    // 塗りつぶしの円を作成
    const circleGeometry = new THREE.CircleGeometry(4, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00, // 黄色
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, 0.15, 0);
    this.scene.add(circle);
  }

  /**
   * 拠点エリアを作成
   * 主人公の下側に4つのエリアを配置します
   */
  private createBaseAreas(): void {
    const areaSize = 4; // 黄色い円と同じくらいのサイズ
    const distanceFromCenter = 15; // 主人公からの距離

    // 1. 左 - 加工エリア（茶色）
    this.createArea(-15, distanceFromCenter, areaSize, 0x8b4513, "加工エリア");
    const cookingCollisions = createCookingStationArea(
      this.scene,
      -15,
      distanceFromCenter
    );
    this.collisionBoxes.push(...cookingCollisions);
    this.cookingAreaBox = cookingCollisions[0];
    this.cookingOutputPosition = new THREE.Vector3(
      -15 + 3.0,
      1.0,
      distanceFromCenter
    );

    // 2. 真下中央 - 換金エリア（金色）
    this.createArea(0, distanceFromCenter, areaSize, 0xffd700, "換金エリア");
    const shopCollisions = createShopArea(this.scene, 0, distanceFromCenter);
    this.collisionBoxes.push(...shopCollisions);
    this.shopAreaBox = shopCollisions[0];
    this.shopOutputPosition = new THREE.Vector3(3.0, 1.0, distanceFromCenter);

    // 3. 右 - 武器アップグレードエリア（赤色）
    this.createArea(13, distanceFromCenter, areaSize, 0xff4444, "武器UP");
    const forgeCollisions = createForgeArea(this.scene, 13, distanceFromCenter);
    this.collisionBoxes.push(...forgeCollisions);

    // 4. 主人公の右側 - タワーエリア（床なし）
    const towerCollisions = createTowerArea(this.scene, 14, 0);
    this.collisionBoxes.push(...towerCollisions);
  }

  /**
   * 長方形エリアを作成
   */
  private createArea(
    x: number,
    z: number,
    size: number,
    color: number,
    _label: string
  ): void {
    const areaGeometry = new THREE.PlaneGeometry(size * 2, size * 2);
    const areaMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const area = new THREE.Mesh(areaGeometry, areaMaterial);
    area.rotation.x = -Math.PI / 2;
    area.position.set(x, 0.1, z);
    this.scene.add(area);
  }

  /**
   * セーフゾーンの周りに木の壁を配置
   * 黄色い円の上半円（画面奥側）にのみ壁を配置します
   */
  private createSafeZoneFence(): void {
    const wallRadius = 4; // 黄色い円の半径
    const wallCount = 32; // 壁の板の数（隙間を少なくするため増やす）
    const woodColor = 0x8b6f47; // 木の色

    for (let i = 0; i < wallCount; i++) {
      // 上半円に少し下側にもかぶるように配置（0.875π から 2.125π の範囲）
      const startAngle = Math.PI * 0.875;
      const angleRange = Math.PI * 1.25;
      const angle = startAngle + (i / wallCount) * angleRange;
      const x = Math.cos(angle) * wallRadius;
      const z = Math.sin(angle) * wallRadius;

      // 木の板を作成（縦長の板、円周に沿って配置）
      const plankGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.5);
      const plankMaterial = new THREE.MeshStandardMaterial({
        color: woodColor,
        roughness: 0.8,
      });
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set(x, 0.75, z);
      // 円周に沿うように90度ずらして回転
      plank.rotation.y = angle + Math.PI / 2;
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.scene.add(plank);
    }
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
