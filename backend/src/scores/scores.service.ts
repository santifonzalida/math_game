import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScoreDto, RankingQueryDto } from './scores.dto';
import { Score } from './score.entity';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score) private readonly scores: Repository<Score>,
  ) {}

  create(dto: CreateScoreDto): Promise<Score> {
    return this.scores.save(
      this.scores.create({ ...dto, name: dto.name.trim() }),
    );
  }

  /** Fastest first; ties go to fewer errors, then to whoever finished first. */
  ranking({ operation, level, limit }: RankingQueryDto): Promise<Score[]> {
    return this.scores.find({
      where: { operation, level },
      order: { timeMs: 'ASC', errors: 'ASC', createdAt: 'ASC' },
      take: limit,
    });
  }
}
