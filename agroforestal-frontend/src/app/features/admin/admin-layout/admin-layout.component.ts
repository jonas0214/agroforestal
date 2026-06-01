import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex min-h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-950 text-white flex flex-col shrink-0">

        <!-- Logo header -->
        <div class="p-5 border-b border-gray-800">
          <a routerLink="/" class="flex items-center gap-3">
            @if (settings.logoUrl()) {
              <img [src]="settings.logoUrl()" alt="Logo" class="h-9 w-auto object-contain">
            } @else {
              <div class="w-9 h-9 bg-brand-orange rounded-lg flex items-center justify-center shrink-0">
                <span class="font-black text-white">A</span>
              </div>
              <div>
                <p class="font-bold text-sm text-white leading-none">Agroforestal</p>
                <p class="text-gray-500 text-xs mt-0.5">Panel de administración</p>
              </div>
            }
          </a>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 px-3 py-5 space-y-0.5">
          <p class="text-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Principal</p>
          <a routerLink="/admin/dashboard" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">📊</span> Dashboard
          </a>
          <a routerLink="/admin/productos" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">📦</span> Productos
          </a>
          <a routerLink="/admin/blog" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">📝</span> Blog
          </a>

          <div class="pt-4 pb-1">
            <p class="text-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Solicitudes</p>
          </div>
          <a routerLink="/admin/solicitudes" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">🔧</span> Servicios técnicos
          </a>
          <a routerLink="/admin/cotizaciones" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">📋</span> Cotizaciones
          </a>

          <div class="pt-4 pb-1">
            <p class="text-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Sitio</p>
          </div>
          <a routerLink="/admin/configuracion" routerLinkActive="!bg-brand-orange !text-white"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium">
            <span class="text-base">⚙️</span> Configuración
          </a>
        </nav>

        <!-- Footer del sidebar -->
        <div class="p-4 border-t border-gray-800">
          <div class="flex items-center gap-3 px-2 mb-3">
            <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-white">{{ auth.currentUser()?.name?.charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-white truncate">{{ auth.currentUser()?.name }}</p>
              <p class="text-[10px] text-gray-500 truncate">Administrador</p>
            </div>
          </div>
          <a routerLink="/" class="flex items-center gap-2 px-2 py-1.5 text-gray-500 hover:text-white text-xs transition-colors rounded-lg hover:bg-gray-800">
            ← Ver sitio web
          </a>
          <button (click)="auth.logout()" class="flex items-center gap-2 px-2 py-1.5 text-gray-500 hover:text-red-400 text-xs transition-colors rounded-lg hover:bg-gray-800 w-full mt-0.5">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto bg-gray-50">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  auth     = inject(AuthService);
  settings = inject(SettingsService);
}
