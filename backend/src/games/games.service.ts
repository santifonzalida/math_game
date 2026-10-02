import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUESTIONS_PER_GAME } from '../common/game.types';
import { generateQuestions } from '../questions/question-generator';
import { Score } from '../scores/score.entity';
import { Game } from './game.entity';
import {
  AnswerDto,
  AnswerResult,
  CreateGameDto,
  CreatedGame,
} from './games.dto';

export const COUNTDOWN_MS = 3000;
/**
 * Below this average per answer the time is not humanly possible (read, compute, type),
 * so the game is not ranked. The best real games are around 1 s per answer.
 */
export const MIN_MS_PER_ANSWER = 500;

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game) private readonly games: Repository<Game>,
    @InjectRepository(Score) private readonly scores: Repository<Score>,
  ) {}

  async create(
    { name, operation, level }: CreateGameDto,
    now = new Date(),
  ): Promise<CreatedGame> {
    const questions = generateQuestions(operation, level, QUESTIONS_PER_GAME);
    const game = await this.games.save(
      this.games.create({
        name: name.trim(),
        operation,
        level,
        questions,
        correctCount: 0,
        startsAt: new Date(now.getTime() + COUNTDOWN_MS),
      }),
    );
    return {
      id: game.id,
      countdownMs: COUNTDOWN_MS,
      questions: questions.map(({ a, b, operation }) => ({ a, b, operation })),
    };
  }

  /**
   * Records a correct answer. Safe to retry: an answer that was already accepted
   * returns the same result again instead of failing.
   */
  async answer(
    id: string,
    { index, value }: AnswerDto,
    now = new Date(),
  ): Promise<AnswerResult> {
    const game = await this.findOrFail(id);
    if (value !== game.questions[index].answer) {
      return { accepted: false, finished: false };
    }
    if (index < game.correctCount) {
      return this.alreadyAccepted(game, index);
    }
    if (index > game.correctCount) {
      throw new ConflictException('Answer the previous questions first');
    }
    if (now < game.startsAt) {
      throw new BadRequestException('The game has not started yet');
    }

    // Conditional update: if two requests race for the same answer, only one advances.
    const { affected } = await this.games.update(
      { id, correctCount: index },
      { correctCount: index + 1 },
    );
    if (!affected) {
      return this.alreadyAccepted(await this.findOrFail(id), index);
    }
    if (index + 1 < QUESTIONS_PER_GAME) {
      return { accepted: true, finished: false };
    }
    return this.finish(game, now);
  }

  private async finish(game: Game, now: Date): Promise<AnswerResult> {
    const timeMs = now.getTime() - game.startsAt.getTime();
    const plausible = timeMs >= MIN_MS_PER_ANSWER * QUESTIONS_PER_GAME;
    const score = plausible
      ? await this.scores.save(
          this.scores.create({
            name: game.name,
            operation: game.operation,
            level: game.level,
            timeMs,
          }),
        )
      : null;
    await this.games.update(game.id, {
      finishedAt: now,
      timeMs,
      scoreId: score?.id ?? null,
    });
    return { accepted: true, finished: true, timeMs, score };
  }

  private async alreadyAccepted(
    game: Game,
    index: number,
  ): Promise<AnswerResult> {
    const isLast = index === QUESTIONS_PER_GAME - 1;
    if (!isLast || !game.finishedAt) {
      return { accepted: true, finished: false };
    }
    const score = game.scoreId
      ? await this.scores.findOneBy({ id: game.scoreId })
      : null;
    return { accepted: true, finished: true, timeMs: game.timeMs!, score };
  }

  private async findOrFail(id: string): Promise<Game> {
    const game = await this.games.findOneBy({ id });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }
}
