import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameSession } from '../../core/game-session';
import {
  GameConfig,
  LEVELS,
  LEVEL_HINTS,
  Level,
  OPERATIONS,
  Operation,
  isLevel,
  isOperation,
} from '../../core/models';

const LAST_CONFIG_KEY = 'math-game:last-config';

function loadLastConfig(): Partial<GameConfig> {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_CONFIG_KEY) ?? '{}');
    return {
      name: typeof saved.name === 'string' ? saved.name : undefined,
      operation: isOperation(saved.operation) ? saved.operation : undefined,
      level: isLevel(saved.level) ? saved.level : undefined,
    };
  } catch {
    return {};
  }
}

function saveLastConfig(config: GameConfig): void {
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode, blocked): just don't remember it.
  }
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly session = inject(GameSession);
  private readonly router = inject(Router);

  protected readonly operations = OPERATIONS;
  protected readonly levels = LEVELS;
  protected readonly hints = LEVEL_HINTS;

  private readonly last = loadLastConfig();
  protected readonly name = signal(this.last.name ?? '');
  protected readonly operation = signal<Operation>(this.last.operation ?? 'addition');
  protected readonly level = signal<Level>(this.last.level ?? 'low');

  protected readonly loading = computed(() => this.session.status() === 'loading');
  protected readonly error = signal(false);
  protected readonly canStart = computed(() => this.name().trim().length > 0 && !this.loading());

  protected async start(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canStart()) {
      return;
    }
    const config: GameConfig = {
      name: this.name().trim(),
      operation: this.operation(),
      level: this.level(),
    };
    saveLastConfig(config);
    this.error.set(false);
    try {
      await this.session.start(config);
      await this.router.navigate(['/play']);
    } catch {
      this.error.set(true);
    }
  }
}
