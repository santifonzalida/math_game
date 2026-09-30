import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { COUNTDOWN_FROM, GameSession } from './game-session';
import { MathApi } from './math-api';
import { GameConfig, Question, Score } from './models';

const config: GameConfig = { name: 'Ana', operation: 'addition', level: 'low' };
const questions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  a: i,
  b: 1,
  operation: 'addition',
  answer: i + 1,
}));

describe('GameSession', () => {
  let session: GameSession;
  let api: { getQuestions: ReturnType<typeof vi.fn>; saveScore: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      getQuestions: vi.fn().mockResolvedValue(questions),
      saveScore: vi.fn().mockImplementation(async (s) => ({ ...s, id: 1, createdAt: '' }) as Score),
    };
    TestBed.configureTestingModule({ providers: [{ provide: MathApi, useValue: api }] });
    session = TestBed.inject(GameSession);
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  async function startAndSkipCountdown() {
    await session.start(config);
    vi.advanceTimersByTime(COUNTDOWN_FROM * 1000);
  }

  it('starts a game with the questions from the API', async () => {
    await startAndSkipCountdown();

    expect(api.getQuestions).toHaveBeenCalledWith('addition', 'low');
    expect(session.status()).toBe('playing');
    expect(session.currentQuestion()).toEqual(questions[0]);
  });

  it('counts down 3, 2, 1 before playing and ignores answers meanwhile', async () => {
    await session.start(config);
    expect(session.status()).toBe('countdown');
    expect(session.countdown()).toBe(3);

    expect(session.answer(questions[0].answer)).toBe('wrong');
    expect(session.errors()).toBe(0);
    expect(session.correctCount()).toBe(0);

    vi.advanceTimersByTime(1000);
    expect(session.countdown()).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(session.countdown()).toBe(1);
    expect(session.elapsedMs()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(session.status()).toBe('playing');
  });

  it('keeps the same question and counts an error on a wrong answer', async () => {
    await startAndSkipCountdown();

    expect(session.answer(99)).toBe('wrong');
    expect(session.errors()).toBe(1);
    expect(session.currentQuestion()).toEqual(questions[0]);
  });

  it('finishes after 10 correct answers and saves the score', async () => {
    await startAndSkipCountdown();
    session.answer(-5);

    const results = questions.map((q) => session.answer(q.answer));

    expect(results.at(-1)).toBe('finished');
    expect(results.slice(0, -1).every((r) => r === 'correct')).toBe(true);
    expect(session.status()).toBe('finished');
    expect(session.result()).toMatchObject({ config, errors: 1 });
    expect(api.saveScore).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana', operation: 'addition', level: 'low', errors: 1 }),
    );
    await vi.waitFor(() => expect(session.savedScore()?.id).toBe(1));
  });

  it('lets the player retry saving after a failure', async () => {
    api.saveScore.mockRejectedValueOnce(new Error('offline'));
    await startAndSkipCountdown();
    questions.forEach((q) => session.answer(q.answer));
    await vi.waitFor(() => expect(session.saveError()).toBe(true));

    await session.saveScore();

    expect(session.saveError()).toBe(false);
    expect(session.savedScore()?.id).toBe(1);
  });

  it('goes back to idle when questions cannot be loaded', async () => {
    api.getQuestions.mockRejectedValueOnce(new Error('offline'));

    await expect(session.start(config)).rejects.toThrow('offline');
    expect(session.status()).toBe('idle');
  });
});
