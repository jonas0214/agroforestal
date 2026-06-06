import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SiteSettings {
  logo_url?: string;
  favicon_url?: string;
  hero_images?: string;
  feed_images?: string;
  site_name?: string;
  site_tagline?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  instagram?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = environment.apiUrl;

  settings = signal<SiteSettings>({});

  constructor(private http: HttpClient) {}

  load() {
    return this.http.get<SiteSettings>(`${this.api}/settings`).pipe(
      tap(s => this.settings.set(s))
    );
  }

  heroImages(): string[] {
    const raw = this.settings().hero_images;
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  feedImages(): string[] {
    const raw = this.settings().feed_images;
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  logoUrl(): string {
    return this.settings().logo_url || '';
  }

  updateSettings(data: Partial<SiteSettings>) {
    return this.http.patch<SiteSettings>(`${this.api}/admin/settings`, data).pipe(
      tap(s => this.settings.set(s))
    );
  }

  uploadLogo(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/admin/media/logo`, fd).pipe(
      tap(r => this.settings.update(s => ({ ...s, logo_url: r.url })))
    );
  }

  uploadFavicon(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/admin/media/favicon`, fd);
  }

  uploadHeroImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; images: string[] }>(`${this.api}/admin/media/hero`, fd).pipe(
      tap(r => this.settings.update(s => ({ ...s, hero_images: JSON.stringify(r.images) })))
    );
  }

  deleteHeroImage(url: string) {
    return this.http.delete<{ images: string[] }>(`${this.api}/admin/media/hero`, { body: { url } }).pipe(
      tap(r => this.settings.update(s => ({ ...s, hero_images: JSON.stringify(r.images) })))
    );
  }

  uploadFeedImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; images: string[] }>(`${this.api}/admin/media/feed`, fd).pipe(
      tap(r => this.settings.update(s => ({ ...s, feed_images: JSON.stringify(r.images) })))
    );
  }

  deleteFeedImage(url: string) {
    return this.http.delete<{ images: string[] }>(`${this.api}/admin/media/feed`, { body: { url } }).pipe(
      tap(r => this.settings.update(s => ({ ...s, feed_images: JSON.stringify(r.images) })))
    );
  }

  uploadProductImage(file: File, productId: number, order = 0) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product_id', productId.toString());
    fd.append('order', order.toString());
    return this.http.post(`${this.api}/admin/media/product-image`, fd);
  }
}
