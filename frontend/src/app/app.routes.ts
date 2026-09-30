import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { GameSession } from './core/game-session';
import { Home } from './pages/home/home';
import { Play } from './pages/play/play';
import { Ranking } from './pages/ranking/ranking';
import { Result } from './pages/result/result';

// Play and result only make sense for the game in memory; after a reload, go back home.
const hasActiveGame: CanActivateFn = () =>
  ['countdown', 'playing'].includes(inject(GameSession).status()) ||
  inject(Router).createUrlTree(['/']);

const hasResult: CanActivateFn = () =>
  inject(GameSession).result() !== null || inject(Router).createUrlTree(['/']);

export const routes: Routes = [
  { path: '', component: Home, title: 'Math Game' },
  { path: 'play', component: Play, canActivate: [hasActiveGame], title: 'Jugando · Math Game' },
  { path: 'result', component: Result, canActivate: [hasResult], title: 'Resultado · Math Game' },
  { path: 'ranking', component: Ranking, title: 'Ranking · Math Game' },
  { path: '**', redirectTo: '' },
];
