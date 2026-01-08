import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.css'],
})
export class JoinComponent implements OnInit {
  isJoining = false;
  joinError = '';
  private avatarPalette = ['#22d3ee', '#f97316', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    nickname: ['', [Validators.required, Validators.maxLength(20)]],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private session: SessionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.form.patchValue({ code: code.toUpperCase() });
    }
  }

  submit() {
    this.joinError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code = String(this.form.value.code || '').toUpperCase();
    const nickname = String(this.form.value.nickname || '').trim();

    this.isJoining = true;
    this.api.joinQuiz(code).subscribe({
      next: () => {
        this.session.setParticipantNickname(nickname);
        const color = this.pickAvatarColor(nickname);
        this.session.setParticipantAvatarColor(color);
        this.isJoining = false;
        this.router.navigate(['/session', code]);
      },
      error: (error) => {
        this.joinError = error?.error?.message || 'Unable to join the quiz.';
        this.isJoining = false;
      },
    });
  }

  private pickAvatarColor(seed: string): string {
    if (!seed) {
      return this.avatarPalette[Math.floor(Math.random() * this.avatarPalette.length)];
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % this.avatarPalette.length;
    return this.avatarPalette[index];
  }
}
