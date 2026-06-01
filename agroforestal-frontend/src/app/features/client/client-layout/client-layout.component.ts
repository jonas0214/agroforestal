import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="flex flex-col md:flex-row gap-8">
        <aside class="md:w-56">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div class="mb-5 pb-5 border-b border-gray-100">
              <div class="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center mb-2">
                <span class="text-white font-bold text-xl">{{ auth.currentUser()?.name?.charAt(0) }}</span>
              </div>
              <p class="font-semibold text-gray-900 text-sm">{{ auth.currentUser()?.name }}</p>
              <p class="text-xs text-gray-400">{{ auth.currentUser()?.email }}</p>
            </div>
            <nav class="space-y-1">
              <a routerLink="/mi-cuenta/perfil" routerLinkActive="text-brand-orange font-semibold" class="block px-3 py-2 text-sm text-gray-600 hover:text-brand-orange rounded-lg hover:bg-orange-50 transition-colors">👤 Mi perfil</a>
              <a routerLink="/mi-cuenta/solicitudes" routerLinkActive="text-brand-orange font-semibold" class="block px-3 py-2 text-sm text-gray-600 hover:text-brand-orange rounded-lg hover:bg-orange-50 transition-colors">🔧 Mis solicitudes</a>
              <a routerLink="/mi-cuenta/cotizaciones" routerLinkActive="text-brand-orange font-semibold" class="block px-3 py-2 text-sm text-gray-600 hover:text-brand-orange rounded-lg hover:bg-orange-50 transition-colors">📋 Mis cotizaciones</a>
            </nav>
            <div class="mt-5 pt-5 border-t border-gray-100">
              <button (click)="auth.logout()" class="text-sm text-red-500 hover:underline">Cerrar sesión</button>
            </div>
          </div>
        </aside>
        <main class="flex-1"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class ClientLayoutComponent {
  constructor(public auth: AuthService) {}
}
