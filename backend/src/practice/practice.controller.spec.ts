import { Level, Operation } from '../common/game.types';
import { PracticeController } from './practice.controller';

describe('PracticeController', () => {
  const controller = new PracticeController();

  it('returns 10 questions of the requested kind without answers', () => {
    const questions = controller.questions({
      operation: Operation.Division,
      level: Level.High,
    });

    expect(questions).toHaveLength(10);
    for (const q of questions) {
      expect(Object.keys(q).sort()).toEqual(['a', 'b', 'operation']);
      expect(q.operation).toBe(Operation.Division);
      expect(q.a % q.b).toBe(0);
    }
  });
});
