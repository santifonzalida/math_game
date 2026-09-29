// Mirrors backend/src/common/game.types.ts and the /questions and /scores payloads.
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Level = 'low' | 'medium' | 'high';

export const QUESTIONS_PER_GAME = 10;

export interface Question {
  a: number;
  b: number;
  operation: Operation;
  answer: number;
}

export interface NewScore {
  name: string;
  operation: Operation;
  level: Level;
  timeMs: number;
  errors: number;
}

export interface Score extends NewScore {
  id: number;
  createdAt: string;
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
