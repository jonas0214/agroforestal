import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product, Category, Brand, PaginatedResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(filters: { category?: string; brand?: string; search?: string; featured?: boolean; page?: number; perPage?: number; includeInactive?: boolean } = {}) {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.brand)    params = params.set('brand', filters.brand);
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.featured) params = params.set('featured', '1');
    if (filters.page)     params = params.set('page', filters.page.toString());
    if (filters.perPage)  params = params.set('per_page', filters.perPage.toString());
    if (filters.includeInactive) params = params.set('include_inactive', '1');
    return this.http.get<PaginatedResponse<Product>>(`${this.api}/products`, { params });
  }

  getProduct(id: number) {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }

  getBrands() {
    return this.http.get<Brand[]>(`${this.api}/brands`);
  }

  createProduct(data: Partial<Product>) {
    return this.http.post<Product>(`${this.api}/admin/products`, data);
  }

  updateProduct(id: number, data: Partial<Product>) {
    return this.http.patch<Product>(`${this.api}/admin/products/${id}`, data);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.api}/admin/products/${id}`);
  }
}
