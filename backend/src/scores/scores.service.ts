import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingQueryDto } from './scores.dto';
import { Score } from './score.entity';
import { CountRow, ScoreStats, buildStats } from './scores.stats';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score) private readonly scores: Repository<Score>,
  ) {}

  /** Fastest first; ties go to whoever finished first. */
  ranking({ operation, level, limit }: RankingQueryDto): Promise<Score[]> {
    return this.scores.find({
      where: { operation, level },
      order: { timeMs: 'ASC', createdAt: 'ASC' },
      take: limit,
    });
  }

  /** Number of finished games (= saved scores) per operation and level. */
  async stats(): Promise<ScoreStats> {
    const rows = await this.scores
      .createQueryBuilder('score')
      .select('score.operation', 'operation')
      .addSelect('score.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('score.operation')
      .addGroupBy('score.level')
      .getRawMany<CountRow>();
    return buildStats(rows);
  }
}
