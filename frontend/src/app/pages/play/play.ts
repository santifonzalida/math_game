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
import { releaseKeyboardProxy } from '../../core/keyboard-proxy';
import { QUESTIONS_PER_GAME, operationOf } from '../../core/models';

const FEEDBACK_MS = 350;

function isNumber(value: string): boolean {
  return /^-?\d+$/.test(value);
}

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
  protected readonly countingDown = computed(() => this.session.status() === 'countdown');
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
    afterNextRender(() => {
      this.focusInput();
      releaseKeyboardProxy();
    });
  }

  protected onInput(value: string): void {
    // Ignore typing during the countdown, but keep the input focused so the keyboard stays open.
    if (this.countingDown()) {
      this.input().nativeElement.value = '';
      return;
    }
    // Keep only digits and an optional leading minus.
    const clean = value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
    this.draft.set(clean);
    this.input().nativeElement.value = clean;
    this.submitIfCorrect();
  }

  protected toggleSign(): void {
    const value = this.draft();
    this.draft.set(value.startsWith('-') ? value.slice(1) : `-${value}`);
    this.focusInput();
    this.submitIfCorrect();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!isNumber(this.draft())) {
      this.focusInput();
      return;
    }
    this.check();
  }

  /** A correct answer is accepted as soon as it is typed; wrong ones still need Enter. */
  private submitIfCorrect(): void {
    const value = this.draft();
    if (isNumber(value) && Number(value) === this.question()?.answer) {
      this.check();
    }
  }

  private check(): void {
    const result = this.session.answer(Number(this.draft()));
    this.draft.set('');
    // Clear the DOM directly too: if the draft was '' before this change, the binding sees no change.
    this.input().nativeElement.value = '';
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
