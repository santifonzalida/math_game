import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Level, Operation, QUESTIONS_PER_GAME } from '../common/game.types';
import { Score } from '../scores/score.entity';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsEnum(Operation)
  operation: Operation;

  @IsEnum(Level)
  level: Level;
}

export class AnswerDto {
  /** Which question this answers (0-based). */
  @IsInt()
  @Min(0)
  @Max(QUESTIONS_PER_GAME - 1)
  index: number;

  @IsInt()
  value: number;
}

/** A question as the client sees it: no answer. */
export interface PublicQuestion {
  a: number;
  b: number;
  operation: Operation;
}

export interface CreatedGame {
  id: string;
  /** The client shows this countdown; the server clock starts when it ends. */
  countdownMs: number;
  questions: PublicQuestion[];
}

export interface AnswerResult {
  accepted: boolean;
  finished: boolean;
  /** Only once finished: official time measured by the server. */
  timeMs?: number;
  /** Only once finished: the ranking entry, or null if the time was rejected. */
  score?: Score | null;
}
