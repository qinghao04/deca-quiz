import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizCreatorComponent } from './pages/quiz-creator/quiz-creator.component';
import { JoinComponent } from './pages/join/join.component';
import { SessionComponent } from './pages/session/session.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'create', pathMatch: 'full' },
  { path: 'create', component: QuizCreatorComponent },
  { path: 'join', component: JoinComponent },
  { path: 'session/:code', component: SessionComponent },
  { path: 'leaderboard/:code', component: LeaderboardComponent },
  { path: '**', redirectTo: 'create' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}