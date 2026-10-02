import { Controller, Get, Query } from '@nestjs/common';
import { RankingQueryDto } from './scores.dto';
import { Score } from './score.entity';
import { ScoresService } from './scores.service';
import { ScoreStats } from './scores.stats';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  ranking(@Query() query: RankingQueryDto): Promise<Score[]> {
    return this.scoresService.ranking(query);
  }

  @Get('stats')
  stats(): Promise<ScoreStats> {
    return this.scoresService.stats();
  }
}
