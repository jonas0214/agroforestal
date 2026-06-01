import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  cartService            = inject(CartService);
  private route          = inject(ActivatedRoute);

  product   = signal<Product | null>(null);
  activeImg = signal<string | null>(null);
  loading   = signal(true);
  added     = signal(false);

  constructor() {}

  addToCart() {
    const p = this.product();
    if (!p) return;
    this.cartService.add(p);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.productService.getProduct(id).subscribe(p => {
      this.product.set(p);
      this.activeImg.set(p.cover_image || p.images?.[0]?.path || null);
      this.loading.set(false);
    });
  }
}
