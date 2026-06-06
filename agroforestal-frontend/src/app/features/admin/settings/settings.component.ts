import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private fb  = inject(FormBuilder);
  settings    = inject(SettingsService);

  logoPreview    = signal<string | null>(null);
  faviconPreview = signal<string | null>(null);
  uploading      = signal<Record<string, boolean>>({});
  saved          = signal(false);
  dragOver       = signal(false);
  dragOverFeed   = signal(false);

  form = this.fb.group({
    site_name:    ['Agroforestal de Colombia S.A.S'],
    site_tagline: ['El supermercado del campo'],
    whatsapp:     [''],
    phone:        [''],
    address:      ['Av 3Nte. #47-78, Cali'],
    instagram:    ['agroforestalcolombia'],
  });

  ngOnInit() {
    const s = this.settings.settings();
    this.form.patchValue({
      site_name:    s['site_name']    || 'Agroforestal de Colombia S.A.S',
      site_tagline: s['site_tagline'] || 'El supermercado del campo',
      whatsapp:     s['whatsapp']     || '',
      phone:        s['phone']        || '',
      address:      s['address']      || 'Av 3Nte. #47-78, Cali',
      instagram:    s['instagram']    || 'agroforestalcolombia',
    });
    this.logoPreview.set(this.settings.logoUrl() || null);
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.previewFile(file, this.logoPreview);
    this.uploading.update(u => ({ ...u, logo: true }));
    this.settings.uploadLogo(file).subscribe({
      next: () => this.uploading.update(u => ({ ...u, logo: false })),
      error: () => this.uploading.update(u => ({ ...u, logo: false })),
    });
  }

  onFaviconSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.previewFile(file, this.faviconPreview);
    this.uploading.update(u => ({ ...u, favicon: true }));
    this.settings.uploadFavicon(file).subscribe({
      next: () => this.uploading.update(u => ({ ...u, favicon: false })),
      error: () => this.uploading.update(u => ({ ...u, favicon: false })),
    });
  }

  onHeroDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    files.forEach(f => this.uploadHero(f));
  }

  onHeroSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    files.forEach(f => this.uploadHero(f));
  }

  uploadHero(file: File) {
    this.uploading.update(u => ({ ...u, hero: true }));
    this.settings.uploadHeroImage(file).subscribe({
      next: () => this.uploading.update(u => ({ ...u, hero: false })),
      error: () => this.uploading.update(u => ({ ...u, hero: false })),
    });
  }

  removeHero(url: string) {
    this.settings.deleteHeroImage(url).subscribe();
  }

  onFeedDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOverFeed.set(false);
    const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    files.forEach(f => this.uploadFeed(f));
  }

  onFeedSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    files.forEach(f => this.uploadFeed(f));
  }

  uploadFeed(file: File) {
    this.uploading.update(u => ({ ...u, feed: true }));
    this.settings.uploadFeedImage(file).subscribe({
      next: () => this.uploading.update(u => ({ ...u, feed: false })),
      error: () => this.uploading.update(u => ({ ...u, feed: false })),
    });
  }

  removeFeed(url: string) {
    this.settings.deleteFeedImage(url).subscribe();
  }

  feedImages() { return this.settings.feedImages(); }

  saveSettings() {
    this.settings.updateSettings(this.form.value as any).subscribe(() => {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    });
  }

  private previewFile(file: File, target: ReturnType<typeof signal<string | null>>) {
    const reader = new FileReader();
    reader.onload = e => target.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  heroImages() { return this.settings.heroImages(); }
}
