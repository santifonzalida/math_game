import { Level, Operation } from '../common/game.types';

export type GameCounts = Record<Operation, Record<Level, number>>;

export interface ScoreStats {
  /** Finished games across every operation and level. */
  total: number;
  /** Finished games per operation and level; categories nobody played are 0. */
  counts: GameCounts;
}

export interface CountRow {
  operation: Operation;
  level: Level;
  count: string | number;
}

/** Turns grouped COUNT(*) rows into a complete operation × level table. */
export function buildStats(rows: CountRow[]): ScoreStats {
  const counts = Object.fromEntries(
    Object.values(Operation).map((op) => [
      op,
      Object.fromEntries(Object.values(Level).map((lvl) => [lvl, 0])),
    ]),
  ) as GameCounts;

  let total = 0;
  for (const row of rows) {
    // Postgres returns COUNT(*) as a string (bigint).
    const count = Number(row.count);
    counts[row.operation][row.level] = count;
    total += count;
  }
  return { total, counts };
}
