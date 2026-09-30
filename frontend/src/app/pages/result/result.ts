import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatTime } from '../../core/format-time';
import { GameSession } from '../../core/game-session';
import { openKeyboardEarly, releaseKeyboardProxy } from '../../core/keyboard-proxy';
import { MathApi } from '../../core/math-api';
import { levelOf, operationOf } from '../../core/models';

/** How deep we look in the ranking to tell the player their position. */
const POSITION_LOOKUP_LIMIT = 100;

@Component({
  selector: 'app-result',
  imports: [RouterLink],
  templateUrl: './result.html',
})
export class Result {
  protected readonly session = inject(GameSession);
  private readonly api = inject(MathApi);
  private readonly router = inject(Router);

  // The route guard guarantees there is a result.
  protected readonly result = computed(() => this.session.result()!);
  protected readonly time = computed(() => formatTime(this.result().timeMs));
  protected readonly operation = computed(() => operationOf(this.result().config.operation));
  protected readonly level = computed(() => levelOf(this.result().config.level));
  protected readonly restarting = signal(false);

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

  protected retrySave(): void {
    void this.session.saveScore();
  }

  protected async playAgain(): Promise<void> {
    this.restarting.set(true);
    openKeyboardEarly();
    try {
      await this.session.start(this.result().config);
      await this.router.navigate(['/play']);
    } catch {
      releaseKeyboardProxy();
      this.restarting.set(false);
    }
  }
}
