import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QuizCreatorComponent } from './pages/quiz-creator/quiz-creator.component';
import { JoinComponent } from './pages/join/join.component';
import { SessionComponent } from './pages/session/session.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

@NgModule({
  declarations: [
    AppComponent,
    QuizCreatorComponent,
    JoinComponent,
    SessionComponent,
    LeaderboardComponent,
  ],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}