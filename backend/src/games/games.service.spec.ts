import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Level, Operation } from '../common/game.types';
import { Score } from '../scores/score.entity';
import { Game } from './game.entity';
import { COUNTDOWN_MS, GamesService, MIN_MS_PER_ANSWER } from './games.service';

/** Minimal in-memory stand-in for a TypeORM repository. */
function fakeRepo<T extends { id: unknown }>(newId: () => T['id']) {
  const rows = new Map<T['id'], T>();
  const matches = (row: T, where: Partial<T>) =>
    Object.entries(where).every(([k, v]) => row[k as keyof T] === v);
  return {
    rows,
    create: (data: Partial<T>) => ({ ...data }) as T,
    save: async (entity: T) => {
      const row = { ...entity, id: entity.id ?? newId() } as T;
      rows.set(row.id, row);
      return { ...row };
    },
    findOneBy: async (where: Partial<T>) => {
      const row = [...rows.values()].find((r) => matches(r, where));
      return row ? { ...row } : null;
    },
    update: async (criteria: T['id'] | Partial<T>, changes: Partial<T>) => {
      const where = (
        typeof criteria === 'object' ? criteria : { id: criteria }
      ) as Partial<T>;
      let affected = 0;
      for (const row of rows.values()) {
        if (matches(row, where)) {
          Object.assign(row, changes);
          affected++;
        }
      }
      return { affected };
    },
  };
}

const T0 = new Date('2026-10-02T12:00:00Z');
const at = (ms: number) => new Date(T0.getTime() + COUNTDOWN_MS + ms);

describe('GamesService', () => {
  let service: GamesService;
  let games: ReturnType<typeof fakeRepo<Game>>;
  let scores: ReturnType<typeof fakeRepo<Score>>;

  beforeEach(() => {
    let gameSeq = 0;
    let scoreSeq = 0;
    games = fakeRepo<Game>(() => `game-${++gameSeq}`);
    scores = fakeRepo<Score>(() => ++scoreSeq);
    service = new GamesService(games as never, scores as never);
  });

  async function newGame() {
    const created = await service.create(
      { name: ' Ana ', operation: Operation.Addition, level: Level.Low },
      T0,
    );
    const answers = games.rows.get(created.id)!.questions.map((q) => q.answer);
    return { created, answers };
  }

  /** Answers every question correctly, one every `stepMs`. */
  async function playAll(id: string, answers: number[], stepMs: number) {
    let last;
    for (const [index, value] of answers.entries()) {
      last = await service.answer(
        id,
        { index, value },
        at(stepMs * (index + 1)),
      );
    }
    return last!;
  }

  it('creates a game whose questions do not include the answers', async () => {
    const { created } = await newGame();

    expect(created.countdownMs).toBe(COUNTDOWN_MS);
    expect(created.questions).toHaveLength(10);
    for (const q of created.questions) {
      expect(Object.keys(q).sort()).toEqual(['a', 'b', 'operation']);
    }
    const stored = games.rows.get(created.id)!;
    expect(stored.name).toBe('Ana');
    expect(stored.startsAt).toEqual(at(0));
  });

  it('measures the official time on the server and saves the score', async () => {
    const { created, answers } = await newGame();

    const result = await playAll(created.id, answers, 1200);

    expect(result).toMatchObject({
      accepted: true,
      finished: true,
      timeMs: 12000,
    });
    expect(result.score).toMatchObject({ name: 'Ana', timeMs: 12000 });
    expect(scores.rows.size).toBe(1);
  });

  it('rejects a wrong answer without advancing', async () => {
    const { created, answers } = await newGame();

    const result = await service.answer(
      created.id,
      { index: 0, value: answers[0] + 1 },
      at(500),
    );

    expect(result).toEqual({ accepted: false, finished: false });
    expect(games.rows.get(created.id)!.correctCount).toBe(0);
  });

  it('does not accept answers before the countdown ends', async () => {
    const { created, answers } = await newGame();

    await expect(
      service.answer(created.id, { index: 0, value: answers[0] }, at(-1)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not let a question be skipped', async () => {
    const { created, answers } = await newGame();

    await expect(
      service.answer(created.id, { index: 1, value: answers[1] }, at(500)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not rank an impossibly fast game', async () => {
    const { created, answers } = await newGame();

    const result = await playAll(created.id, answers, MIN_MS_PER_ANSWER - 1);

    expect(result).toMatchObject({
      accepted: true,
      finished: true,
      score: null,
    });
    expect(scores.rows.size).toBe(0);
  });

  it('is safe to retry: repeated answers return the same result', async () => {
    const { created, answers } = await newGame();
    await service.answer(created.id, { index: 0, value: answers[0] }, at(1000));

    const retry = await service.answer(
      created.id,
      { index: 0, value: answers[0] },
      at(1500),
    );
    expect(retry).toEqual({ accepted: true, finished: false });

    const final = await playAll(created.id, answers, 1000);
    const finalRetry = await service.answer(
      created.id,
      { index: 9, value: answers[9] },
      at(99_000),
    );
    expect(finalRetry).toEqual(final);
    expect(scores.rows.size).toBe(1);
  });

  it('fails for an unknown game', async () => {
    await expect(
      service.answer('nope', { index: 0, value: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
