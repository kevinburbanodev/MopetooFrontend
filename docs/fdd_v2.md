# Mopetoo Frontend — Feature-Driven Design (FDD) v2

## Alcance

La web Nuxt.js v2 se limita a: Landing + Blog SEO + Perfil Publico Mascota (QR) + Panel Admin.
Todo lo demas migra a Flutter.

---

## Features

### F-001: Landing Page
**Proposito:** Presentar Mopetoo y redirigir a descargar la app movil.

**Slice:** `app/features/home/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `HeroSection.vue` | Hero con badges App Store/Google Play |
| Component | `FeatureShowcase.vue` | Showcase de features de la app movil |
| Component | `BlogHighlights.vue` | Ultimos articulos del blog |
| Component | `DownloadCTA.vue` | Call-to-action de descarga |

**Pagina:** `app/pages/index.vue` — Wrapper thin, renderiza componentes de home

---

### F-002: Blog SEO (Publico)
**Proposito:** Adquisicion organica via contenido educativo. SSR/SSG para SEO.

**Slice:** `app/features/blog/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `BlogList.vue` | Lista de articulos con filtro por categoria |
| Component | `BlogCard.vue` | Tarjeta de preview de articulo |
| Component | `BlogArticle.vue` | Renderizado de articulo (markdown via `marked`) |
| Component | `BlogCategoryFilter.vue` | Filtro de categorias |
| Composable | `useBlog.ts` | Fetch blog posts, useAsyncData para SSR |
| Store | `blog.store.ts` | posts[], selectedPost, isLoading |
| Types | `index.ts` | BlogPost, BlogCategory |

**Paginas:**
- `app/pages/blog/index.vue` — SSR listing
- `app/pages/blog/[slug].vue` — SSR articulo con useSeoMeta + structured data

**SEO:** `useSeoMeta()` + `useHead()` con OG tags. Schema.org Article markup.

---

### F-003: Perfil Publico de Mascota (QR)
**Proposito:** Pagina publica accesible sin cuenta para QR scanning de mascotas perdidas.

**Slice:** `app/features/petprofile/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `PetPublicProfile.vue` | Info mascota, galeria fotos, contacto dueño |
| Composable | `usePetPublicProfile.ts` | Fetch `GET /pets/public/:slug` |
| Types | `index.ts` | PublicPetProfile, PetOwnerContact |

**Pagina:** `app/pages/pets/public/[slug].vue` — Thin wrapper, SSR obligatorio

**SEO:** `useSeoMeta()` con OG tags (nombre mascota, foto, ubicacion).
**Caching:** ISR con TTL 1h en `nuxt.config.ts` para performance de QR scanning.

---

### F-004: Auth (Solo Admin)
**Proposito:** Login exclusivo para administradores. Sin registro web.

**Slice:** `app/features/auth/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `LoginForm.vue` | Formulario login admin |
| Composable | `useAuth.ts` | login(), logout(), checkAdmin() |
| Store | `auth.store.ts` | currentUser, token, isAuthenticated, isAdmin |
| Types | `index.ts` | User, LoginRequest, AuthResponse |

**Pagina:** `app/pages/auth/login.vue`
**Middleware:** `app/middleware/auth.ts` — Solo protege rutas /admin/*

---

### F-005: Panel Administrativo
**Proposito:** Gestion completa de todas las entidades, metricas y sistema.

**Slice:** `app/features/admin/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `AdminDashboard.vue` | KPIs y overview |
| Component | `AdminUserManager.vue` | CRUD usuarios (activate/deactivate/grant-pro/revoke-pro/admin) |
| Component | `AdminShelterManager.vue` | Refugios + estado verificacion |
| Component | `AdminStoreManager.vue` | Tiendas + toggle verified independiente |
| Component | `AdminClinicManager.vue` | Clinicas + toggle verified independiente |
| Component | `AdminTransactionLog.vue` | Log transacciones IAP |
| Component | `AdminVerificationManager.vue` | **NUEVO** Gestionar verificaciones shelter/store/clinic |
| Component | `AdminDonationManager.vue` | **NUEVO** Log donaciones Wompi + detalles payout |
| Component | `AdminEventMonitor.vue` | **NUEVO** Monitor eventos refugios |
| Composable | `useAdmin.ts` | Metodos CRUD + nuevos: fetchVerificationRequests, approveVerification, rejectVerification, fetchDonationDetails, fetchEventStats, verifyStore, verifyClinic |
| Store | `admin.store.ts` | users[], shelters[], petshops[], clinics[], transactions[], donations[], verificationRequests[], events[] |
| Types | `index.ts` | AdminUser, AdminShelter, AdminStore, AdminClinic, AdminTransaction, AdminDonation, AdminVerificationRequest, AdminDonationDetail, AdminShelterEvent |

**Paginas:**
- `app/pages/admin/index.vue` — Dashboard
- `app/pages/admin/users/index.vue` — Usuarios
- `app/pages/admin/shelters/index.vue` — Refugios
- `app/pages/admin/stores/index.vue` — Tiendas
- `app/pages/admin/clinics/index.vue` — Clinicas
- `app/pages/admin/transactions/index.vue` — Transacciones
- `app/pages/admin/blog/index.vue` — Blog editor
- `app/pages/admin/verifications/index.vue` — **NUEVO** Verificaciones
- `app/pages/admin/donations/index.vue` — **NUEVO** Donaciones
- `app/pages/admin/events/index.vue` — **NUEVO** Eventos

---

### F-006: Estadisticas (Admin)
**Proposito:** Metricas y KPIs del sistema.

**Slice:** `app/features/stats/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `StatsOverview.vue` | KPIs globales |
| Component | `StatsChart.vue` | Graficos de metricas |
| Component | `RevenueReport.vue` | Reporte de ingresos |
| Composable | `useStats.ts` | Fetch stats endpoints |
| Store | `stats.store.ts` | overview, revenueData, revenueStats |
| Types | `index.ts` | StatsOverview, RevenueStats |

---

### F-007: Modo Mantenimiento
**Proposito:** Pantalla de mantenimiento + toggle admin.

**Slice:** `app/features/maintenance/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `MaintenancePage.vue` | Pagina de mantenimiento |
| Component | `MaintenanceToggle.vue` | Toggle activar/desactivar (admin) |
| Composable | `useMaintenance.ts` | fetchStatus, activate, deactivate |
| Store | `maintenance.store.ts` | status, isEnabled |
| Types | `index.ts` | MaintenanceStatus |

**Middleware:** `app/middleware/maintenance.ts`

---

### F-008: Shared Kernel
**Proposito:** Utilidades compartidas entre features.

**Slice:** `app/features/shared/`

| Capa | Archivo | Descripcion |
|------|---------|-------------|
| Component | `AppNavbar.vue` | Navbar simplificada (Landing, Blog, Admin) |
| Component | `SearchableSelect.vue` | Dropdown con busqueda |
| Composable | `useApi.ts` | HTTP client con JWT |
| Composable | `useLocations.ts` | Countries/cities (usado en admin) |
| Types | `api.types.ts` | Tipos de API compartidos |

---

## Stores Activos v2

| Store | Scope | Limpieza |
|-------|-------|----------|
| `useAuthStore` | Admin auth | Remover clearSession de stores eliminados |
| `useBlogStore` | Blog publico | Sin cambios |
| `useAdminStore` | Panel admin | Expandir con verifications, donations, events |
| `useStatsStore` | Stats admin | Sin cambios |
| `useMaintenanceStore` | Mantenimiento | Sin cambios |

**Stores eliminados:** usePetsStore, useRemindersStore, useMedicalStore, useSheltersStore, useProStore, usePetshopsStore, useClinicsStore

---

## Paginas v2 (Mapa completo)

```
app/pages/
  index.vue                        → Landing (F-001)
  maintenance.vue                  → Mantenimiento (F-007)
  auth/
    login.vue                      → Login admin (F-004)
  blog/
    index.vue                      → Blog listing SSR (F-002)
    [slug].vue                     → Blog articulo SSR (F-002)
  pets/
    public/
      [slug].vue                   → Perfil publico mascota SSR (F-003)
  admin/
    index.vue                      → Dashboard (F-005)
    users/index.vue                → Usuarios (F-005)
    shelters/index.vue             → Refugios (F-005)
    stores/index.vue               → Tiendas (F-005)
    clinics/index.vue              → Clinicas (F-005)
    transactions/index.vue         → Transacciones (F-005)
    blog/index.vue                 → Blog editor (F-005)
    verifications/index.vue        → Verificaciones (F-005)
    donations/index.vue            → Donaciones (F-005)
    events/index.vue               → Eventos (F-005)
```

---

## Tipos Nuevos

### AdminVerificationRequest
```ts
interface AdminVerificationRequest {
  id: number
  shelter_id: number
  shelter_name: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_by_admin_id: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}
```

### AdminDonationDetail
```ts
interface AdminDonationDetail {
  id: number
  donor_entity_type: 'user' | 'store' | 'clinic'
  donor_entity_id: number
  donor_name: string
  shelter_id: number
  shelter_name: string
  amount: number
  wompi_fee: number
  total_charged: number
  platform_fee: number
  shelter_amount: number
  currency: string
  payment_method: 'nequi' | 'daviplata' | 'pse' | 'card'
  wompi_transaction_id: string | null
  wompi_payout_id: string | null
  payout_status: 'pending' | 'dispatched' | 'completed' | 'failed'
  status: 'pending' | 'approved' | 'declined' | 'error'
  message: string | null
  created_at: string
  updated_at: string
}
```

### AdminShelterEvent
```ts
interface AdminShelterEvent {
  id: number
  shelter_id: number
  shelter_name: string
  title: string
  description: string
  event_date: string
  location: string | null
  status: 'upcoming' | 'active' | 'finished'
  media_purged: boolean
  media_count: number
  created_at: string
  updated_at: string
}
```

### PublicPetProfile
```ts
interface PublicPetProfile {
  name: string
  species: string
  breed: string | null
  birth_date: string | null
  gender: string | null
  photo_url: string
  photos: { photo_url: string; sort_order: number }[]
  public_contact_message: string | null
  owner: {
    name: string
    phone: string
  }
}
```
