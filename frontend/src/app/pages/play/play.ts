import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatTime } from '../../core/format-time';
import { GameSession } from '../../core/game-session';
import { QUESTIONS_PER_GAME, operationOf } from '../../core/models';

const FEEDBACK_MS = 350;

@Component({
  selector: 'app-play',
  imports: [RouterLink],
  templateUrl: './play.html',
})
export class Play {
  protected readonly session = inject(GameSession);
  private readonly router = inject(Router);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('answerInput');

  protected readonly total = QUESTIONS_PER_GAME;
  protected readonly draft = signal('');
  protected readonly feedback = signal<'correct' | 'wrong' | null>(null);
  private feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly question = this.session.currentQuestion;
  protected readonly symbol = computed(() => {
    const q = this.question();
    return q ? operationOf(q.operation).symbol : '';
  });
  // Subtraction can have negative answers, and mobile numeric keypads have no minus key.
  protected readonly allowsNegative = computed(() => this.question()?.operation === 'subtraction');
  protected readonly time = computed(() => formatTime(this.session.elapsedMs()));
  protected readonly cardClass = computed(() => {
    switch (this.feedback()) {
      case 'correct':
        return 'border-emerald-500';
      case 'wrong':
        return 'border-red-500 animate-shake';
      default:
        return 'border-slate-200 dark:border-slate-800';
    }
  });
  protected readonly progress = computed(() => (this.session.correctCount() / this.total) * 100);

  constructor() {
    afterNextRender(() => this.focusInput());
  }

  protected onInput(value: string): void {
    // Keep only digits and an optional leading minus.
    const clean = value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
    this.draft.set(clean);
    this.input().nativeElement.value = clean;
  }

  protected toggleSign(): void {
    const value = this.draft();
    this.draft.set(value.startsWith('-') ? value.slice(1) : `-${value}`);
    this.focusInput();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const value = this.draft();
    if (!/^-?\d+$/.test(value)) {
      this.focusInput();
      return;
    }

    const result = this.session.answer(Number(value));
    this.draft.set('');
    if (result === 'finished') {
      void this.router.navigate(['/result']);
      return;
    }
    this.showFeedback(result);
    this.focusInput();
  }

  private showFeedback(kind: 'correct' | 'wrong'): void {
    clearTimeout(this.feedbackTimer);
    this.feedback.set(null);
    // Next frame, so the animation restarts on consecutive wrong answers.
    requestAnimationFrame(() => this.feedback.set(kind));
    this.feedbackTimer = setTimeout(() => this.feedback.set(null), FEEDBACK_MS);
  }

  private focusInput(): void {
    this.input().nativeElement.focus();
  }
}
