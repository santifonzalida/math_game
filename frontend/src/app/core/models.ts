// Mirrors backend/src/common/game.types.ts and the /games and /scores payloads.
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Level = 'low' | 'medium' | 'high';

export const QUESTIONS_PER_GAME = 10;

/** A question as the server sends it: without the answer (see answerOf). */
export interface Question {
  a: number;
  b: number;
  operation: Operation;
}

/** The expected answer, so a correct one can advance instantly without a round trip. */
export function answerOf({ a, b, operation }: Question): number {
  switch (operation) {
    case 'addition':
      return a + b;
    case 'subtraction':
      return a - b;
    case 'multiplication':
      return a * b;
    case 'division':
      return a / b;
  }
}

/** POST /games */
export interface CreatedGame {
  id: string;
  countdownMs: number;
  questions: Question[];
}

/** POST /games/:id/answers */
export interface AnswerResponse {
  accepted: boolean;
  finished: boolean;
  /** Once finished: official time, measured by the server. */
  timeMs?: number;
  /** Once finished: the ranking entry, or null if the server rejected the time. */
  score?: Score | null;
}

export interface Score {
  id: number;
  name: string;
  operation: Operation;
  level: Level;
  timeMs: number;
  createdAt: string;
}

/** GET /scores/stats: finished games, in total and per operation and level. */
export interface ScoreStats {
  total: number;
  counts: Record<Operation, Record<Level, number>>;
}

export interface GameConfig {
  name: string;
  operation: Operation;
  level: Level;
}

export const OPERATIONS: { value: Operation; label: string; shortLabel: string; symbol: string }[] =
  [
    { value: 'addition', label: 'Suma', shortLabel: 'Suma', symbol: '+' },
    { value: 'subtraction', label: 'Resta', shortLabel: 'Resta', symbol: '−' },
    { value: 'multiplication', label: 'Multiplicación', shortLabel: 'Multipl.', symbol: '×' },
    { value: 'division', label: 'División', shortLabel: 'División', symbol: '÷' },
  ];

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'low', label: 'Bajo' },
  { value: 'medium', label: 'Medio' },
  { value: 'high', label: 'Alto' },
];

/** Short description of what each level asks, shown on the home screen. */
export const LEVEL_HINTS: Record<Operation, Record<Level, string>> = {
  addition: { low: '0 a 9', medium: '0 a 99', high: '0 a 999' },
  subtraction: { low: '0 a 9', medium: '0 a 99', high: '0 a 999' },
  multiplication: { low: 'Tablas 0–9', medium: '47 × 6', high: '47 × 36' },
  division: { low: '56 ÷ 7', medium: '423 ÷ 9', high: '1692 ÷ 36' },
};

export function operationOf(value: Operation) {
  return OPERATIONS.find((o) => o.value === value)!;
}

export function levelOf(value: Level) {
  return LEVELS.find((l) => l.value === value)!;
}

export function isOperation(value: unknown): value is Operation {
  return OPERATIONS.some((o) => o.value === value);
}

export function isLevel(value: unknown): value is Level {
  return LEVELS.some((l) => l.value === value);
}
