import { Component, computed, inject, input, numberAttribute, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatTime } from '../../core/format-time';
import { MathApi } from '../../core/math-api';
import { LEVELS, OPERATIONS, isLevel, isOperation } from '../../core/models';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink],
  templateUrl: './ranking.html',
})
export class Ranking {
  private readonly api = inject(MathApi);

  // Bound from query params (?operation=&level=&highlight=).
  readonly operationParam = input<string | undefined>(undefined, { alias: 'operation' });
  readonly levelParam = input<string | undefined>(undefined, { alias: 'level' });
  readonly highlight = input(undefined, { transform: numberAttribute });

  protected readonly operations = OPERATIONS;
  protected readonly levels = LEVELS;
  protected readonly formatTime = formatTime;
  private readonly numberFormat = new Intl.NumberFormat('es-AR');
  protected readonly formatCount = (n: number) => this.numberFormat.format(n);

  protected readonly operation = computed(() => {
    const value = this.operationParam();
    return isOperation(value) ? value : 'addition';
  });
  protected readonly level = computed(() => {
    const value = this.levelParam();
    return isLevel(value) ? value : 'low';
  });

  protected readonly ranking = resource({
    params: () => ({ operation: this.operation(), level: this.level() }),
    loader: ({ params }) => this.api.getRanking(params.operation, params.level),
  });

  protected readonly stats = resource({ loader: () => this.api.getStats() });
}
