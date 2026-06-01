import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      @if (stats()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p class="text-sm text-gray-500 mb-1">Productos</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ stats()!.products }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p class="text-sm text-gray-500 mb-1">Clientes</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ stats()!.users }}</p>
          </div>
          <div class="bg-brand-orange rounded-xl p-6 text-white">
            <p class="text-sm text-orange-100 mb-1">Servicios pendientes</p>
            <p class="text-4xl font-extrabold">{{ stats()!.service_requests }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p class="text-sm text-gray-500 mb-1">Cotizaciones pendientes</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ stats()!.quotes }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">Últimas solicitudes de servicio</h2>
            @if (stats()!.recent_requests.length === 0) {
              <p class="text-gray-400 text-sm">Sin solicitudes aún</p>
            }
            @for (req of stats()!.recent_requests; track req.id) {
              <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p class="font-medium text-sm">{{ req.name }}</p>
                  <p class="text-xs text-gray-400">{{ req.service_type }}</p>
                </div>
                <span class="badge-status bg-yellow-100 text-yellow-700">{{ req.status }}</span>
              </div>
            }
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">Últimas cotizaciones</h2>
            @if (stats()!.recent_quotes.length === 0) {
              <p class="text-gray-400 text-sm">Sin cotizaciones aún</p>
            }
            @for (quote of stats()!.recent_quotes; track quote.id) {
              <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p class="font-medium text-sm">{{ quote.name }}</p>
                  <p class="text-xs text-gray-400">{{ quote.email }}</p>
                </div>
                <span class="badge-status bg-blue-100 text-blue-700">{{ quote.status }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  stats = signal<any>(null);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe(s => this.stats.set(s));
  }
}
