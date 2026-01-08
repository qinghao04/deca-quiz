import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ParsedQuestion {
  question: string;
  options: string[];
  correctIndex?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResponse {
  quizId: string;
  quizCode: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  avatarColor: string;
  statuses: ('correct' | 'wrong' | 'unanswered')[];
  lastActivityAt: string;
}

export interface LeaderboardResponse {
  quizId: string;
  quizCode: string;
  questionCount: number;
  submissions: LeaderboardEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  createQuiz(payload: { title: string; questions: QuizQuestion[] }) {
    return this.http.post<{ quizId: string; quizCode: string; hostToken: string; createdAt: string }>(
      `${this.baseUrl}/quizzes`,
      payload
    );
  }

  uploadFile(file: File): Observable<ParsedQuestion[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParsedQuestion[]>(`${this.baseUrl}/quizzes/upload-file`, formData);
  }

  importFromUrl(url: string): Observable<ParsedQuestion[]> {
    return this.http.post<ParsedQuestion[]>(`${this.baseUrl}/quizzes/import-url`, { url });
  }

  joinQuiz(code: string): Observable<QuizResponse> {
    return this.http.post<QuizResponse>(`${this.baseUrl}/quizzes/${code}/join`, {});
  }

  getQuiz(code: string): Observable<QuizResponse> {
    return this.http.get<QuizResponse>(`${this.baseUrl}/quizzes/${code}`);
  }

  submitScore(code: string, nickname: string, score: number, answers: number[], avatarColor: string) {
    return this.http.post<{ submissionId: string; createdAt: string }>(
      `${this.baseUrl}/quizzes/${code}/submissions`,
      { nickname, score, answers, avatarColor }
    );
  }

  updateProgress(code: string, nickname: string, answers: number[], avatarColor: string) {
    return this.http.post<{ nickname: string; score: number; updatedAt: string }>(
      `${this.baseUrl}/quizzes/${code}/progress`,
      { nickname, answers, avatarColor }
    );
  }

  getLeaderboard(code: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.baseUrl}/quizzes/${code}/leaderboard`);
  }
}
