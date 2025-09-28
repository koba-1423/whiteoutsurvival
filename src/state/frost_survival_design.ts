/**
 * フロストサバイバルゲームの設計と状態管理
 */

export interface GameState {
  // プレイヤー状態
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  
  // 装備
  weaponLevel: number;
  armorLevel: number;
  
  // リソース
  meatCount: number;
  processedMeats: number;
  money: number;
  wood: number;
  stone: number;
  metal: number;
  
  // ゲーム進行
  currentZone: string;
  unlockedZones: string[];
  completedQuests: string[];
  
  // 設定
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  autoSave: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
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
    stamina: 100,
    maxStamina: 100,
    
    // 装備
    weaponLevel: 1,
    armorLevel: 1,
    
    // リソース
    meatCount: 0,
    processedMeats: 0,
    money: 0,
    wood: 0,
    stone: 0,
    metal: 0,
    
    // ゲーム進行
    currentZone: 'frost_wilderness',
    unlockedZones: ['frost_wilderness'],
    completedQuests: [],
    
    // 設定
    difficulty: 'normal',
    autoSave: true,
    soundEnabled: true,
    musicEnabled: true,
  };
}

/**
 * レベルアップ時の経験値必要量を計算
 */
export function getExperienceRequired(level: number): number {
  return level * 100 + (level - 1) * 50;
}

/**
 * 次のレベルまでの経験値を計算
 */
export function getExperienceToNextLevel(currentLevel: number, currentExp: number): number {
  const required = getExperienceRequired(currentLevel + 1);
  return Math.max(0, required - currentExp);
}

/**
 * レベルアップ処理
 */
export function levelUp(state: GameState): GameState {
  const newLevel = state.level + 1;
  const newMaxHealth = state.maxHealth + 20;
  const newMaxStamina = state.maxStamina + 10;
  
  return {
    ...state,
    level: newLevel,
    maxHealth: newMaxHealth,
    maxStamina: newMaxStamina,
    health: newMaxHealth, // レベルアップ時は体力を全回復
    stamina: newMaxStamina, // スタミナも全回復
  };
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

/**
 * ゾーン情報
 */
export const ZONE_INFO = {
  frost_wilderness: {
    name: '氷雪の荒野',
    description: '極寒の荒野でサバイバルを続けよう。敵を倒して肉を集め、装備を強化していく。',
    temperature: -20,
    dangerLevel: 'high',
    enemyCount: 30,
    resources: ['meat', 'wood', 'stone'],
  },
  frozen_forest: {
    name: '凍てつく森',
    description: '氷に覆われた森。より強力な敵が潜んでいる。',
    temperature: -30,
    dangerLevel: 'very_high',
    enemyCount: 50,
    resources: ['meat', 'wood', 'metal'],
  },
  ice_caverns: {
    name: '氷の洞窟',
    description: '深い氷の洞窟。貴重な資源が眠っている。',
    temperature: -40,
    dangerLevel: 'extreme',
    enemyCount: 100,
    resources: ['stone', 'metal', 'crystal'],
  },
} as const;

/**
 * 武器情報
 */
export const WEAPON_INFO = {
  1: { name: '木の剣', damage: 10, durability: 100 },
  2: { name: '鉄の剣', damage: 20, durability: 200 },
  3: { name: '鋼の剣', damage: 35, durability: 300 },
  4: { name: '氷の剣', damage: 50, durability: 400 },
  5: { name: '伝説の剣', damage: 100, durability: 1000 },
} as const;

/**
 * 防具情報
 */
export const ARMOR_INFO = {
  1: { name: '布の服', defense: 5, durability: 100 },
  2: { name: '革の服', defense: 10, durability: 200 },
  3: { name: '鎖かたびら', defense: 20, durability: 300 },
  4: { name: 'プレートアーマー', defense: 35, durability: 400 },
  5: { name: '伝説の鎧', defense: 50, durability: 1000 },
} as const;
