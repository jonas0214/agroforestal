import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category, Brand, ProductImage } from '../../../core/models/product.model';
import { environment } from '../../../../environments/environment';

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
    this.savedMsg.set(null);
    this.error.set(null);
    this.productImages.set([]);
    this.coverImage.set(null);
    this.form.reset({ is_active: true, is_featured: false, status: 'available' });
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editingId.set(p.id);
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
}
