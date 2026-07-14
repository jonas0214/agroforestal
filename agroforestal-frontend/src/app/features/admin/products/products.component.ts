import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category, Brand, ProductImage } from '../../../core/models/product.model';
import { environment } from '../../../../environments/environment';
import QRCodeStyling from 'qr-code-styling';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private http           = inject(HttpClient);
  private fb             = inject(FormBuilder);
  private api            = environment.apiUrl;

  products       = signal<Product[]>([]);
  categories     = signal<Category[]>([]);
  brands         = signal<Brand[]>([]);
  showForm       = signal(false);
  editingId      = signal<number | null>(null);
  loading        = signal(false);
  productImages  = signal<ProductImage[]>([]);
  coverImage     = signal<string | null>(null);
  uploadingImage = signal(false);
  savedMsg       = signal<string | null>(null);
  error          = signal<string | null>(null);
  qrDataUrl      = signal<string | null>(null);

  // Filtros de búsqueda de la tabla
  searchTerm     = signal('');
  filterCategory = signal<number | null>(null);
  filterBrand    = signal<number | null>(null);
  filterStatus   = signal<string>('');

  filteredProducts = computed(() => {
    const term   = this.searchTerm().trim().toLowerCase();
    const cat    = this.filterCategory();
    const brand  = this.filterBrand();
    const status = this.filterStatus();
    return this.products().filter(p => {
      if (term && !(p.name.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term))) return false;
      if (cat    && (p.category?.id ?? (p as any).category_id) !== cat) return false;
      if (brand  && (p.brand?.id ?? (p as any).brand_id) !== brand) return false;
      if (status === 'inactive' && p.is_active) return false;
      if (status && status !== 'inactive' && p.status !== status) return false;
      return true;
    });
  });

  clearFilters() {
    this.searchTerm.set('');
    this.filterCategory.set(null);
    this.filterBrand.set(null);
    this.filterStatus.set('');
  }

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    price:       [null as number | null],
    sale_price:  [null as number | null],
    sku:         [''],
    category_id: [null as number | null],
    brand_id:    [null as number | null],
    is_featured: [false],
    is_active:   [true],
    status:      ['available'],
  });

  ngOnInit() {
    this.loadAll();
    this.productService.getCategories().subscribe(c => this.categories.set(c));
    this.productService.getBrands().subscribe(b => this.brands.set(b));
  }

  loadAll() {
    this.productService.getProducts({ page: 1, perPage: 200, includeInactive: true })
      .subscribe(res => this.products.set(res.data));
  }

  openCreate() {
    this.editingId.set(null);
    this.qrDataUrl.set(null);
    this.savedMsg.set(null);
    this.error.set(null);
    this.productImages.set([]);
    this.coverImage.set(null);
    this.form.reset({ is_active: true, is_featured: false, status: 'available' });
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editingId.set(p.id);
    this.qrDataUrl.set(null);
    this.savedMsg.set(null);
    this.error.set(null);
    this.productImages.set(p.images || []);
    this.coverImage.set(p.cover_image ?? null);
    this.form.reset({ is_active: true, is_featured: false, status: 'available' });
    this.form.patchValue({
      name:        p.name,
      description: p.description ?? '',
      price:       p.price ?? null,
      sale_price:  p.sale_price ?? null,
      sku:         p.sku ?? '',
      category_id: p.category?.id ?? (p as any).category_id ?? null,
      brand_id:    p.brand?.id ?? (p as any).brand_id ?? null,
      is_featured: p.is_featured,
      is_active:   p.is_active,
      status:      p.status,
    });
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid) {
      this.error.set('Completa el nombre del producto (campo obligatorio).');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const data = this.form.value as any;
    const req = this.editingId()
      ? this.productService.updateProduct(this.editingId()!, data)
      : this.productService.createProduct(data);

    req.subscribe({
      next: product => {
        this.loading.set(false);
        this.editingId.set(product.id);
        // Refrescamos el SKU autogenerado y demás campos devueltos por el servidor
        this.form.patchValue({ sku: product.sku ?? '' });
        this.savedMsg.set('✓ Cambios guardados correctamente.');
        this.loadAll();
      },
      error: err => {
        this.loading.set(false);
        const msg = err?.error?.message
          || (err?.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null)
          || 'No se pudo guardar el producto. Revisa los datos e inténtalo de nuevo.';
        this.error.set(msg);
      },
    });
  }

  onImageSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    files.forEach(f => this.uploadImage(f));
    (event.target as HTMLInputElement).value = '';
  }

  private uploadImage(file: File) {
    const productId = this.editingId();
    if (!productId) return;
    this.uploadingImage.set(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product_id', productId.toString());
    fd.append('order', this.productImages().length.toString());
    this.http.post<ProductImage>(`${this.api}/admin/media/product-image`, fd).subscribe({
      next: img => {
        this.productImages.update(imgs => [...imgs, img]);
        // La primera foto se vuelve portada automáticamente en el backend
        if (!this.coverImage()) this.coverImage.set(img.path);
        this.uploadingImage.set(false);
        this.loadAll();
      },
      error: () => this.uploadingImage.set(false),
    });
  }

  removeImage(id: number) {
    this.http.delete<{ cover_image: string | null }>(`${this.api}/admin/media/product-image/${id}`).subscribe(res => {
      this.productImages.update(imgs => imgs.filter(i => i.id !== id));
      this.coverImage.set(res?.cover_image ?? null);
      this.loadAll();
    });
  }

  setCover(img: ProductImage) {
    this.http.patch<{ cover_image: string }>(`${this.api}/admin/media/product-image/${img.id}/cover`, {}).subscribe(res => {
      this.coverImage.set(res.cover_image);
      this.loadAll();
    });
  }

  moveImage(index: number, dir: -1 | 1) {
    const imgs = [...this.productImages()];
    const j = index + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[index], imgs[j]] = [imgs[j], imgs[index]];
    this.productImages.set(imgs);
    this.http.post(`${this.api}/admin/media/product-images/reorder`, { order: imgs.map(i => i.id) })
      .subscribe(() => this.loadAll());
  }

  closeForm() {
    this.showForm.set(false);
    this.savedMsg.set(null);
    this.loadAll();
  }

  delete(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productService.deleteProduct(id).subscribe(() => this.loadAll());
  }

  // ── Código QR del producto ─────────────────────────────────────

  productUrl(): string {
    return `${environment.siteUrl}/catalogo/${this.editingId()}`;
  }

  /** Ícono central del QR: motivo del logo (sol y campos) en negro, minimalista. */
  private qrCenterIcon(): string {
    const s = 240;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d')!;
    const cx = s / 2, cy = s / 2;
    const ink = '#111111';

    // Fondo blanco circular
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.fill();

    const innerR = s / 2 - 14;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.clip();

    // Sol: rayos triangulares en abanico (mitad superior)
    ctx.fillStyle = ink;
    const sunCy = cy + 14;
    const rays = 7;
    for (let i = 0; i < rays; i++) {
      const a  = Math.PI + ((i + 0.5) / rays) * Math.PI;
      const r0 = 30, r1 = 82;
      const spread = 0.11;
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(a),          sunCy + r1 * Math.sin(a));
      ctx.lineTo(cx + r0 * Math.cos(a - spread), sunCy + r0 * Math.sin(a - spread));
      ctx.lineTo(cx + r0 * Math.cos(a + spread), sunCy + r0 * Math.sin(a + spread));
      ctx.closePath();
      ctx.fill();
    }
    // Semicírculo del sol
    ctx.beginPath();
    ctx.arc(cx, sunCy, 20, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Campos: tres franjas onduladas
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineWidth = 14;
    for (let k = 0; k < 3; k++) {
      const y = sunCy + 22 + k * 26;
      ctx.beginPath();
      ctx.moveTo(cx - innerR + 8, y + 12);
      ctx.quadraticCurveTo(cx, y - 18, cx + innerR - 8, y + 4);
      ctx.stroke();
    }
    ctx.restore();

    return c.toDataURL('image/png');
  }

  async generateQr() {
    if (!this.editingId()) return;
    const qr = new QRCodeStyling({
      width:  640,
      height: 640,
      type:   'canvas',
      data:   this.productUrl(),
      margin: 16,
      qrOptions: { errorCorrectionLevel: 'H' },
      image: this.qrCenterIcon(),
      imageOptions: { imageSize: 0.32, margin: 6, hideBackgroundDots: true },
      dotsOptions:          { type: 'rounded',       color: '#111111' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#111111' },
      cornersDotOptions:    { type: 'dot',           color: '#111111' },
      backgroundOptions:    { color: '#ffffff' },
    });
    const blob = await qr.getRawData('png');
    if (!blob) return;
    const reader = new FileReader();
    reader.onload = () => this.qrDataUrl.set(reader.result as string);
    reader.readAsDataURL(blob as Blob);
  }

  printQr() {
    const qr = this.qrDataUrl();
    if (!qr) return;
    const name = this.form.value.name || '';
    const sku  = this.form.value.sku || '';
    const win = window.open('', '_blank', 'width=480,height=640');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>QR — ${name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; padding: 24px; }
  .sticker {
    width: 320px; border: 2.5px solid #111; border-radius: 24px;
    padding: 22px 20px 18px; text-align: center; background: #fff;
  }
  .brand { font-size: 17px; font-weight: 800; letter-spacing: 4px; color: #111; text-transform: uppercase; }
  .sub { font-size: 8.5px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-top: 4px; }
  .rule { width: 44px; height: 2px; background: #111; margin: 12px auto; }
  h1 { font-size: 14px; font-weight: 700; color: #111; line-height: 1.3; text-transform: uppercase; letter-spacing: .5px; }
  .sku { font-size: 10px; color: #666; letter-spacing: 1px; margin-top: 3px; }
  img { width: 224px; height: 224px; margin: 12px 0 6px; }
  .cta { font-size: 11.5px; font-weight: 700; color: #111; letter-spacing: 1.5px; text-transform: uppercase; }
  .cta small { display: block; font-size: 9px; font-weight: 400; color: #555; letter-spacing: .5px; text-transform: none; margin-top: 3px; }
  .foot { margin-top: 12px; border-top: 1px solid #ddd; padding-top: 8px; }
  .foot .url { font-size: 8px; color: #999; word-break: break-all; }
  .foot .since { font-size: 8.5px; color: #111; font-weight: 600; letter-spacing: 2px; margin-top: 3px; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <div class="sticker">
    <div class="brand">Agroforestal</div>
    <div class="sub">de Colombia S.A.S — Distribuidor oficial STIHL</div>
    <div class="rule"></div>
    <h1>${name}</h1>
    ${sku ? `<div class="sku">REF. ${sku}</div>` : ''}
    <img src="${qr}" alt="QR">
    <div class="cta">
      Escanea y cotiza
      <small>Solicita tu cotización o mantenimiento en línea</small>
    </div>
    <div class="foot">
      <div class="url">${this.productUrl()}</div>
      <div class="since">DESDE 1977 — CALI, COLOMBIA</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); };<\/script>
</body></html>`);
    win.document.close();
  }

  downloadQr() {
    const qr = this.qrDataUrl();
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `qr-${(this.form.value.sku || this.editingId())}.png`;
    a.click();
  }
}
