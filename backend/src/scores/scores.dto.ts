import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Level, Operation } from '../common/game.types';

export class CreateScoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsEnum(Operation)
  operation: Operation;

  @IsEnum(Level)
  level: Level;

  @IsInt()
  @Min(1)
  timeMs: number;

  @IsInt()
  @Min(0)
  errors: number;
}

export class RankingQueryDto {
  @IsEnum(Operation)
  operation: Operation;

  @IsEnum(Level)
  level: Level;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
