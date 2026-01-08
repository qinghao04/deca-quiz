import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ApiService, LeaderboardEntry } from '../../services/api.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  code = '';
  submissions: LeaderboardEntry[] = [];
  questionCount = 0;
  error = '';
  isLoading = true;

  private pollSub?: Subscription;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code') || '').toUpperCase();

    this.pollSub = interval(3000)
      .pipe(startWith(0), switchMap(() => this.api.getLeaderboard(this.code)))
      .subscribe({
        next: (data) => {
          this.submissions = data.submissions || [];
          this.questionCount = data.questionCount || 0;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Unable to load leaderboard.';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('DecaQuiz Rankings Report', 14, 18);

    autoTable(doc, {
      startY: 26,
      head: [['Rank', 'Nickname', 'Score']],
      body: this.submissions.map((entry, index) => [index + 1, entry.nickname, entry.score]),
      styles: { halign: 'left' },
      headStyles: { fillColor: [34, 211, 238] },
    });

    doc.save('Rankings_Report.pdf');
  }

  nextQuestionIndex(entry: LeaderboardEntry): number | null {
    const index = entry.statuses.findIndex((status) => status === 'unanswered');
    return index >= 0 ? index + 1 : null;
  }
}
