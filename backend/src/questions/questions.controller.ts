import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { Level, Operation, QUESTIONS_PER_GAME } from '../common/game.types';
import { Question, generateQuestions } from './question-generator';

export class QuestionsQueryDto {
  @IsEnum(Operation)
  operation: Operation;

  @IsEnum(Level)
  level: Level;
}

@Controller('questions')
export class QuestionsController {
  @Get()
  getQuestions(@Query() { operation, level }: QuestionsQueryDto): Question[] {
    return generateQuestions(operation, level, QUESTIONS_PER_GAME);
  }
}
