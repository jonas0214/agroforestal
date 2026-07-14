import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { Quote } from '../../../core/models/service-request.model';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Cotizaciones</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Cliente</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Items</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Estado</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            @for (quote of quotes(); track quote.id) {
              <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-6 py-4">
                  <p class="font-medium text-gray-900">{{ quote.name }}</p>
                  <p class="text-xs text-gray-400">{{ quote.email }}</p>
                </td>
                <td class="px-6 py-4 text-gray-600">
                  <ul class="space-y-0.5">
                    @for (item of quote.items; track $index) {
                      <li class="text-xs">
                        <span class="font-semibold text-gray-700">{{ item.quantity }}×</span>
                        {{ item.product_name || ('Producto #' + item.product_id) }}
                      </li>
                    }
                  </ul>
                  @if (quote.notes) {
                    <p class="text-xs text-gray-400 mt-1 italic">"{{ quote.notes }}"</p>
                  }
                </td>
                <td class="px-6 py-4">
                  <span class="badge-status bg-blue-100 text-blue-700">{{ quote.status }}</span>
                </td>
                <td class="px-6 py-4 text-gray-400">{{ quote.created_at | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
            @if (quotes().length === 0) {
              <tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">Sin cotizaciones</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class QuotesComponent implements OnInit {
  quotes = signal<Quote[]>([]);

  constructor(private srService: ServiceRequestService) {}

  ngOnInit() { this.srService.getMyQuotes().subscribe(res => this.quotes.set(res.data)); }
}
