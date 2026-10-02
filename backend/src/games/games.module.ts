import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from '../scores/score.entity';
import { Game } from './game.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Score])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
