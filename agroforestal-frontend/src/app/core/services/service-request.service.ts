import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ServiceRequest, Quote } from '../models/service-request.model';
import { PaginatedResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  submitRequest(data: Partial<ServiceRequest>) {
    return this.http.post<ServiceRequest>(`${this.api}/service-requests`, data);
  }

  getMyRequests() {
    return this.http.get<PaginatedResponse<ServiceRequest>>(`${this.api}/service-requests`);
  }

  getAllRequests() {
    return this.http.get<PaginatedResponse<ServiceRequest>>(`${this.api}/service-requests`);
  }

  updateStatus(id: number, status: string, notes?: string) {
    return this.http.patch<ServiceRequest>(`${this.api}/admin/service-requests/${id}`, { status, admin_notes: notes });
  }

  submitQuote(data: Partial<Quote>) {
    return this.http.post<Quote>(`${this.api}/quotes`, data);
  }

  getMyQuotes() {
    return this.http.get<PaginatedResponse<Quote>>(`${this.api}/quotes`);
  }
}
