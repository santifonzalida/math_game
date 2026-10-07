import { GameConfig, isGameMode, isLevel, isOperation } from './models';

const LAST_CONFIG_KEY = 'math-game:last-config';

/** The options the player chose last time, so the home screen starts with them. */
export function loadLastConfig(): Partial<GameConfig> {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_CONFIG_KEY) ?? '{}');
    return {
      mode: isGameMode(saved.mode) ? saved.mode : undefined,
      name: typeof saved.name === 'string' ? saved.name : undefined,
      operation: isOperation(saved.operation) ? saved.operation : undefined,
      level: isLevel(saved.level) ? saved.level : undefined,
    };
  } catch {
    return {};
  }
}

export function saveLastConfig(config: GameConfig): void {
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode, blocked): just don't remember it.
  }
}
