import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { Level, Operation, QUESTIONS_PER_GAME } from '../common/game.types';
import { PublicQuestion } from '../games/games.dto';
import { generateQuestions } from '../questions/question-generator';

export class PracticeQuery {
  @IsEnum(Operation)
  operation: Operation;

  @IsEnum(Level)
  level: Level;
}

/**
 * Free practice: questions only. Nothing is stored and nothing is ranked, so the
 * client keeps its own time; the answers are left out like in ranked games.
 */
@Controller('practice')
export class PracticeController {
  @Get('questions')
  questions(@Query() { operation, level }: PracticeQuery): PublicQuestion[] {
    return generateQuestions(operation, level, QUESTIONS_PER_GAME).map(
      ({ a, b, operation }) => ({ a, b, operation }),
    );
  }
}
