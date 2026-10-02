import { Level, Operation } from '../common/game.types';
import { buildStats } from './scores.stats';

describe('buildStats', () => {
  it('fills every operation and level, defaulting to 0', () => {
    const { total, counts } = buildStats([]);

    expect(total).toBe(0);
    expect(Object.keys(counts)).toHaveLength(4);
    for (const op of Object.values(Operation)) {
      expect(counts[op]).toEqual({ low: 0, medium: 0, high: 0 });
    }
  });

  it('parses Postgres string counts and adds up the total', () => {
    const { total, counts } = buildStats([
      { operation: Operation.Addition, level: Level.Low, count: '12' },
      { operation: Operation.Division, level: Level.High, count: '3' },
    ]);

    expect(counts.addition.low).toBe(12);
    expect(counts.division.high).toBe(3);
    expect(counts.subtraction.medium).toBe(0);
    expect(total).toBe(15);
  });
});
