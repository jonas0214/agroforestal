import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { ServiceRequest } from '../../../core/models/service-request.model';

@Component({
  selector: 'app-admin-service-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Solicitudes de servicio</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Cliente</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Tipo</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Equipo</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Estado</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            @for (req of requests(); track req.id) {
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" (click)="select(req)">
                <td class="px-6 py-4">
                  <p class="font-medium text-gray-900">{{ req.name }}</p>
                  <p class="text-xs text-gray-400">{{ req.email }}</p>
                </td>
                <td class="px-6 py-4 text-gray-600 capitalize">{{ req.service_type }}</td>
                <td class="px-6 py-4 text-gray-600">{{ req.equipment_brand }} {{ req.equipment_model }}</td>
                <td class="px-6 py-4">
                  <span [class]="statusClass(req.status)" class="badge-status">{{ req.status }}</span>
                </td>
                <td class="px-6 py-4 text-gray-400">{{ req.created_at | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
            @if (requests().length === 0) {
              <tr><td colspan="5" class="px-6 py-12 text-center text-gray-400">Sin solicitudes</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (selected()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-lg p-8">
            <h2 class="text-xl font-bold mb-4">Solicitud de {{ selected()!.name }}</h2>
            <p class="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-lg">{{ selected()!.problem_description }}</p>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Cambiar estado</label>
              <select [(ngModel)]="newStatus" class="input">
                <option value="pending">Pendiente</option>
                <option value="in_review">En revisión</option>
                <option value="in_progress">En proceso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
              <textarea [(ngModel)]="adminNotes" rows="3" class="input resize-none" placeholder="Notas del técnico..."></textarea>
            </div>
            <div class="flex gap-3">
              <button (click)="updateStatus()" class="btn-primary flex-1 justify-center">Guardar</button>
              <button (click)="selected.set(null)" class="btn-outline flex-1 text-center">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ServiceRequestsComponent implements OnInit {
  requests = signal<ServiceRequest[]>([]);
  selected = signal<ServiceRequest | null>(null);
  newStatus = '';
  adminNotes = '';

  constructor(private srService: ServiceRequestService) {}

  ngOnInit() { this.load(); }

  load() { this.srService.getAllRequests().subscribe(res => this.requests.set(res.data)); }

  select(req: ServiceRequest) {
    this.selected.set(req);
    this.newStatus = req.status;
    this.adminNotes = req.admin_notes || '';
  }

  updateStatus() {
    this.srService.updateStatus(this.selected()!.id, this.newStatus, this.adminNotes).subscribe(() => {
      this.selected.set(null);
      this.load();
    });
  }

  statusClass(status: string) {
    const map: Record<string, string> = {
      pending:     'bg-yellow-100 text-yellow-700',
      in_review:   'bg-blue-100 text-blue-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed:   'bg-green-100 text-green-700',
      cancelled:   'bg-red-100 text-red-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
}
