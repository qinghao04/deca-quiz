import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ApiService, QuizResponse } from '../../services/api.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
})
export class SessionComponent implements OnInit, OnDestroy {
  code = '';
  nickname = '';
  quiz: QuizResponse | null = null;
  currentIndex = 0;
  selectedIndex: number | null = null;
  answers: number[] = [];
  answered: boolean[] = [];
  remainingSeconds = 0;
  expired = false;
  finished = false;
  score = 0;
  currentScore = 0;
  answerFeedback = '';
  answerIsCorrect = false;
  isLoading = true;
  error = '';
  avatarColor = '';

  private expiresAt = 0;
  private timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code') || '').toUpperCase();
    this.nickname = this.session.getParticipantNickname() || '';

    if (!this.nickname) {
      this.error = 'Nickname missing. Return to Join to enter your name.';
      return;
    }
    this.avatarColor = this.session.getParticipantAvatarColor() || '';

    this.api.getQuiz(this.code).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.answers = Array.from({ length: quiz.questions.length }, () => -1);
        this.answered = Array.from({ length: quiz.questions.length }, () => false);
        this.expiresAt = new Date(quiz.createdAt).getTime() + 10 * 60 * 1000;
        this.isLoading = false;
        this.startTimer();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Unable to load quiz.';
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  get currentQuestion() {
    return this.quiz?.questions?.[this.currentIndex];
  }

  get countdownLabel(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  selectOption(index: number) {
    if (this.expired || this.finished) return;
    if (this.answered[this.currentIndex]) return;
    this.selectedIndex = index;
  }

  submitAnswer() {
    if (!this.quiz || this.selectedIndex === null) return;
    if (this.answered[this.currentIndex]) return;

    this.answers[this.currentIndex] = this.selectedIndex;
    this.answered[this.currentIndex] = true;
    this.updateFeedback();
    this.currentScore = this.calculateScore();
    this.api.updateProgress(this.code, this.nickname, this.answers, this.avatarColor).subscribe({
      error: () => {},
    });

    if (this.currentIndex >= this.quiz.questions.length - 1) {
      this.finish();
    }
  }

  next() {
    if (!this.quiz) return;
    if (!this.answered[this.currentIndex]) return;

    if (this.currentIndex >= this.quiz.questions.length - 1) {
      return;
    }

    this.currentIndex += 1;
    const nextSelected = this.answers[this.currentIndex];
    this.selectedIndex = Number.isInteger(nextSelected) && nextSelected >= 0 ? nextSelected : null;
    this.updateFeedback();
  }

  private finish() {
    if (!this.quiz) return;
    this.finished = true;

    this.score = this.calculateScore();
    this.currentScore = this.score;

    if (!this.expired) {
      this.api.submitScore(this.code, this.nickname, this.score, this.answers, this.avatarColor).subscribe();
    }
  }

  private calculateScore(): number {
    if (!this.quiz) return 0;
    return this.quiz.questions.reduce((total, question, index) => {
      return total + (this.answers[index] === question.correctIndex ? 1 : 0);
    }, 0);
  }

  private updateFeedback() {
    if (!this.quiz || this.selectedIndex === null) {
      this.answerFeedback = '';
      return;
    }
    const correctIndex = this.quiz.questions[this.currentIndex]?.correctIndex;
    this.answerIsCorrect = this.selectedIndex === correctIndex;
    this.answerFeedback = this.answerIsCorrect ? 'Correct answer.' : 'Incorrect answer.';
  }

  private startTimer() {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000));
      this.remainingSeconds = remaining;
      this.expired = remaining <= 0;
      if (this.expired && !this.finished) {
        this.finish();
      }
    };

    tick();
    this.timerSub = interval(1000).subscribe(tick);
  }
}
