import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private platformId      = inject(PLATFORM_ID);

  ngOnInit() {
    this.settingsService.load().subscribe();

    if (isPlatformBrowser(this.platformId)) {
      import('aos').then(AOS => {
        AOS.default.init({ duration: 700, once: true, easing: 'ease-out-cubic', offset: 60 });
      });
    }
  }
}
