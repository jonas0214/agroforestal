import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { ServiceRequest } from '../../../core/models/service-request.model';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">Mis solicitudes de servicio</h2>
        <a routerLink="/servicio-tecnico" class="btn-primary text-sm py-2">+ Nueva solicitud</a>
      </div>
      @if (requests().length === 0) {
        <div class="text-center py-12 text-gray-400">
          <p class="text-4xl mb-4">🔧</p>
          <p>No tienes solicitudes aún</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (req of requests(); track req.id) {
            <div class="border border-gray-100 rounded-xl p-5 hover:border-brand-orange transition-colors">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-gray-900 capitalize">{{ req.service_type }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ req.equipment_brand }} {{ req.equipment_model }}</p>
                  <p class="text-sm text-gray-400 mt-1 line-clamp-2">{{ req.problem_description }}</p>
                </div>
                <span [class]="statusClass(req.status)" class="badge-status ml-4 shrink-0">{{ req.status }}</span>
              </div>
              <p class="text-xs text-gray-400 mt-3">{{ req.created_at | date:'d MMMM yyyy' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyRequestsComponent implements OnInit {
  requests = signal<ServiceRequest[]>([]);

  constructor(private srService: ServiceRequestService) {}

  ngOnInit() { this.srService.getMyRequests().subscribe(res => this.requests.set(res.data)); }

  statusClass(s: string) {
    const m: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600', in_progress: 'bg-orange-100 text-orange-700' };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
