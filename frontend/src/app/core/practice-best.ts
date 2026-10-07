import { Level, Operation } from './models';

// Personal bests live only in this browser: practice never reaches the database.
const key = (operation: Operation, level: Level) => `math-game:practice-best:${operation}:${level}`;

export function loadPracticeBest(operation: Operation, level: Level): number | null {
  try {
    const value = Number(localStorage.getItem(key(operation, level)));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function savePracticeBest(operation: Operation, level: Level, timeMs: number): void {
  try {
    localStorage.setItem(key(operation, level), String(timeMs));
  } catch {
    // Storage unavailable: the best time just isn't remembered.
  }
}
