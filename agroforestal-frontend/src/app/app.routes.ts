import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'catalogo', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'catalogo/:id', loadComponent: () => import('./features/catalog/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'blog', loadComponent: () => import('./features/blog/blog.component').then(m => m.BlogComponent) },
      { path: 'blog/:id', loadComponent: () => import('./features/blog/post-detail/post-detail.component').then(m => m.PostDetailComponent) },
      { path: 'servicio-tecnico', loadComponent: () => import('./features/service-request/service-request.component').then(m => m.ServiceRequestComponent) },
      { path: 'cotizacion', loadComponent: () => import('./features/service-request/quote-form/quote-form.component').then(m => m.QuoteFormComponent) },
    ],
  },
  {
    path: 'auth',
    children: [
      { path: 'login',    canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'productos',  loadComponent: () => import('./features/admin/products/products.component').then(m => m.ProductsComponent) },
      { path: 'blog',       loadComponent: () => import('./features/admin/posts/posts.component').then(m => m.PostsComponent) },
      { path: 'solicitudes', loadComponent: () => import('./features/admin/service-requests/service-requests.component').then(m => m.ServiceRequestsComponent) },
      { path: 'cotizaciones', loadComponent: () => import('./features/admin/quotes/quotes.component').then(m => m.QuotesComponent) },
      { path: 'categorias',    loadComponent: () => import('./features/admin/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'marcas',        loadComponent: () => import('./features/admin/brands/brands.component').then(m => m.BrandsComponent) },
      { path: 'configuracion', loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
  {
    path: 'mi-cuenta',
    canActivate: [authGuard],
    loadComponent: () => import('./features/client/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
      { path: 'perfil',     loadComponent: () => import('./features/client/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'solicitudes', loadComponent: () => import('./features/client/my-requests/my-requests.component').then(m => m.MyRequestsComponent) },
      { path: 'cotizaciones', loadComponent: () => import('./features/client/my-quotes/my-quotes.component').then(m => m.MyQuotesComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
