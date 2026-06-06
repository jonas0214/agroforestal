# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for **Agroforestal de Colombia S.A.S** — an agricultural equipment distributor (official STIHL distributor in Cali, Colombia since 1977). Stack: Laravel 12 REST API + Angular 18 SPA.

```
agroforestal-backend/    # Laravel 12 API
agroforestal-frontend/   # Angular 18 SPA
```

## Commands

### Backend
```bash
cd agroforestal-backend
php artisan serve          # Dev server on :8000
php artisan migrate        # Run migrations
php artisan route:cache    # Cache routes (run after route changes in production)
php artisan config:cache   # Cache config (run after .env changes in production)
php artisan storage:link   # Create public/storage symlink (first-time setup)
```

### Frontend
```bash
cd agroforestal-frontend
npm start                             # Dev server on :4200
npx ng build --configuration production   # Production build (output: dist/agroforestal-frontend)
npx ng build --watch --configuration development  # Watch mode
```

**Important:** The `dist/` folder is committed to git because the production server (Hostinger shared hosting) has no Node.js. Every production deployment requires rebuilding locally and committing the dist.

## Deployment

SSH into Hostinger: `ssh -p 65002 u735482623@194.164.64.243`

```bash
cd ~/agroforestal && git pull origin main
# Copy frontend build to public_html
cp -r ~/agroforestal/agroforestal-frontend/dist/agroforestal-frontend/browser/. \
      ~/domains/agroforestaldecolombia.com/public_html/
# After backend changes:
php artisan config:cache && php artisan route:cache
```

**Domain layout on server:**
- Frontend → `~/domains/agroforestaldecolombia.com/public_html/`
- API → `~/domains/api.agroforestaldecolombia.com/public_html/` → symlink to `~/agroforestal/agroforestal-backend/public`
- Storage → `~/agroforestal/agroforestal-backend/storage/app/public/` accessible via `~/domains/agroforestaldecolombia.com/public_html/storage` symlink

## Architecture

### Backend

- **Auth:** Sanctum token auth (no cookies). Token stored in localStorage as `agro_token`. Admin role checked via `middleware('admin')` in routes.
- **Settings:** Key-value store in `settings` table. Use `Setting::get('key')` / `Setting::set('key', $value)` / `Setting::allAsMap()`. The public `/api/settings` endpoint exposes logo, hero images, site name, etc. to the frontend.
- **Media uploads:** All via `MediaController::storePublic()` which writes to `Storage::disk('public')` and returns an absolute URL. Hero images are stored as a JSON array in `settings`. Product images use the `product_images` table with a `cover_image` shortcut on `products`.
- **CORS:** Configured in `config/cors.php`. Frontend domain must be in `allowed_origins`.

### Frontend

- **Environments:** `src/environments/environment.ts` (dev, `localhost:8000`) and `environment.prod.ts` (prod, `api.agroforestaldecolombia.com`). Switched via `fileReplacements` in `angular.json` — this is critical, do not remove it.
- **Settings reactive pattern:** `SettingsService` holds a `signal<SiteSettings>({})` loaded in `AppComponent.ngOnInit()`. Components use `effect()` to react to changes (e.g. `HomeComponent` reinitializes Swiper when hero images arrive from API).
- **Cart:** `CartService` persists to `localStorage` as `agro_cart`. Items include `cover_image` from the product at add-time; the cart is a quote-request list, not a payment flow.
- **Admin guard:** `adminGuard` checks `authService.isAdmin()` which reads `currentUser().role === 'admin'`.
- **Routing:** Lazy-loaded feature modules. Layout shell at `/` wraps public routes. Admin routes under `/admin`. Client account under `/mi-cuenta`.

### Brand / Design Tokens
- Orange: `#F36821` (`brand-orange` in Tailwind)
- Green: `#2E7D32` (`brand-green`)
- Background warm: `#FAF7F0`
- Serif font: Playfair Display
- Style direction: "rústico-elegante" — inspired by STIHL.com product pages

## Key Gotchas

1. **Storage URLs:** `storePublic()` returns absolute URLs using `url(Storage::disk('public')->url($path))`. The outer `url()` is a no-op when given an absolute URL — don't remove it, but also don't add another layer.
2. **Hero slider:** Uses Swiper.js with `effect: 'fade'` — slides must be `<img>` tags inside `.swiper-slide`, not CSS `background-image`. The `@for` loop in the template drives the DOM; Swiper reads it after Angular renders.
3. **Production caching:** `index.html` has `Cache-Control: no-cache` in `.htaccess` so browsers always fetch the latest version. JS/CSS chunks have 1-year cache (they're content-hashed).
4. **Categories/Brands admin:** Backend has `apiResource` routes for both. Frontend admin has a Categories page at `/admin/categorias`; Brands admin can be added similarly.
