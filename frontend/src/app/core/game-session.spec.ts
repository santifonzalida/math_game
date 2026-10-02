import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GameSession } from './game-session';
import { MathApi } from './math-api';
import { AnswerResponse, GameConfig, Question, Score } from './models';

const config: GameConfig = { name: 'Ana', operation: 'addition', level: 'low' };
const questions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  a: i,
  b: 1,
  operation: 'addition',
}));
const answers = questions.map((q) => q.a + q.b);
const officialScore: Score = {
  id: 7,
  name: 'Ana',
  operation: 'addition',
  level: 'low',
  timeMs: 12345,
  createdAt: '',
};

describe('GameSession', () => {
  let session: GameSession;
  let api: { createGame: ReturnType<typeof vi.fn>; sendAnswer: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      createGame: vi.fn().mockResolvedValue({ id: 'g1', countdownMs: 3000, questions }),
      sendAnswer: vi
        .fn()
        .mockImplementation(async (_id: string, index: number): Promise<AnswerResponse> =>
          index === 9
            ? { accepted: true, finished: true, timeMs: 12345, score: officialScore }
            : { accepted: true, finished: false },
        ),
    };
    TestBed.configureTestingModule({ providers: [{ provide: MathApi, useValue: api }] });
    session = TestBed.inject(GameSession);
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  async function startAndSkipCountdown() {
    await session.start(config);
    vi.advanceTimersByTime(3000);
  }

  it('creates the game on the server and plays its questions', async () => {
    await startAndSkipCountdown();

    expect(api.createGame).toHaveBeenCalledWith(config);
    expect(session.status()).toBe('playing');
    expect(session.currentQuestion()).toEqual(questions[0]);
  });

  it('counts down from the server countdown and ignores answers meanwhile', async () => {
    await session.start(config);
    expect(session.status()).toBe('countdown');
    expect(session.countdown()).toBe(3);

    expect(session.answer(answers[0])).toBe('wrong');
    expect(session.errors()).toBe(0);
    expect(session.correctCount()).toBe(0);

    vi.advanceTimersByTime(2000);
    expect(session.countdown()).toBe(1);
    expect(session.elapsedMs()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(session.status()).toBe('playing');
  });

  it('keeps the same question, counts an error and sends nothing on a wrong answer', async () => {
    await startAndSkipCountdown();

    expect(session.answer(99)).toBe('wrong');
    expect(session.errors()).toBe(1);
    expect(session.currentQuestion()).toEqual(questions[0]);
    expect(api.sendAnswer).not.toHaveBeenCalled();
  });

  it('sends every correct answer in order and takes the official time from the server', async () => {
    await startAndSkipCountdown();
    session.answer(-5);

    const results = answers.map((a) => session.answer(a));

    expect(results.at(-1)).toBe('finished');
    expect(session.status()).toBe('finished');
    await vi.waitFor(() => expect(session.savedScore()).toEqual(officialScore));
    expect(api.sendAnswer.mock.calls.map(([id, i, v]) => [id, i, v])).toEqual(
      answers.map((v, i) => ['g1', i, v]),
    );
    expect(session.result()).toMatchObject({ config, errors: 1, timeMs: 12345 });
    expect(session.rejected()).toBe(false);
  });

  it('flags a game the server did not rank', async () => {
    api.sendAnswer.mockImplementation(async (_id: string, index: number) =>
      index === 9
        ? { accepted: true, finished: true, timeMs: 900, score: null }
        : { accepted: true, finished: false },
    );
    await startAndSkipCountdown();

    answers.forEach((a) => session.answer(a));

    await vi.waitFor(() => expect(session.rejected()).toBe(true));
    expect(session.savedScore()).toBeNull();
  });

  it('resends the pending answers when retrying after a failure', async () => {
    api.sendAnswer.mockRejectedValueOnce(new Error('offline'));
    await startAndSkipCountdown();
    answers.forEach((a) => session.answer(a));
    await vi.waitFor(() => expect(session.saveError()).toBe(true));

    await session.retrySave();

    expect(session.saveError()).toBe(false);
    expect(session.savedScore()).toEqual(officialScore);
  });

  it('goes back to idle when the game cannot be created', async () => {
    api.createGame.mockRejectedValueOnce(new Error('offline'));

    await expect(session.start(config)).rejects.toThrow('offline');
    expect(session.status()).toBe('idle');
  });
});
