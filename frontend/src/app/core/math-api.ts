import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AnswerResponse,
  CreatedGame,
  GameConfig,
  Level,
  Operation,
  Score,
  ScoreStats,
} from './models';

declare global {
  interface Window {
    /** Set by public/env.js, which the Docker image generates from API_URL on start. */
    __env?: { apiUrl?: string };
  }
}

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () =>
    window.__env?.apiUrl?.replace(/\/+$/, '') ||
    // Local dev: same host the page was loaded from, so it also works from a phone on the LAN.
    `http://${window.location.hostname}:3000`,
});

@Injectable({ providedIn: 'root' })
export class MathApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  createGame(config: GameConfig): Promise<CreatedGame> {
    return firstValueFrom(this.http.post<CreatedGame>(`${this.baseUrl}/games`, config));
  }

  sendAnswer(gameId: string, index: number, value: number): Promise<AnswerResponse> {
    return firstValueFrom(
      this.http.post<AnswerResponse>(`${this.baseUrl}/games/${gameId}/answers`, { index, value }),
    );
  }

  getStats(): Promise<ScoreStats> {
    return firstValueFrom(this.http.get<ScoreStats>(`${this.baseUrl}/scores/stats`));
  }

  getRanking(operation: Operation, level: Level, limit = 10): Promise<Score[]> {
    return firstValueFrom(
      this.http.get<Score[]>(`${this.baseUrl}/scores`, { params: { operation, level, limit } }),
    );
  }
}
