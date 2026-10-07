import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatTime } from '../../core/format-time';
import { GameSession } from '../../core/game-session';
import { openKeyboardEarly, releaseKeyboardProxy } from '../../core/keyboard-proxy';
import { saveLastConfig } from '../../core/last-config';
import { MathApi } from '../../core/math-api';
import { GameConfig, levelOf, operationOf } from '../../core/models';

/** How deep we look in the ranking to tell the player their position. */
const POSITION_LOOKUP_LIMIT = 100;

const secondsFormat = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'app-result',
  imports: [RouterLink],
  templateUrl: './result.html',
})
export class Result {
  protected readonly session = inject(GameSession);
  private readonly api = inject(MathApi);
  private readonly router = inject(Router);

  protected readonly formatTime = formatTime;

  // The route guard guarantees there is a result.
  protected readonly result = computed(() => this.session.result()!);
  protected readonly isPractice = computed(() => this.result().config.mode === 'practice');
  protected readonly time = computed(() => formatTime(this.result().timeMs));
  protected readonly operation = computed(() => operationOf(this.result().config.operation));
  protected readonly level = computed(() => levelOf(this.result().config.level));
  protected readonly restarting = signal(false);

  protected readonly title = computed(() => {
    const name = this.result().config.name;
    if (this.isPractice()) {
      const best = this.session.practiceBest();
      if (best?.isNew && best.previousMs !== null) {
        return '¡Nuevo mejor tiempo de práctica!';
      }
    } else if (this.position() === 1) {
      return `¡Nuevo récord, ${name}!`;
    }
    return name ? `¡Bien hecho, ${name}!` : '¡Bien hecho!';
  });

  // Ranked: where the saved score landed.
  private readonly ranking = resource({
    params: () => {
      const score = this.session.savedScore();
      return score ? { operation: score.operation, level: score.level } : undefined;
    },
    loader: ({ params }) =>
      this.api.getRanking(params.operation, params.level, POSITION_LOOKUP_LIMIT),
  });

  /** 1-based position in the ranking, or null if it is not known (yet). */
  protected readonly position = computed(() => {
    const id = this.session.savedScore()?.id;
    const scores = this.ranking.hasValue() ? this.ranking.value() : [];
    const index = scores.findIndex((s) => s.id === id);
    return index === -1 ? null : index + 1;
  });
  protected readonly rankingLoaded = computed(() => this.ranking.hasValue());

  // Practice: the level's record, to compare against.
  protected readonly record = resource({
    params: () => {
      const { config } = this.result();
      return this.isPractice() ? { operation: config.operation, level: config.level } : undefined;
    },
    loader: async ({ params }) =>
      (await this.api.getRanking(params.operation, params.level, 1))[0] ?? null,
  });

  /** Practice vs record: positive means slower than the record. */
  protected readonly recordGapMs = computed(() => {
    const record = this.record.hasValue() ? this.record.value() : null;
    return record ? this.result().timeMs - record.timeMs : null;
  });

  protected formatSeconds(ms: number): string {
    return `${secondsFormat.format(Math.abs(ms) / 1000)} s`;
  }

  protected retrySave(): void {
    void this.session.retrySave();
  }

  protected playAgain(): Promise<void> {
    return this.startGame(this.result().config);
  }

  /** From practice to the ranking, same operation and level. Without a name, ask for one first. */
  protected competeHere(): Promise<void> | void {
    const config: GameConfig = { ...this.result().config, mode: 'ranked' };
    if (config.name) {
      return this.startGame(config);
    }
    saveLastConfig(config);
    void this.router.navigate(['/']);
  }

  private async startGame(config: GameConfig): Promise<void> {
    this.restarting.set(true);
    openKeyboardEarly();
    try {
      await this.session.start(config);
      saveLastConfig(config);
      await this.router.navigate(['/play']);
    } catch {
      releaseKeyboardProxy();
      this.restarting.set(false);
    }
  }
}
