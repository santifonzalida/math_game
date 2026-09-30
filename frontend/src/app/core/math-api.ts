import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Level, NewScore, Operation, Question, Score } from './models';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  // Same host the page was loaded from, so it also works from a phone on the LAN.
  factory: () => `http://${window.location.hostname}:3000`,
});

@Injectable({ providedIn: 'root' })
export class MathApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  getQuestions(operation: Operation, level: Level): Promise<Question[]> {
    return firstValueFrom(
      this.http.get<Question[]>(`${this.baseUrl}/questions`, { params: { operation, level } }),
    );
  }

  saveScore(score: NewScore): Promise<Score> {
    return firstValueFrom(this.http.post<Score>(`${this.baseUrl}/scores`, score));
  }

  getRanking(operation: Operation, level: Level, limit = 10): Promise<Score[]> {
    return firstValueFrom(
      this.http.get<Score[]>(`${this.baseUrl}/scores`, { params: { operation, level, limit } }),
    );
  }
}
