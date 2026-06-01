import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  activeImg = signal<string | null>(null);
  loading = signal(true);

  constructor(private productService: ProductService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.productService.getProduct(id).subscribe(p => {
      this.product.set(p);
      this.activeImg.set(p.cover_image || null);
      this.loading.set(false);
    });
  }
}
