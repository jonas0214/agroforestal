import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category, Brand, ProductImage } from '../../../core/models/product.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  uploadingImage = signal(false);
  savedProduct   = signal<Product | null>(null);
  error          = signal<string | null>(null);

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
    this.productService.getProducts({ page: 1 }).subscribe(res => this.products.set(res.data));
  }

  openCreate() {
    this.editingId.set(null);
    this.savedProduct.set(null);
    this.error.set(null);
    this.productImages.set([]);
    this.form.reset({ is_active: true, is_featured: false, status: 'available' });
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editingId.set(p.id);
    this.savedProduct.set(p);
    this.error.set(null);
    this.productImages.set(p.images || []);
    this.form.patchValue(p as any);
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
        this.savedProduct.set(product);
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
        this.uploadingImage.set(false);
      },
      error: () => this.uploadingImage.set(false),
    });
  }

  removeImage(id: number) {
    this.http.delete(`${this.api}/admin/media/product-image/${id}`).subscribe(() => {
      this.productImages.update(imgs => imgs.filter(i => i.id !== id));
    });
  }

  closeForm() {
    this.showForm.set(false);
    this.savedProduct.set(null);
    this.loadAll();
  }

  delete(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productService.deleteProduct(id).subscribe(() => this.loadAll());
  }
}
