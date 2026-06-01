import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  auth            = inject(AuthService);
  settingsService = inject(SettingsService);

  mobileOpen  = signal(false);
  currentYear = new Date().getFullYear();

  toggleMenu() { this.mobileOpen.update(v => !v); }
  logout()     { this.auth.logout(); }
}
