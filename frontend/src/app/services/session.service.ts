import { Injectable } from '@angular/core';

const HOST_KEY = 'decaquiz.host';
const PARTICIPANT_KEY = 'decaquiz.participant';
const PARTICIPANT_AVATAR_KEY = 'decaquiz.participant.avatar';

export type HostSession = {
  quizId: string;
  hostToken: string;
};

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  setHostSession(quizId: string, hostToken: string) {
    sessionStorage.setItem(HOST_KEY, JSON.stringify({ quizId, hostToken }));
  }

  getHostSession(): HostSession | null {
    const raw = sessionStorage.getItem(HOST_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as HostSession;
      if (!parsed?.quizId || !parsed?.hostToken) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clearHostSession() {
    sessionStorage.removeItem(HOST_KEY);
  }

  setParticipantNickname(nickname: string) {
    sessionStorage.setItem(PARTICIPANT_KEY, nickname);
  }

  getParticipantNickname(): string | null {
    return sessionStorage.getItem(PARTICIPANT_KEY);
  }

  setParticipantAvatarColor(color: string) {
    sessionStorage.setItem(PARTICIPANT_AVATAR_KEY, color);
  }

  getParticipantAvatarColor(): string | null {
    return sessionStorage.getItem(PARTICIPANT_AVATAR_KEY);
  }
}
