export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductImage {
  id: number;
  path: string;
  alt?: string;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  details?: string;
  sku?: string;
  price?: number;
  sale_price?: number;
  cover_image?: string;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  is_featured: boolean;
  is_active: boolean;
  status: 'available' | 'out_of_stock' | 'discontinued';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
