import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { MathApi } from './math-api';
import { GameConfig, QUESTIONS_PER_GAME, Question, Score } from './models';

export type GameStatus = 'idle' | 'loading' | 'countdown' | 'playing' | 'finished';
export type AnswerResult = 'correct' | 'wrong' | 'finished';

export interface GameResult {
  config: GameConfig;
  timeMs: number;
  errors: number;
}

const TICK_MS = 50;
export const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 1000;

/** Holds the state of the current game. Wrong answers keep the same question. */
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
  private readonly _saveError = signal(false);

  readonly status = this._status.asReadonly();
  readonly config = this._config.asReadonly();
  readonly errors = this._errors.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  /** Seconds left before the game starts (3, 2, 1) while status is 'countdown'. */
  readonly countdown = this._countdown.asReadonly();
  readonly result = this._result.asReadonly();
  readonly savedScore = this._savedScore.asReadonly();
  readonly saveError = this._saveError.asReadonly();

  readonly correctCount = this.index.asReadonly();
  readonly currentQuestion = computed(() => this.questions()[this.index()] ?? null);

  private startedAt = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private countdownTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  /** Loads the questions and starts the countdown; the clock starts when it reaches zero. */
  async start(config: GameConfig): Promise<void> {
    this.stopTimer();
    this._status.set('loading');
    this._config.set(config);
    this._result.set(null);
    this._savedScore.set(null);
    this._saveError.set(false);

    try {
      const questions = await this.api.getQuestions(config.operation, config.level);
      this.questions.set(questions.slice(0, QUESTIONS_PER_GAME));
    } catch (err) {
      this._status.set('idle');
      throw err;
    }

    this.index.set(0);
    this._errors.set(0);
    this._elapsedMs.set(0);
    this._countdown.set(COUNTDOWN_FROM);
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
    if (value !== question.answer) {
      this._errors.update((e) => e + 1);
      return 'wrong';
    }

    this.index.update((i) => i + 1);
    if (this.index() < QUESTIONS_PER_GAME) {
      return 'correct';
    }

    this.finish();
    return 'finished';
  }

  /** Saves the finished game to the ranking. Safe to call again after a failure. */
  async saveScore(): Promise<void> {
    const result = this._result();
    if (!result || this._savedScore()) {
      return;
    }
    this._saveError.set(false);
    try {
      const score = await this.api.saveScore({
        ...result.config,
        timeMs: result.timeMs,
        errors: result.errors,
      });
      this._savedScore.set(score);
    } catch {
      this._saveError.set(true);
    }
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
    this._result.set({ config: this._config()!, timeMs, errors: this._errors() });
    this._status.set('finished');
    void this.saveScore();
  }

  private stopTimer(): void {
    clearInterval(this.timer);
    clearInterval(this.countdownTimer);
    this.timer = undefined;
    this.countdownTimer = undefined;
  }
}
