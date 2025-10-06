
/**
 * チュートリアル画面管理クラス
 * ゲーム開始時に遊び方を表示します
 */
export class TutorialScreen {
  private container: HTMLElement;
  private isVisible: boolean = true;
  private onStartCallback?: () => void;

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
  }

  /**
   * メインコンテナを作成
   */
  private createMainContainer(): void {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Arial', sans-serif;
      color: white;
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
      padding: 2rem;
      border-radius: 15px;
      max-width: 800px;
      margin: 0 2rem;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;

    const instructions = this.getInstructionText();
    const instructionText = document.createElement("div");
    instructionText.innerHTML = instructions
      .map(line => line === "" ? "<br>" : `<div style="margin: 0.5rem 0; line-height: 1.6;">${line}</div>`)
      .join("");
    instructionText.style.cssText = `
      font-size: 1.1rem;
      line-height: 1.6;
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
      "• WASDキーまたは矢印キーで移動",
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
      "準備ができたら「ゲーム開始」ボタンを押してください！"
    ];
  }

  /**
   * スタートボタンを作成
   */
  private createStartButton(): HTMLElement {
    const startButton = document.createElement("button");
    startButton.textContent = "ゲーム開始";
    startButton.style.cssText = `
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      color: white;
      border: none;
      padding: 1rem 3rem;
      font-size: 1.5rem;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
      margin-top: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    this.addButtonEffects(startButton);
    return startButton;
  }

  /**
   * ボタンエフェクトを追加
   */
  private addButtonEffects(button: HTMLElement): void {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    });

    button.addEventListener("click", () => {
      this.hide();
      if (this.onStartCallback) {
        this.onStartCallback();
      }
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
