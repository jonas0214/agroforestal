import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-request.component.html',
})
export class ServiceRequestComponent {
  private fb        = inject(FormBuilder);
  private srService = inject(ServiceRequestService);
  auth              = inject(AuthService);

  success = signal(false);
  loading = signal(false);
  error   = signal('');

  form = this.fb.group({
    name:                ['', [Validators.required, Validators.minLength(2)]],
    email:               ['', [Validators.required, Validators.email]],
    phone:               [''],
    equipment_brand:     [''],
    equipment_model:     [''],
    problem_description: ['', [Validators.required, Validators.minLength(20)]],
    service_type:        ['repair'],
  });

  serviceTypes = [
    { value: 'maintenance', label: 'Mantenimiento preventivo' },
    { value: 'repair',      label: 'Reparación' },
    { value: 'diagnosis',   label: 'Diagnóstico' },
    { value: 'other',       label: 'Otro' },
  ];

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({ name: user.name, email: user.email, phone: user.phone || '' });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.srService.submitRequest(this.form.value as any).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: () => { this.error.set('Error al enviar la solicitud. Intenta nuevamente.'); this.loading.set(false); },
    });
  }
}
