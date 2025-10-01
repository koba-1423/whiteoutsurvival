/**
 * フロストサバイバルゲームの設計と状態管理
 */

export interface GameState {
  // プレイヤー状態
  level: number;
  experience: number;
  health: number;
  maxHealth: number;

  // 装備
  weaponLevel: number;
  armorLevel: number;

  // リソース
  meatCount: number;
  processedMeats: number;
  money: number;
}

/**
 * 初期状態を作成
 */
export function createInitialState(level: number = 1): GameState {
  return {
    // プレイヤー状態
    level: level,
    experience: 0,
    health: 100,
    maxHealth: 100,

    // 装備
    weaponLevel: 1,
    armorLevel: 1,

    // リソース
    meatCount: 0,
    processedMeats: 0,
    money: 0,
  };
}

/**
 * レベルアップ時の経験値必要量を計算
 */
export function getExperienceRequired(level: number): number {
  return level * 100 + (level - 1) * 50;
}

/**
 * ダメージ計算
 */
export function calculateDamage(weaponLevel: number): number {
  const baseDamage = 10 + (weaponLevel - 1) * 5;
  const levelMultiplier = 1 + (weaponLevel - 1) * 0.1;
  return Math.floor(baseDamage * levelMultiplier);
}

/**
 * 防御力計算
 */
export function calculateDefense(armorLevel: number): number {
  return armorLevel * 5;
}
