import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { MathApi } from './math-api';
import { loadPracticeBest, savePracticeBest } from './practice-best';
import { GameConfig, QUESTIONS_PER_GAME, Question, Score, answerOf } from './models';

export type GameStatus = 'idle' | 'loading' | 'countdown' | 'playing' | 'finished';
export type AnswerResult = 'correct' | 'wrong' | 'finished';

export interface GameResult {
  config: GameConfig;
  /** Measured in the browser; replaced by the server's official time once it arrives. */
  timeMs: number;
  /** Shown to the player only; the ranking is decided by time alone. */
  errors: number;
  /** Practice only: how many answers the player chose to see. */
  revealed: number;
}

/** Practice only: the player's best time for this operation and level, kept in the browser. */
export interface PracticeBest {
  /** Best time before this game, or null if it is the first one. */
  previousMs: number | null;
  isNew: boolean;
}

const TICK_MS = 50;
const COUNTDOWN_STEP_MS = 1000;
/** Same countdown the server uses for ranked games. */
const PRACTICE_COUNTDOWN_MS = 3000;

/** Correct answers of one game, sent to the server in order. */
interface AnswerSync {
  gameId: string;
  values: number[];
  confirmed: number;
  running: boolean;
}

/**
 * Holds the state of the current game. Wrong answers keep the same question.
 * Ranked: the server owns the official clock; every correct answer is sent to it in
 * the background, and the last one returns the official time and the ranking entry.
 * Practice: nothing is sent; the browser's time is the result.
 */
@Injectable({ providedIn: 'root' })
export class GameSession {
  private readonly api = inject(MathApi);

  private readonly _status = signal<GameStatus>('idle');
  private readonly _config = signal<GameConfig | null>(null);
  private readonly questions = signal<Question[]>([]);
  private readonly index = signal(0);
  private readonly _errors = signal(0);
  private readonly _elapsedMs = signal(0);
  private readonly _countdown = signal(0);
  private readonly _result = signal<GameResult | null>(null);
  private readonly _savedScore = signal<Score | null>(null);
  private readonly _rejected = signal(false);
  private readonly _saveError = signal(false);
  private readonly _practiceBest = signal<PracticeBest | null>(null);
  /** Index of the last question answered wrong, and of the question whose answer is shown. */
  private readonly wrongIndex = signal<number | null>(null);
  private readonly revealedIndex = signal<number | null>(null);
  private readonly revealCount = signal(0);

  readonly status = this._status.asReadonly();
  readonly config = this._config.asReadonly();
  readonly errors = this._errors.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  /** Seconds left before the game starts (3, 2, 1) while status is 'countdown'. */
  readonly countdown = this._countdown.asReadonly();
  readonly result = this._result.asReadonly();
  /** The ranking entry saved by the server, with the official time. */
  readonly savedScore = this._savedScore.asReadonly();
  /** The server finished the game but did not rank it (impossibly fast). */
  readonly rejected = this._rejected.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly practiceBest = this._practiceBest.asReadonly();
  readonly isPractice = computed(() => this._config()?.mode === 'practice');

  readonly correctCount = this.index.asReadonly();
  readonly currentQuestion = computed(() => this.questions()[this.index()] ?? null);
  /** Practice: after a wrong answer, the player may ask to see the right one. */
  readonly canReveal = computed(
    () =>
      this.isPractice() &&
      this._status() === 'playing' &&
      this.wrongIndex() === this.index() &&
      this.revealedIndex() !== this.index(),
  );
  /** The current question's answer, once the player asked to see it. */
  readonly revealedAnswer = computed(() => {
    const question = this.currentQuestion();
    return question && this.revealedIndex() === this.index() ? answerOf(question) : null;
  });

  private startedAt = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private countdownTimer: ReturnType<typeof setInterval> | undefined;
  private sync: AnswerSync | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  /** Gets the questions (ranked: creates the game on the server) and starts the countdown. */
  async start(config: GameConfig): Promise<void> {
    this.stopTimer();
    this.sync = null;
    this._status.set('loading');
    this._config.set(config);
    this._result.set(null);
    this._savedScore.set(null);
    this._rejected.set(false);
    this._saveError.set(false);
    this._practiceBest.set(null);
    this.wrongIndex.set(null);
    this.revealedIndex.set(null);
    this.revealCount.set(0);

    let countdownMs: number;
    try {
      if (config.mode === 'practice') {
        this.questions.set(await this.api.getPracticeQuestions(config.operation, config.level));
        countdownMs = PRACTICE_COUNTDOWN_MS;
      } else {
        const game = await this.api.createGame(config);
        this.questions.set(game.questions);
        this.sync = { gameId: game.id, values: [], confirmed: 0, running: false };
        countdownMs = game.countdownMs;
      }
    } catch (err) {
      this._status.set('idle');
      throw err;
    }

    this.index.set(0);
    this._errors.set(0);
    this._elapsedMs.set(0);
    this._countdown.set(Math.round(countdownMs / COUNTDOWN_STEP_MS));
    this._status.set('countdown');
    this.countdownTimer = setInterval(() => {
      this._countdown.update((n) => n - 1);
      if (this._countdown() === 0) {
        this.stopTimer();
        this.startClock();
      }
    }, COUNTDOWN_STEP_MS);
  }

  answer(value: number): AnswerResult {
    const question = this.currentQuestion();
    if (this._status() !== 'playing' || !question) {
      return 'wrong';
    }
    if (value !== answerOf(question)) {
      this._errors.update((e) => e + 1);
      this.wrongIndex.set(this.index());
      return 'wrong';
    }

    if (this.sync) {
      this.sync.values.push(value);
      void this.flush();
    }
    this.index.update((i) => i + 1);
    if (this.index() < QUESTIONS_PER_GAME) {
      return 'correct';
    }

    this.finish();
    return 'finished';
  }

  /** Practice: shows the current question's answer (only after answering it wrong). */
  reveal(): void {
    if (!this.canReveal()) {
      return;
    }
    this.revealedIndex.set(this.index());
    this.revealCount.update((n) => n + 1);
  }

  /** Sends the answers the server has not confirmed yet. Safe to call again after a failure. */
  async retrySave(): Promise<void> {
    await this.flush();
  }

  /** Sends pending answers one at a time, in order, so the server sees them as played. */
  private async flush(): Promise<void> {
    const sync = this.sync;
    if (!sync || sync.running) {
      return;
    }
    sync.running = true;
    this._saveError.set(false);
    try {
      while (sync.confirmed < sync.values.length) {
        const index = sync.confirmed;
        const res = await this.api.sendAnswer(sync.gameId, index, sync.values[index]);
        if (sync !== this.sync) {
          return; // A new game started meanwhile.
        }
        if (!res.accepted) {
          throw new Error(`Server rejected answer ${index}`);
        }
        sync.confirmed++;
        if (res.finished) {
          this.applyOfficialResult(res.timeMs!, res.score ?? null);
        }
      }
    } catch {
      if (sync === this.sync) {
        this._saveError.set(true);
      }
    } finally {
      sync.running = false;
    }
  }

  private applyOfficialResult(timeMs: number, score: Score | null): void {
    this._result.update((r) => (r ? { ...r, timeMs } : r));
    this._elapsedMs.set(timeMs);
    this._savedScore.set(score);
    this._rejected.set(score === null);
  }

  private startClock(): void {
    this.startedAt = performance.now();
    this.timer = setInterval(
      () => this._elapsedMs.set(performance.now() - this.startedAt),
      TICK_MS,
    );
    this._status.set('playing');
  }

  private finish(): void {
    const timeMs = Math.round(performance.now() - this.startedAt);
    this.stopTimer();
    this._elapsedMs.set(timeMs);
    const config = this._config()!;
    // Ranked: provisional, the last answer's response brings the official time.
    this._result.set({ config, timeMs, errors: this._errors(), revealed: this.revealCount() });
    if (config.mode === 'practice') {
      this.recordPracticeBest(config, timeMs);
    }
    this._status.set('finished');
  }

  private recordPracticeBest({ operation, level }: GameConfig, timeMs: number): void {
    const previousMs = loadPracticeBest(operation, level);
    const isNew = previousMs === null || timeMs < previousMs;
    if (isNew) {
      savePracticeBest(operation, level, timeMs);
    }
    this._practiceBest.set({ previousMs, isNew });
  }

  private stopTimer(): void {
    clearInterval(this.timer);
    clearInterval(this.countdownTimer);
    this.timer = undefined;
    this.countdownTimer = undefined;
  }
}
