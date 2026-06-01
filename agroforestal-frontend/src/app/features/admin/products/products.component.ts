import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category, Brand } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  loading = signal(false);

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
    this.form.reset({ is_active: true, is_featured: false, status: 'available' });
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editingId.set(p.id);
    this.form.patchValue(p as any);
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const data = this.form.value as any;
    const req = this.editingId()
      ? this.productService.updateProduct(this.editingId()!, data)
      : this.productService.createProduct(data);
    req.subscribe(() => { this.loading.set(false); this.showForm.set(false); this.loadAll(); });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productService.deleteProduct(id).subscribe(() => this.loadAll());
  }
}
