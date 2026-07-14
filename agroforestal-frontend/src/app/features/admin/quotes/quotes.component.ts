import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { Quote } from '../../../core/models/service-request.model';

const STATUS_LABELS: Record<string, string> = {
  pending:  'Pendiente',
  reviewed: 'Revisada',
  sent:     'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

const STATUS_CLASSES: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  sent:     'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Cotizaciones</h1>

      <!-- Modal detalle -->
      @if (selected(); as quote) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="selected.set(null)">
          <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between mb-1">
              <h2 class="text-xl font-bold">Cotización #{{ quote.id }}</h2>
              <span class="badge-status" [class]="statusClass(quote.status)">{{ statusLabel(quote.status) }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-5">{{ quote.created_at | date:'dd/MM/yyyy HH:mm' }}</p>

            <div class="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-1">
              <p><span class="text-gray-400">Cliente:</span> <span class="font-medium text-gray-900">{{ quote.name }}</span></p>
              <p><span class="text-gray-400">Email:</span> <a href="mailto:{{ quote.email }}" class="text-brand-orange hover:underline">{{ quote.email }}</a></p>
              @if (quote.phone) {
                <p><span class="text-gray-400">Teléfono:</span>
                  <a [href]="'https://wa.me/57' + quote.phone.replace(' ', '')" target="_blank" class="text-brand-green font-medium hover:underline">{{ quote.phone }} (WhatsApp)</a>
                </p>
              }
            </div>

            <h3 class="text-sm font-semibold text-gray-700 mb-3">Productos solicitados</h3>
            <div class="space-y-3 mb-5">
              @for (item of quote.items; track $index) {
                <div class="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                  @if (item.product?.cover_image) {
                    <img [src]="item.product.cover_image" alt="" class="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0">
                  } @else {
                    <div class="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 text-sm">{{ item.product_name || item.product?.name || ('Producto #' + item.product_id) }}</p>
                    @if (item.product?.sku) { <p class="text-xs text-gray-400">Ref. {{ item.product.sku }}</p> }
                    @if (item.product?.sale_price || item.product?.price) {
                      <p class="text-xs font-semibold text-brand-green">{{ (item.product.sale_price || item.product.price) | currency:'COP':'symbol-narrow':'1.0-0' }} c/u</p>
                    }
                  </div>
                  <span class="text-sm font-bold text-gray-700 shrink-0">× {{ item.quantity }}</span>
                </div>
              }
            </div>

            @if (quote.notes) {
              <h3 class="text-sm font-semibold text-gray-700 mb-1">Notas del cliente</h3>
              <p class="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 italic">"{{ quote.notes }}"</p>
            }

            <div class="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
              <label class="text-sm text-gray-500">Estado:</label>
              <select [ngModel]="quote.status" (ngModelChange)="changeStatus(quote, $event)" class="input w-auto text-sm">
                <option value="pending">Pendiente</option>
                <option value="reviewed">Revisada</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
              </select>
              <button (click)="selected.set(null)" class="btn-outline ml-auto">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left pl-6 pr-2 py-3 text-gray-500 font-semibold w-12">#</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Cliente</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Productos</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Estado</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold hidden md:table-cell">Fecha</th>
              <th class="text-right px-6 py-3 text-gray-500 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (quote of quotes(); track quote.id; let i = $index) {
              <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" (click)="selected.set(quote)">
                <td class="pl-6 pr-2 py-4 text-gray-400 tabular-nums">{{ i + 1 }}</td>
                <td class="px-6 py-4">
                  <p class="font-medium text-gray-900">{{ quote.name }}</p>
                  <p class="text-xs text-gray-400">{{ quote.email }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1.5">
                    @for (item of quote.items.slice(0, 4); track $index) {
                      @if (item.product?.cover_image) {
                        <img [src]="item.product.cover_image" alt="" class="w-9 h-9 object-cover rounded-md border border-gray-100">
                      } @else {
                        <div class="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center text-[9px] text-gray-400 font-semibold px-0.5 text-center overflow-hidden" [title]="item.product_name">
                          {{ (item.product_name || '?').slice(0, 6) }}
                        </div>
                      }
                    }
                    @if (quote.items.length > 4) {
                      <span class="text-xs text-gray-400">+{{ quote.items.length - 4 }}</span>
                    }
                  </div>
                  <p class="text-xs text-gray-400 mt-1">{{ quote.items.length }} producto(s)</p>
                </td>
                <td class="px-6 py-4" (click)="$event.stopPropagation()">
                  <select [ngModel]="quote.status" (ngModelChange)="changeStatus(quote, $event)"
                          class="text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer"
                          [class]="statusClass(quote.status)">
                    <option value="pending">Pendiente</option>
                    <option value="reviewed">Revisada</option>
                    <option value="sent">Enviada</option>
                    <option value="accepted">Aceptada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </td>
                <td class="px-6 py-4 text-gray-400 hidden md:table-cell">{{ quote.created_at | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap" (click)="$event.stopPropagation()">
                  <button (click)="selected.set(quote)" class="text-brand-orange hover:underline text-xs font-semibold">Ver detalle</button>
                  <button (click)="delete(quote.id)" class="text-red-500 hover:underline text-xs font-semibold">Eliminar</button>
                </td>
              </tr>
            }
            @if (quotes().length === 0) {
              <tr><td colspan="6" class="px-6 py-12 text-center text-gray-400">Sin cotizaciones</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class QuotesComponent implements OnInit {
  quotes   = signal<Quote[]>([]);
  selected = signal<Quote | null>(null);

  constructor(private srService: ServiceRequestService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() { this.srService.getMyQuotes().subscribe(res => this.quotes.set(res.data)); }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string) { return STATUS_CLASSES[s] ?? 'bg-gray-100 text-gray-600'; }

  changeStatus(quote: Quote, status: string) {
    this.srService.updateQuoteStatus(quote.id, status).subscribe(() => {
      this.quotes.update(list => list.map(q => q.id === quote.id ? { ...q, status: status as Quote['status'] } : q));
      const sel = this.selected();
      if (sel?.id === quote.id) { this.selected.set({ ...sel, status: status as Quote['status'] }); }
    });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar esta cotización?')) return;
    this.srService.deleteQuote(id).subscribe(() => {
      this.selected.set(null);
      this.loadAll();
    });
  }
}
