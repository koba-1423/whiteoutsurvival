import * as THREE from "three";

/**
 * 入力管理クラス
 * PC（キーボード・マウス）とモバイル（タッチ）の両方に対応します
 */
export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private isMobile: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchCurrentX: number = 0;
  private touchCurrentY: number = 0;
  private isTouching: boolean = false;

  // 攻撃コールバック（外部から設定）
  private onAttackCallback: (() => void) | null = null;

  constructor() {
    this.detectDevice();
    this.setupInputEvents();
  }

  /**
   * デバイスを検出
   * タッチデバイスかPCかを判定します
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
   * キーボード（WASD・矢印キー）とマウスクリックに対応
   */
  private setupPCControls(): void {
    // フォーカスを確保するためのクリックイベント
    document.addEventListener("click", (event) => {
      // フォーカスを確保
      if (document.body) {
        document.body.focus();
        document.body.tabIndex = -1;
      }

      event.preventDefault();
      // 攻撃コールバックを実行
      if (this.onAttackCallback) {
        this.onAttackCallback();
      }
    });

    // キーボードイベント（矢印キー対応）
    const keyHandler = (event: KeyboardEvent) => {
      event.preventDefault();
      this.keys[event.code] = true;
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      event.preventDefault();
      this.keys[event.code] = false;
    };

    // documentとwindowの両方にイベントリスナーを追加
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyUpHandler);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("keyup", keyUpHandler);

    // フォーカスが外れた時の処理
    window.addEventListener("blur", () => {
      this.keys = {};
    });
  }

  /**
   * モバイル用の操作を設定
   * タッチ操作に対応
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
   * 移動入力を取得
   * PC（キーボード）またはモバイル（タッチ）の入力から移動ベクトルを計算します
   */
  public getMovementInput(): THREE.Vector3 {
    const moveVector = new THREE.Vector3();

    if (this.isMobile) {
      // モバイル用のタッチ操作
      this.getMobileMovement(moveVector);
    } else {
      // PC用のキーボード操作
      this.getPCMovement(moveVector);
    }

    return moveVector;
  }

  /**
   * PC用の移動入力
   * WASD・矢印キーに対応
   */
  private getPCMovement(moveVector: THREE.Vector3): void {
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveVector.z -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveVector.z += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveVector.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveVector.x += 1;
  }

  /**
   * モバイル用の移動入力
   * タッチの方向に基づいて移動
   */
  private getMobileMovement(moveVector: THREE.Vector3): void {
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
   * 攻撃コールバックを設定
   */
  public setAttackCallback(callback: () => void): void {
    this.onAttackCallback = callback;
  }

  /**
   * モバイルデバイスかどうか
   */
  public getIsMobile(): boolean {
    return this.isMobile;
  }
}
