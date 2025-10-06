/**
 * チュートリアル画面管理クラス
 * ゲーム開始時に遊び方を表示します
 */
export class TutorialScreen {
  private container: HTMLElement;
  private isVisible: boolean = true;
  private onStartCallback?: () => void;
  private isButtonClicked: boolean = false;

  constructor(onStart?: () => void) {
    this.onStartCallback = onStart;
    this.createTutorialScreen();
  }

  /**
   * チュートリアル画面を作成
   */
  private createTutorialScreen(): void {
    this.createMainContainer();
    const title = this.createTitle();
    const instructionContainer = this.createInstructionContainer();
    const startButton = this.createStartButton();

    // 要素を組み立て
    this.container.appendChild(title);
    this.container.appendChild(instructionContainer);
    this.container.appendChild(startButton);

    // ページに追加
    document.body.appendChild(this.container);

    // ボタンが確実に表示されるように強制更新
    setTimeout(() => {
      if (startButton && startButton.parentNode) {
        startButton.style.display = "block";
        startButton.style.visibility = "visible";
        startButton.style.opacity = "1";
        // ボタンのテキストも確認
        startButton.textContent = "ゲーム開始";
      }
    }, 100);
  }

  /**
   * メインコンテナを作成
   */
  private createMainContainer(): void {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      align-items: center !important;
      z-index: 999999 !important;
      font-family: 'Arial', sans-serif !important;
      color: white !important;
      margin: 0 !important;
      padding: 2rem 0 !important;
      border: none !important;
      outline: none !important;
      overflow-y: auto !important;
    `;
  }

  /**
   * タイトルを作成
   */
  private createTitle(): HTMLElement {
    const title = document.createElement("h1");
    title.textContent = "小林サバイバル";
    title.style.cssText = `
      font-size: 3rem;
      margin-bottom: 2rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      text-align: center;
    `;
    return title;
  }

  /**
   * 説明文コンテナを作成
   */
  private createInstructionContainer(): HTMLElement {
    const instructionContainer = document.createElement("div");
    instructionContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      padding: 1.5rem;
      border-radius: 15px;
      max-width: 600px;
      margin: 0 2rem;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      max-height: 60vh;
      overflow-y: auto;
    `;

    const instructions = this.getInstructionText();
    const instructionText = document.createElement("div");
    instructionText.innerHTML = instructions
      .map((line) =>
        line === ""
          ? "<br>"
          : `<div style="margin: 0.5rem 0; line-height: 1.6;">${line}</div>`
      )
      .join("");
    instructionText.style.cssText = `
      font-size: 1rem;
      line-height: 1.4;
    `;

    instructionContainer.appendChild(instructionText);
    return instructionContainer;
  }

  /**
   * 説明文テキストを取得
   */
  private getInstructionText(): string[] {
    return [
      "🎮 ゲームの遊び方",
      "",
      "【基本操作】",
      "• PC: WASDキーまたは矢印キーで移動",
      "• スマホ: 画面をタッチして移動",
      "• 敵に近づくと自動で攻撃",
      "",
      "【エリアの使い方】",
      "• 🍖 加工エリア: 生肉を焼き肉に変換",
      "• 💰 換金エリア: 焼き肉をコインに変換",
      "• ⚔️ 武器エリア: 50円で武器をアップグレード",
      "• 🏰 タワーエリア: 50円でタワーをアップグレード",
      "",
      "【戦略】",
      "• 敵を倒して生肉を獲得",
      "• 生肉を焼き肉に加工",
      "• 焼き肉をコインに換金",
      "• コインで武器やタワーを強化",
      "",
      "【タワーシステム】",
      "• タワーは自動で敵を攻撃",
      "• タワーが倒した敵からも生肉を獲得",
      "• タワーを強化すると攻撃力が向上",
      "",
      "準備ができたら「ゲーム開始」ボタンを押してください！",
    ];
  }

  /**
   * スタートボタンを作成
   */
  private createStartButton(): HTMLElement {
    const startButton = document.createElement("button");
    startButton.textContent = "ゲーム開始";
    startButton.style.cssText = `
      background: #ff4444 !important;
      color: white !important;
      border: 3px solid #ffffff !important;
      padding: 1.5rem 4rem !important;
      font-size: 2rem !important;
      font-weight: bold !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      margin-top: 3rem !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
      transition: all 0.3s ease !important;
      text-transform: uppercase !important;
      letter-spacing: 2px !important;
      display: block !important;
      width: auto !important;
      min-width: 300px !important;
      z-index: 1000000 !important;
      position: relative !important;
      visibility: visible !important;
      opacity: 1 !important;
      touch-action: manipulation !important;
      user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    `;

    this.addButtonEffects(startButton);
    return startButton;
  }

  /**
   * ボタンエフェクトを追加
   */
  private addButtonEffects(button: HTMLElement): void {
    // PC用ホバーエフェクト
    button.addEventListener("mouseenter", () => {
      if (!this.isButtonClicked) {
        button.style.transform = "translateY(-2px)";
        button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
      }
    });

    button.addEventListener("mouseleave", () => {
      if (!this.isButtonClicked) {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
      }
    });

    // クリック/タップ処理（重複防止）
    const handleStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.isButtonClicked) {
        return; // 既にクリック済みの場合は何もしない
      }

      this.isButtonClicked = true;

      // ボタンを無効化
      button.style.opacity = "0.7";
      button.style.cursor = "not-allowed";
      button.style.pointerEvents = "none";
      button.textContent = "ゲーム開始中...";

      // 少し遅延してからゲーム開始
      setTimeout(() => {
        this.hide();
        if (this.onStartCallback) {
          this.onStartCallback();
        }
      }, 300);
    };

    // PC用クリック
    button.addEventListener("click", handleStart);

    // スマホ用タッチ
    button.addEventListener("touchstart", handleStart);

    // スマホ用タップ
    button.addEventListener("touchend", (e) => {
      e.preventDefault();
    });
  }

  /**
   * チュートリアル画面を非表示にする
   */
  public hide(): void {
    if (this.container && this.isVisible) {
      this.container.style.display = "none";
      this.isVisible = false;
    }
  }

  /**
   * チュートリアル画面を表示する
   */
  public show(): void {
    if (this.container && !this.isVisible) {
      this.container.style.display = "flex";
      this.isVisible = true;
    }
  }

  /**
   * チュートリアル画面が表示中かどうか
   */
  public isTutorialVisible(): boolean {
    return this.isVisible;
  }

  /**
   * チュートリアル画面を削除
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
