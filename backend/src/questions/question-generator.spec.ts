import { Level, Operation } from '../common/game.types';
import { generateQuestion, generateQuestions } from './question-generator';

const SAMPLES = 2000;
const MIN_RNG = () => 0;
const MAX_RNG = () => 0.999999;

function sample(operation: Operation, level: Level) {
  return generateQuestions(operation, level, SAMPLES);
}

describe('generateQuestion', () => {
  describe.each([
    [Level.Low, 9],
    [Level.Medium, 99],
    [Level.High, 999],
  ])('addition/subtraction %s', (level, max) => {
    it(`keeps operands within 0..${max}`, () => {
      for (const op of [Operation.Addition, Operation.Subtraction]) {
        expect(generateQuestion(op, level, MIN_RNG)).toMatchObject({
          a: 0,
          b: 0,
        });
        expect(generateQuestion(op, level, MAX_RNG)).toMatchObject({
          a: max,
          b: max,
        });
        for (const q of sample(op, level)) {
          expect(q.a).toBeGreaterThanOrEqual(0);
          expect(q.a).toBeLessThanOrEqual(max);
          expect(q.b).toBeGreaterThanOrEqual(0);
          expect(q.b).toBeLessThanOrEqual(max);
        }
      }
    });
  });

  it('computes addition and subtraction answers, allowing negatives', () => {
    for (const q of sample(Operation.Addition, Level.Medium)) {
      expect(q.answer).toBe(q.a + q.b);
    }
    const subtractions = sample(Operation.Subtraction, Level.Medium);
    for (const q of subtractions) {
      expect(q.answer).toBe(q.a - q.b);
    }
    expect(subtractions.some((q) => q.answer < 0)).toBe(true);
  });

  it.each([
    [Level.Low, [0, 9], [0, 9]],
    [Level.Medium, [10, 99], [2, 9]],
    [Level.High, [10, 99], [10, 99]],
  ])(
    'multiplication %s uses the expected factor ranges',
    (level, aRange, bRange) => {
      expect(
        generateQuestion(Operation.Multiplication, level, MIN_RNG),
      ).toMatchObject({
        a: aRange[0],
        b: bRange[0],
      });
      expect(
        generateQuestion(Operation.Multiplication, level, MAX_RNG),
      ).toMatchObject({
        a: aRange[1],
        b: bRange[1],
      });
      for (const q of sample(Operation.Multiplication, level)) {
        expect(q.answer).toBe(q.a * q.b);
      }
    },
  );

  it.each([Level.Low, Level.Medium, Level.High])(
    'division %s is always exact and never divides by zero',
    (level) => {
      for (const q of sample(Operation.Division, level)) {
        expect(q.b).toBeGreaterThanOrEqual(1);
        expect(q.a % q.b).toBe(0);
        expect(q.a / q.b).toBe(q.answer);
      }
    },
  );

  it('generates the requested number of questions', () => {
    expect(generateQuestions(Operation.Addition, Level.Low, 10)).toHaveLength(
      10,
    );
  });
});
