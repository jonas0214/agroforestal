import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { Quote } from '../../../core/models/service-request.model';

@Component({
  selector: 'app-my-quotes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">Mis cotizaciones</h2>
        <a routerLink="/cotizacion" class="btn-primary text-sm py-2">+ Nueva cotización</a>
      </div>
      @if (quotes().length === 0) {
        <div class="text-center py-12 text-gray-400">
          <p class="text-4xl mb-4">📋</p>
          <p>No tienes cotizaciones aún</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (quote of quotes(); track quote.id) {
            <div class="border border-gray-100 rounded-xl p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-900">Cotización #{{ quote.id }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ quote.items.length }} producto(s)</p>
                  @if (quote.notes) { <p class="text-sm text-gray-400 mt-1">{{ quote.notes }}</p> }
                </div>
                <span class="badge-status bg-blue-100 text-blue-700">{{ quote.status }}</span>
              </div>
              <p class="text-xs text-gray-400 mt-3">{{ quote.created_at | date:'d MMMM yyyy' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyQuotesComponent implements OnInit {
  quotes = signal<Quote[]>([]);

  constructor(private srService: ServiceRequestService) {}

  ngOnInit() { this.srService.getMyQuotes().subscribe(res => this.quotes.set(res.data)); }
}
