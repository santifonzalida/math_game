import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Level, Operation } from '../common/game.types';

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
