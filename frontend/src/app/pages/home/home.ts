import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameSession } from '../../core/game-session';
import { openKeyboardEarly, releaseKeyboardProxy } from '../../core/keyboard-proxy';
import { loadLastConfig, saveLastConfig } from '../../core/last-config';
import {
  GameConfig,
  GameMode,
  LEVELS,
  LEVEL_HINTS,
  Level,
  OPERATIONS,
  Operation,
} from '../../core/models';

const MODES: { value: GameMode; label: string; hint: string }[] = [
  { value: 'ranked', label: 'Competir', hint: 'Tu tiempo entra al ranking.' },
  {
    value: 'practice',
    label: 'Práctica libre',
    hint: 'No se guarda en el ranking y podés ver la respuesta si te equivocás.',
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly session = inject(GameSession);
  private readonly router = inject(Router);

  protected readonly modes = MODES;
  protected readonly operations = OPERATIONS;
  protected readonly levels = LEVELS;
  protected readonly hints = LEVEL_HINTS;

  private readonly last = loadLastConfig();
  protected readonly mode = signal<GameMode>(this.last.mode ?? 'ranked');
  protected readonly modeHint = computed(() => MODES.find((m) => m.value === this.mode())!.hint);
  protected readonly name = signal(this.last.name ?? '');
  protected readonly operation = signal<Operation>(this.last.operation ?? 'addition');
  protected readonly level = signal<Level>(this.last.level ?? 'low');

  protected readonly loading = computed(() => this.session.status() === 'loading');
  protected readonly error = signal(false);
  // The name is only needed for the ranking.
  protected readonly nameRequired = computed(() => this.mode() === 'ranked');
  protected readonly canStart = computed(
    () => (!this.nameRequired() || this.name().trim().length > 0) && !this.loading(),
  );

  protected async start(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canStart()) {
      return;
    }
    const config: GameConfig = {
      mode: this.mode(),
      name: this.name().trim(),
      operation: this.operation(),
      level: this.level(),
    };
    saveLastConfig(config);
    this.error.set(false);
    openKeyboardEarly();
    try {
      await this.session.start(config);
      await this.router.navigate(['/play']);
    } catch {
      releaseKeyboardProxy();
      this.error.set(true);
    }
  }
}
