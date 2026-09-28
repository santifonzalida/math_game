import { Level, Operation } from '../common/game.types';

export interface Question {
  a: number;
  b: number;
  operation: Operation;
  answer: number;
}

/** Returns a float in [0, 1). Injectable so tests can be deterministic. */
export type Rng = () => number;

type Range = [min: number, max: number];

interface OperandRanges {
  a: Range;
  b: Range;
}

const ADDITIVE_RANGES: Record<Level, OperandRanges> = {
  [Level.Low]: { a: [0, 9], b: [0, 9] },
  [Level.Medium]: { a: [0, 99], b: [0, 99] },
  [Level.High]: { a: [0, 999], b: [0, 999] },
};

// Multiplication: tables 0-9, then 2 digits × 1 digit, then 2 digits × 2 digits.
const MULTIPLICATION_RANGES: Record<Level, OperandRanges> = {
  [Level.Low]: { a: [0, 9], b: [0, 9] },
  [Level.Medium]: { a: [10, 99], b: [2, 9] },
  [Level.High]: { a: [10, 99], b: [10, 99] },
};

// Division is the inverse of multiplication: a = divisor, b = quotient.
// The divisor starts at 1 so there is never a division by zero.
const DIVISION_RANGES: Record<Level, OperandRanges> = {
  [Level.Low]: { a: [1, 9], b: [0, 9] },
  [Level.Medium]: { a: [2, 9], b: [10, 99] },
  [Level.High]: { a: [10, 99], b: [10, 99] },
};

function randomInt([min, max]: Range, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateQuestion(
  operation: Operation,
  level: Level,
  rng: Rng = Math.random,
): Question {
  switch (operation) {
    case Operation.Addition: {
      const { a, b } = ADDITIVE_RANGES[level];
      const x = randomInt(a, rng);
      const y = randomInt(b, rng);
      return { a: x, b: y, operation, answer: x + y };
    }
    case Operation.Subtraction: {
      // Negative results are allowed.
      const { a, b } = ADDITIVE_RANGES[level];
      const x = randomInt(a, rng);
      const y = randomInt(b, rng);
      return { a: x, b: y, operation, answer: x - y };
    }
    case Operation.Multiplication: {
      const { a, b } = MULTIPLICATION_RANGES[level];
      const x = randomInt(a, rng);
      const y = randomInt(b, rng);
      return { a: x, b: y, operation, answer: x * y };
    }
    case Operation.Division: {
      // Generated backwards so the result is always exact: dividend = divisor × quotient.
      const { a, b } = DIVISION_RANGES[level];
      const divisor = randomInt(a, rng);
      const quotient = randomInt(b, rng);
      return { a: divisor * quotient, b: divisor, operation, answer: quotient };
    }
  }
}

export function generateQuestions(
  operation: Operation,
  level: Level,
  count: number,
  rng: Rng = Math.random,
): Question[] {
  return Array.from({ length: count }, () =>
    generateQuestion(operation, level, rng),
  );
}
