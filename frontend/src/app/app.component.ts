import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isLightMode = false;
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    const stored = localStorage.getItem('decaquiz.theme');
    this.isLightMode = stored === 'light';
    this.applyTheme();
  }

  toggleTheme() {
    this.isLightMode = !this.isLightMode;
    localStorage.setItem('decaquiz.theme', this.isLightMode ? 'light' : 'dark');
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.toggle('theme-light', this.isLightMode);
  }
}
