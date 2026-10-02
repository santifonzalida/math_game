import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateScoreDto, RankingQueryDto } from './scores.dto';
import { Score } from './score.entity';
import { ScoresService } from './scores.service';
import { ScoreStats } from './scores.stats';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  create(@Body() dto: CreateScoreDto): Promise<Score> {
    return this.scoresService.create(dto);
  }

  @Get()
  ranking(@Query() query: RankingQueryDto): Promise<Score[]> {
    return this.scoresService.ranking(query);
  }

  @Get('stats')
  stats(): Promise<ScoreStats> {
    return this.scoresService.stats();
  }
}
