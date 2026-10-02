import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AnswerDto,
  AnswerResult,
  CreateGameDto,
  CreatedGame,
} from './games.dto';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // Starting games is cheap to abuse, so it gets a tighter limit than answering.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateGameDto): Promise<CreatedGame> {
    return this.gamesService.create(dto);
  }

  @Post(':id/answers')
  @HttpCode(200)
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnswerDto,
  ): Promise<AnswerResult> {
    return this.gamesService.answer(id, dto);
  }
}
