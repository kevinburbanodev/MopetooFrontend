# Mopetoo Frontend — Remake Plan v2

## Vision General

La web (Nuxt.js) se reduce de una aplicacion full-feature a un sitio ligero con 4 funciones:
1. **Landing page** — Publica, redirige a descargar la app
2. **Blog SEO** — Publico, SSR/SSG, adquisicion organica + AdSense
3. **Perfil publico de mascota (QR)** — Publico, SSR, para escaneo sin cuenta
4. **Panel administrativo** — Auth admin, gestion completa

Toda la funcionalidad de usuario final (tenedor, refugio, petshop, clinica) migra a Flutter.

## Que se elimina

### Feature slices completos
- `app/features/pets/` — CRUD mascotas → Flutter
- `app/features/reminders/` — Recordatorios → Flutter
- `app/features/medical/` — Historial medico → Flutter
- `app/features/pro/` — Suscripciones/donaciones → Flutter
- `app/features/clinics/` — Navegacion clinicas → Flutter
- `app/features/petshops/` — Navegacion tiendas → Flutter
- `app/features/shelters/` — Navegacion refugios → Flutter

### Paginas
- `app/pages/dashboard/` — Completo
- `app/pages/pricing/`
- `app/pages/clinics/`, `app/pages/stores/`, `app/pages/shelters/`, `app/pages/shelter/`
- `app/pages/register.vue`, `app/pages/login.vue`, `app/pages/forgot-password.vue`, `app/pages/reset-password/`

### Stores
- petsStore, remindersStore, medicalStore, sheltersStore, proStore, petshopsStore, clinicsStore

### Composables
- usePets, useReminders, useMedical, useShelters, usePro, usePetshops, useClinics, useExportPDF, usePetAge

## Que se mantiene

### Feature slices
- `app/features/shared/` — useApi, AppNavbar (simplificado), SearchableSelect
- `app/features/home/` — Landing page (rediseñada)
- `app/features/auth/` — Solo login admin
- `app/features/blog/` — Blog publico SSR/SSG (optimizado)
- `app/features/admin/` — Panel admin (expandido)
- `app/features/stats/` — Estadisticas admin
- `app/features/maintenance/` — Modo mantenimiento

### Paginas
- `app/pages/index.vue` — Landing
- `app/pages/blog/**` — Blog publico
- `app/pages/admin/**` — Panel admin
- `app/pages/auth/login.vue` — Login solo admin
- `app/pages/maintenance.vue`

## Que se agrega

### Feature slices nuevos
| Feature | Descripcion |
|---------|-------------|
| `petprofile` | Perfil publico de mascota (QR/SSR) |

### Paginas nuevas
- `app/pages/pets/public/[slug].vue` — Perfil publico mascota
- `app/pages/admin/verifications/index.vue` — Gestionar verificaciones
- `app/pages/admin/donations/index.vue` — Log donaciones Wompi
- `app/pages/admin/events/index.vue` — Monitor eventos refugios

### Componentes nuevos (admin)
- `AdminVerificationManager.vue` — Verificaciones shelter/store/clinic
- `AdminDonationManager.vue` — Donaciones Wompi con detalles payout
- `AdminEventMonitor.vue` — Eventos de refugios

### Modificaciones
- `AppNavbar.vue` — Solo links: Landing, Blog, Admin (si admin)
- `auth.store.ts` — Remover clearSession de stores eliminados
- `admin.store.ts` — Estado para verifications, event stats, donation details
- `useAdmin.ts` — Nuevos metodos: fetchVerificationRequests, approveVerification, rejectVerification, fetchDonationDetails, fetchEventStats, verifyStore, verifyClinic
- `nuxt.config.ts` — Limpiar route rules, auto-imports
- `app/middleware/auth.ts` — Simplificar (solo rutas admin)

## Orden de ejecucion

1. **Limpieza** — Eliminar feature slices, paginas, stores, composables
2. **Simplificar** — Navbar, auth, middleware
3. **Perfil publico mascota** — Nueva feature (QR/SSR)
4. **Blog optimizado** — SSR/SSG con markdown rendering
5. **Admin expandido** — Verificaciones, donaciones, eventos
6. **Landing rediseñada** — Foco en descarga de app
7. **Tests** — Limpiar y crear nuevos

## Dependencias

### Mantener
- Nuxt 4, Pinia, Bootstrap 5, vitest, @nuxt/test-utils

### Agregar
- `marked` — Renderizado markdown para blog

### Eliminar (si no se usan en otros slices)
- Dependencias exclusivas de slices eliminados

## Configuracion nuxt.config.ts

### Route rules nuevas
```ts
routeRules: {
  '/pets/public/**': { isr: 3600 },     // ISR 1h para QR
  '/blog/**': { isr: 86400 },            // ISR 24h para SEO
  '/admin/**': { ssr: false },            // SPA para admin
}
```

### Auto-imports actualizados
Solo features que se mantienen: shared, home, auth, blog, admin, stats, maintenance, petprofile
