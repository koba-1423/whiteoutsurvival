import { GameState } from "../state/frost_survival_design.js";

/**
 * UI管理クラス
 * ゲームのHUD（体力、レベル、リソースなど）を更新します
 */
export class UIManager {
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

  constructor() {
    this.initializeElements();
  }

  /**
   * HTML要素を取得
   */
  private initializeElements(): void {
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
  }

  /**
   * UIを更新
   * ゲームの状態に基づいてHUDの表示を更新します
   */
  public update(state: GameState): void {
    if (this.healthCountEl) {
      this.healthCountEl.textContent = state.health.toString();
    }
    if (this.maxHealthCountEl) {
      this.maxHealthCountEl.textContent = state.maxHealth.toString();
    }
    if (this.levelCountEl) {
      this.levelCountEl.textContent = state.level.toString();
    }
    if (this.expCountEl) {
      this.expCountEl.textContent = state.experience.toString();
    }
    if (this.meatCountEl) {
      this.meatCountEl.textContent = state.meatCount.toString();
    }
    if (this.processedCountEl) {
      this.processedCountEl.textContent = state.processedMeats.toString();
    }
    if (this.moneyCountEl) {
      this.moneyCountEl.textContent = (state.money * 10).toString(); // 1コイン=10円
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
   * ローディング画面を非表示
   */
  public hideLoadingScreen(): void {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.style.display = "none";
        }
      }, 500);
    }
  }
}
