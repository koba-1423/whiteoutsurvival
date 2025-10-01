import * as THREE from "three";

/**
 * エフェクト管理クラス
 * ダメージテキスト、レベルアップエフェクト、リソース獲得エフェクトなどを表示します
 */
export class EffectManager {
  /**
   * ダメージテキストを表示
   * 敵にダメージを与えたときに表示されます
   */
  public showDamageText(_position: THREE.Vector3, damage: number): void {
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

    // アニメーション（上に浮かびながらフェードアウト）
    this.animateFadeOut(damageText, 2);
  }

  /**
   * プレイヤーのダメージテキストを表示
   * プレイヤーがダメージを受けたときに表示されます
   */
  public showPlayerDamageText(damage: number): void {
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

    // アニメーション（上に浮かびながらフェードアウト）
    this.animateFadeOut(damageText, 3);
  }

  /**
   * リソース獲得エフェクトを表示
   * 敵を倒したときに表示されます
   */
  public showResourceGainEffect(): void {
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

    // アニメーション（上に浮かびながらフェードアウト）
    this.animateFadeOut(effectText, 1);
  }

  /**
   * レベルアップエフェクトを表示
   */
  public showLevelUpEffect(level: number): void {
    const levelUpText = document.createElement("div");
    levelUpText.textContent = `レベルアップ！ Lv.${level}`;
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

    // アニメーション（上に浮かびながらフェードアウト）
    this.animateFadeOut(levelUpText, 1.5);
  }

  /**
   * フェードアウトアニメーション
   * 要素を上に浮かびながら徐々に消します
   */
  private animateFadeOut(element: HTMLElement, ySpeed: number): void {
    let opacity = 1;
    let yOffset = 0;
    const animate = () => {
      opacity -= 0.02;
      yOffset += ySpeed;
      element.style.opacity = opacity.toString();
      element.style.transform = `translate(-50%, calc(-50% - ${yOffset}px))`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(element);
      }
    };
    animate();
  }
}
