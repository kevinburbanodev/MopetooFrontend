# 📘 Frontend Development Document (FDD) - Mopetoo Nuxt.js

**Versión:** 1.0
**Fecha:** 2025-02-25
**Stack:** Nuxt 4 + Vue 3 + TypeScript + Bootstrap 5 + Axios + SSR

---

## 📋 Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura Frontend](#2-arquitectura-frontend)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura de Rutas y Páginas](#4-estructura-de-rutas-y-páginas)
5. [Implementación de Módulos](#5-implementación-de-módulos)
6. [Estrategia de SEO](#6-estrategia-de-seo)
7. [Configuración de HTTP Client](#7-configuración-de-http-client)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [State Management (Pinia)](#9-state-management-pinia)
10. [Guía de Desarrollo](#10-guía-de-desarrollo)

---

## 1. Visión General

El **frontend Nuxt.js** de Mopetoo es una aplicación **SSR (Server-Side Rendering)** que consume la API REST de Go + Gin. Implementa todas las funcionalidades del MVP de forma escalable, responsiva y con SEO optimizado.

### Objetivos del Frontend

- ✅ Proporcionar una experiencia de usuario fluida en web (desktop y mobile)
- ✅ Implementar autenticación JWT segura
- ✅ Consumir la API con manejo robusto de errores
- ✅ Optimizar para SEO (blog público, perfiles, adopciones)
- ✅ Mantener código limpio, modular y reutilizable
- ✅ Garantizar responsive design con Bootstrap 5
- ✅ Implementar rutas protegidas y control de acceso

---

## 2. Arquitectura Frontend

### Feature-Based Vertical Slice Architecture

Cada funcionalidad es auto-contenida en `app/features/<nombre>/`:

```
app/
├── features/
│   ├── shared/                       # Kernel compartido
│   │   ├── composables/              # useApi, useAuth (shared)
│   │   ├── components/               # AppNavbar, AppFooter, etc.
│   │   ├── stores/                   # Stores compartidas
│   │   ├── types/                    # API types compartidas
│   │   └── utils/                    # Helpers (formatters, validators)
│   │
│   ├── home/                         # Landing page
│   │   ├── components/               # HeroSection, FeaturesList, etc.
│   │   ├── composables/              # useHomeData
│   │   ├── stores/                   # homeStore (si aplica)
│   │   └── types/                    # HomeTypes
│   │
│   ├── auth/                         # Autenticación
│   │   ├── components/               # LoginForm, RegisterForm, ForgotPasswordForm
│   │   ├── composables/              # useAuth, useRegister
│   │   ├── stores/                   # auth.store.ts
│   │   └── types/                    # AuthTypes
│   │
│   ├── pets/                         # Gestión de mascotas
│   │   ├── components/               # PetCard, PetForm, PetList, etc.
│   │   ├── composables/              # usePets, usePetForm
│   │   ├── stores/                   # pets.store.ts
│   │   └── types/                    # PetTypes
│   │
│   ├── reminders/                    # Recordatorios
│   │   ├── components/               # ReminderForm, ReminderList, etc.
│   │   ├── composables/              # useReminders
│   │   ├── stores/                   # reminders.store.ts
│   │   └── types/                    # ReminderTypes
│   │
│   ├── medical/                      # Historial médico
│   │   ├── components/               # MedicalRecordForm, MedicalHistory, etc.
│   │   ├── composables/              # useMedical, useExportPDF
│   │   ├── stores/                   # medical.store.ts
│   │   └── types/                    # MedicalTypes
│   │
│   ├── shelters/                     # Refugios y adopciones
│   │   ├── components/               # ShelterCard, AdoptionList, AdoptionForm, etc.
│   │   ├── composables/              # useShelters, useAdoptions
│   │   ├── stores/                   # shelters.store.ts, adoptions.store.ts
│   │   └── types/                    # ShelterTypes
│   │
│   ├── blog/                         # Blog editorial
│   │   ├── components/               # BlogCard, BlogList, BlogArticle, etc.
│   │   ├── composables/              # useBlog, useBlogCategories
│   │   ├── stores/                   # blog.store.ts
│   │   └── types/                    # BlogTypes
│   │
│   ├── stores/                       # Directorio de tiendas pet-friendly
│   │   ├── components/               # StoreCard, StoreList, StoreFilters, etc.
│   │   ├── composables/              # useStores, useStoreSearch
│   │   ├── stores/                   # stores.store.ts (nota: renombrar a petStores para evitar conflicto)
│   │   └── types/                    # StoreTypes
│   │
│   ├── clinics/                      # Clínicas veterinarias
│   │   ├── components/               # ClinicCard, ClinicList, ClinicDirectory, etc.
│   │   ├── composables/              # useClinics, useClinicSearch
│   │   ├── stores/                   # clinics.store.ts
│   │   └── types/                    # ClinicTypes
│   │
│   ├── pro/                          # Funcionalidades PRO
│   │   ├── components/               # ProBanner, ProUpgradeModal, etc.
│   │   ├── composables/              # useProFeatures, useProSubscription
│   │   ├── stores/                   # pro.store.ts
│   │   └── types/                    # ProTypes
│   │
│   ├── admin/                        # Panel administrativo
│   │   ├── components/               # AdminDashboard, UserManager, etc.
│   │   ├── composables/              # useAdmin, useAdminStats
│   │   ├── stores/                   # admin.store.ts
│   │   └── types/                    # AdminTypes
│   │
│   └── user/                         # Perfil de usuario
│       ├── components/               # UserProfile, UserSettings, etc.
│       ├── composables/              # useUserProfile, useUserSettings
│       ├── stores/                   # user.store.ts
│       └── types/                    # UserTypes
│
├── pages/                            # Thin route wrappers (solo <head> + componente)
│   ├── index.vue                     # Home
│   ├── login.vue
│   ├── register.vue
│   ├── forgot-password.vue
│   ├── reset-password/[token].vue
│   ├── dashboard/
│   │   ├── index.vue                 # Dashboard principal
│   │   ├── pets/
│   │   │   ├── index.vue
│   │   │   ├── new.vue
│   │   │   ├── [id].vue
│   │   │   └── [id]/edit.vue
│   │   ├── reminders/
│   │   │   ├── index.vue
│   │   │   └── new.vue
│   │   ├── medical/
│   │   │   ├── index.vue
│   │   │   └── [id].vue
│   │   ├── profile/
│   │   │   ├── index.vue
│   │   │   └── edit.vue
│   │   └── settings.vue
│   ├── blog/
│   │   ├── index.vue                 # Blog listing
│   │   └── [slug].vue                # Blog article detail
│   ├── shelter/
│   │   ├── index.vue                 # Shelters & adoptions
│   │   ├── [id].vue                  # Shelter detail
│   │   └── adoptions/[id].vue        # Adoption detail
│   ├── stores/
│   │   ├── index.vue                 # Pet-friendly stores directory
│   │   └── [id].vue                  # Store detail
│   ├── clinics/
│   │   ├── index.vue                 # Clinics directory
│   │   └── [id].vue                  # Clinic detail
│   ├── admin/
│   │   ├── index.vue                 # Admin dashboard
│   │   ├── users/index.vue
│   │   ├── shelters/index.vue
│   │   ├── stores/index.vue
│   │   ├── clinics/index.vue
│   │   └── stats.vue
│   └── [...slug].vue                 # 404 fallback
│
├── assets/
│   └── scss/
│       ├── main.scss                 # Entry point (imports bootstrap + variables)
│       ├── _variables.scss           # Bootstrap variable overrides
│       ├── components/
│       │   ├── _buttons.scss
│       │   ├── _cards.scss
│       │   └── _forms.scss
│       └── utilities/
│           └── _spacing.scss
│
├── plugins/
│   ├── bootstrap.client.ts           # Load Bootstrap JS (client-side)
│   └── axios.client.ts               # (Optional) Global Axios config
│
└── app.vue                           # Root layout wrapper
```

### Principios de Arquitectura

- **Un feature = una carpeta bajo `features/`**
- **Páginas son thin wrappers**: solo `<head>` + componente
- **Lógica vive en composables y stores**, no en componentes
- **Auto-imports**: componentes, composables, stores sin importar explícitamente
- **Types compartidas en `types/index.ts`** dentro de cada feature
- **Reutilización mediante `shared/`** (useApi, componentes globales, types compartidas)

---

## 3. Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Nuxt** | ^4.0 | Framework meta (SSR, routing, auto-imports) |
| **Vue** | ^3.0 | Framework UI reactivo |
| **TypeScript** | ^5.0 | Type safety |
| **Pinia** | ^2.0 | State management |
| **Axios** | ^1.0 | HTTP client (peticiones a API) |
| **Bootstrap** | ^5.0 | CSS framework (responsive, components) |
| **Dart Sass** | compilado con Vite | Preprocessing SCSS |
| **Vite** | ^5.0 (built-in Nuxt 4) | Build tool |

### Instalación de Dependencias

```bash
# Axios (si aún no está instalado)
npm install axios

# Las siguientes ya están en CLAUDE.md:
# - @pinia/nuxt (incluida en nuxt.config.ts modules)
# - bootstrap 5 (SCSS via npm install bootstrap)
```

---

## 4. Estructura de Rutas y Páginas

### Rutas Públicas (no requieren autenticación)

| Ruta | Feature | Componente | Descripción |
|---|---|---|---|
| `/` | home | HomePage | Landing page principal |
| `/login` | auth | LoginPage | Formulario de login |
| `/register` | auth | RegisterPage | Formulario de registro |
| `/forgot-password` | auth | ForgotPasswordPage | Solicitar reset de contraseña |
| `/reset-password/[token]` | auth | ResetPasswordPage | Formulario de reset con token |
| `/blog` | blog | BlogListPage | Listado de artículos del blog |
| `/blog/[slug]` | blog | BlogArticlePage | Artículo individual del blog (SSG ideal) |
| `/shelter` | shelters | ShelterListPage | Directorio de refugios |
| `/shelter/[id]` | shelters | ShelterDetailPage | Detalle de refugio |
| `/shelter/[id]/adoptions` | shelters | AdoptionsPage | Mascotas disponibles en refugio |
| `/shelter/adoptions/[id]` | shelters | AdoptionDetailPage | Detalle de mascota en adopción |
| `/stores` | stores | StoreListPage | Directorio de tiendas pet-friendly |
| `/stores/[id]` | stores | StoreDetailPage | Detalle de tienda |
| `/clinics` | clinics | ClinicListPage | Directorio de clínicas veterinarias |
| `/clinics/[id]` | clinics | ClinicDetailPage | Detalle de clínica |

### Rutas Protegidas (requieren autenticación)

| Ruta | Feature | Componente | Descripción |
|---|---|---|---|
| `/dashboard` | dashboard | DashboardPage | Dashboard principal del usuario |
| `/dashboard/pets` | pets | PetListPage | Listado de mascotas del usuario |
| `/dashboard/pets/new` | pets | PetFormPage | Formulario crear mascota |
| `/dashboard/pets/[id]` | pets | PetDetailPage | Detalle y perfil de mascota |
| `/dashboard/pets/[id]/edit` | pets | PetEditPage | Editar mascota |
| `/dashboard/reminders` | reminders | ReminderListPage | Listado de recordatorios |
| `/dashboard/reminders/new` | reminders | ReminderFormPage | Crear recordatorio |
| `/dashboard/medical/[petId]` | medical | MedicalHistoryPage | Historial médico de mascota |
| `/dashboard/medical/[petId]/record/new` | medical | MedicalRecordPage | Agregar registro médico |
| `/dashboard/medical/[petId]/record/[recordId]/edit` | medical | MedicalRecordEditPage | Editar registro médico |
| `/dashboard/profile` | user | UserProfilePage | Perfil del usuario |
| `/dashboard/profile/edit` | user | UserProfileEditPage | Editar perfil |
| `/dashboard/settings` | user | UserSettingsPage | Configuración de usuario |
| `/admin` | admin | AdminDashboardPage | Admin dashboard (solo admin) |
| `/admin/users` | admin | AdminUsersPage | Gestión de usuarios |
| `/admin/shelters` | admin | AdminSheltersPage | Gestión de refugios |
| `/admin/stores` | admin | AdminStoresPage | Gestión de tiendas |
| `/admin/clinics` | admin | AdminClinicsPage | Gestión de clínicas |
| `/admin/stats` | admin | AdminStatsPage | Estadísticas y métricas |

### Route Middleware (Protección)

```typescript
// app/middleware/auth.ts
export default defineRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated && to.path.startsWith('/dashboard')) {
    return navigateTo('/login')
  }
})

// app/middleware/admin.ts
export default defineRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  if (!authStore.currentUser?.is_admin && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }
})
```

---

## 5. Implementación de Módulos

### 5.1. Gestión de Usuarios (RF-001 a RF-009) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ Registro con validación (nombre, email, contraseña, foto opcional)
- ✅ Login con JWT (Bearer token en Authorization header)
- ✅ Recuperación y reset de contraseña
- ✅ Foto de perfil (upload multipart, avatar fallback con initiales)
- ✅ Edición de datos personales (nombre, email, foto)
- ✅ Cambio de contraseña con validación
- ✅ Eliminación de cuenta
- ✅ Protección de rutas (`auth` middleware redirige a /login)
- ✅ Redirección automática de usuarios autenticados (`guest` middleware)
- ✅ Restauración de sesión en boot del cliente

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `AuthLoginForm` | `app/features/auth/components/AuthLoginForm.vue` | Email + password, validación Bootstrap, spinner |
| `AuthRegisterForm` | `app/features/auth/components/AuthRegisterForm.vue` | Registro completo + foto opcional, confirmación pwd |
| `AuthForgotPasswordForm` | `app/features/auth/components/AuthForgotPasswordForm.vue` | Email input, estado success |
| `AuthResetPasswordForm` | `app/features/auth/components/AuthResetPasswordForm.vue` | Pwd reset con token de URL |
| `UserProfileForm` | `app/features/auth/components/UserProfileForm.vue` | Edit perfil, cambio pwd opcional |
| `UserProfilePicture` | `app/features/auth/components/UserProfilePicture.vue` | Avatar circular, initiales, upload con preview |

**Composables:**
```typescript
// features/auth/composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore()
  const api = useApi()

  const register = async (data: RegisterDTO) => {
    // POST /users con FormData si tiene foto
    const response = await api.post('/users', data)
    authStore.setSession(response.data)
  }

  const login = async (email: string, password: string) => {
    // POST /login
    const response = await api.post('/login', { email, password })
    authStore.setSession(response.data)
  }

  const logout = () => {
    authStore.clearSession()
  }

  return { register, login, logout }
}
```

**Store (Pinia):**
```typescript
// features/auth/stores/auth.store.ts
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value)

  const setSession = (data: LoginResponse) => {
    currentUser.value = data.user
    token.value = data.token
    localStorage.setItem('mopetoo_token', data.token)
  }

  const clearSession = () => {
    currentUser.value = null
    token.value = null
    localStorage.removeItem('mopetoo_token')
  }

  const restoreFromStorage = () => {
    const stored = localStorage.getItem('mopetoo_token')
    if (stored) token.value = stored
  }

  return {
    currentUser,
    token,
    isAuthenticated,
    setSession,
    clearSession,
    restoreFromStorage,
  }
})
```

**Páginas:** ✅ Todas implementadas (thin wrappers)

| Ruta | Archivo | Middleware | Descripción |
|---|---|---|---|
| `/login` | `app/pages/login.vue` | `guest` | Thin wrapper para LoginForm |
| `/register` | `app/pages/register.vue` | `guest` | Thin wrapper para RegisterForm |
| `/forgot-password` | `app/pages/forgot-password.vue` | `guest` | Thin wrapper para ForgotPasswordForm |
| `/reset-password/[token]` | `app/pages/reset-password/[token].vue` | ninguno | Thin wrapper para ResetPasswordForm |
| `/dashboard` | `app/pages/dashboard/index.vue` | `auth` | Landing pad post-login |
| `/dashboard/profile` | `app/pages/dashboard/profile/index.vue` | `auth` | View perfil con foto y datos |
| `/dashboard/profile/edit` | `app/pages/dashboard/profile/edit.vue` | `auth` | UserProfileForm |

**Middleware:** ✅ Implementado

```typescript
// app/middleware/auth.ts — protege /dashboard/**
// app/middleware/guest.ts — protege /login, /register, etc.
```

**Plugin:** ✅ Implementado

```typescript
// app/plugins/auth.client.ts — restaura sesión en boot del cliente
```

---

### 5.2. Gestión de Mascotas (RF-100 a RF-109) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ CRUD completo de mascotas
- ✅ Foto de mascota (upload multipart con validación MIME + tamaño)
- ✅ Listado responsive con estado vacío y skeleton de carga
- ✅ Detalle completo de mascota con eliminación confirmada en 2 pasos
- ✅ Vinculación a veterinario (`veterinarian_id`)
- ✅ Cálculo de edad en español desde `birth_date`
- ✅ Avatar con fallback a emoji de especie por color

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `PetAvatar` | `app/features/pets/components/PetAvatar.vue` | Avatar circular con `photo_url` o emoji de especie, tamaños sm/md/lg |
| `PetCard` | `app/features/pets/components/PetCard.vue` | Tarjeta con foto, nombre, especie, raza, edad. Acciones: ver, editar, eliminar |
| `PetList` | `app/features/pets/components/PetList.vue` | Grid responsive. Skeleton loading, empty state con CTA |
| `PetForm` | `app/features/pets/components/PetForm.vue` | Crear/editar con photo upload (validación MIME+size), Bootstrap `was-validated` |
| `PetDetail` | `app/features/pets/components/PetDetail.vue` | Perfil completo con eliminación en 2 pasos (sin modal) |

**Composables:**
- `features/pets/composables/usePets.ts` — CRUD completo, manejo de errores, estado de carga
- `features/pets/composables/usePetAge.ts` — Calcula edad en español ("2 años y 3 meses", "8 meses", "Recién nacido")

**Store:**
- `features/pets/stores/pets.store.ts` — `pets[]`, `selectedPet`, `isLoading`. Acciones: `setPets`, `addPet`, `updatePet`, `removePet`, `setSelectedPet`, `clearSelectedPet`, `setLoading`

**Páginas:** ✅ Todas implementadas (thin wrappers con `auth` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard/pets` | `app/pages/dashboard/pets/index.vue` | Listado de mascotas |
| `/dashboard/pets/new` | `app/pages/dashboard/pets/new.vue` | Crear mascota |
| `/dashboard/pets/[id]` | `app/pages/dashboard/pets/[id].vue` | Detalle de mascota |
| `/dashboard/pets/[id]/edit` | `app/pages/dashboard/pets/[id]/edit.vue` | Editar mascota |

**Security review:** ✅ Completado — rating HIGH resuelto a MEDIUM
- ✅ Fijo: Validación de scheme en URLs de foto (`isSafeImageUrl`) en `PetAvatar` y `PetForm`
- ✅ Fijo: Validación MIME type y tamaño máximo (5 MB) en upload de foto
- ✅ Fijo: `clearSession()` en auth.store ahora limpia `petsStore` (previene data leakage en dispositivos compartidos)
- 📋 Reportado: Mensajes de error del backend expuestos directamente (MEDIUM — validar en backend)
- 📋 Reportado: `useApi.ts` lee `localStorage` directamente vs. `authStore.token` en multipart (LOW)
- 🟢 Aceptado: Sin validación IDOR en cliente (responsabilidad del backend)

**Test coverage:** ✅ 232 tests
| Archivo | Tests |
|---|---|
| `pets.store.test.ts` | 44 |
| `usePets.test.ts` | 51 |
| `usePetAge.test.ts` | 17 |
| `PetAvatar.test.ts` | 21 |
| `PetCard.test.ts` | 22 |
| `PetList.test.ts` | 16 |
| `PetForm.test.ts` | 32 |
| `PetDetail.test.ts` | 29 |

---

### 5.3. Recordatorios (RF-200 a RF-209) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ CRUD completo de recordatorios (vacunas, medicamentos, baños, visitas, otros)
- ✅ Recurrencia (una vez, semanal, mensual, anual) — campo opcional
- ✅ Filtro visual por mascota y tipo (client-side en `ReminderList`)
- ✅ Ordenamiento por fecha más próxima
- ✅ Indicador visual de recordatorios vencidos (badge + borde rojo)
- ✅ Skeleton de carga y estado vacío con CTA

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `ReminderCard` | `app/features/reminders/components/ReminderCard.vue` | Tarjeta con tipo (icon + badge coloreado), título, fecha, mascota, notas. Badge "Vencido" para fechas pasadas |
| `ReminderList` | `app/features/reminders/components/ReminderList.vue` | Grid responsive con filtros (mascota + tipo), skeleton loading, empty state con CTA |
| `ReminderForm` | `app/features/reminders/components/ReminderForm.vue` | Crear/editar: selector de mascota, tipo, título, fecha/hora, recurrencia, notas. Bootstrap `was-validated` |

**Composable:** `features/reminders/composables/useReminders.ts`
— CRUD completo (`fetchReminders`, `fetchReminderById`, `createReminder`, `updateReminder`, `deleteReminder`), estado en `useRemindersStore`, manejo de errores.

**Store:** `features/reminders/stores/reminders.store.ts`
— `reminders[]`, `selectedReminder`, `isLoading`. Acciones: `setReminders`, `addReminder`, `updateReminder`, `removeReminder`, `setSelectedReminder`, `clearSelectedReminder`, `setLoading`, `clearReminders`

**Páginas:** ✅ Todas implementadas (thin wrappers con `auth` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard/reminders` | `app/pages/dashboard/reminders/index.vue` | Listado con filtros por mascota/tipo |
| `/dashboard/reminders/new` | `app/pages/dashboard/reminders/new.vue` | Crear recordatorio |
| `/dashboard/reminders/[id]/edit` | `app/pages/dashboard/reminders/[id]/edit.vue` | Editar recordatorio |

**Endpoints:** `GET /api/reminders`, `GET /api/pets/:petId/reminders`, `GET /api/reminders/:id`, `POST /api/reminders`, `PUT /api/reminders/:id`, `DELETE /api/reminders/:id`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `remindersStore.clearReminders()`

**AppNavbar:** ✅ Enlace "Recordatorios" agregado al menú autenticado

**Test coverage:** ✅ 237 tests (store 44, useReminders 56, ReminderCard 26, ReminderList 29, ReminderForm 46)

---

### 5.4. Historial Médico (RF-300 a RF-309) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ CRUD completo de registros médicos (fecha, veterinario, diagnóstico, tratamiento, notas)
- ✅ Historial completo por mascota con ordenamiento más reciente primero
- ✅ Exportación a PDF (blob download con nombre de mascota)
- ✅ Peso del animal por visita (opcional, en kg)
- ✅ Próxima visita con badge de vencimiento (badge rojo si fecha pasada)
- ✅ Eliminación en 2 pasos inline (sin modal)
- ✅ Skeleton de carga y estado vacío con CTA
- ✅ Integración con PetDetail: botón "Ver historial médico"

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `MedicalRecordCard` | `app/features/medical/components/MedicalRecordCard.vue` | Tarjeta con fecha, veterinario (badge), diagnóstico/tratamiento (3-líneas clamp), peso, próxima visita con badge vencimiento, eliminación 2 pasos |
| `MedicalHistory` | `app/features/medical/components/MedicalHistory.vue` | Historial por mascota: skeleton loading, empty state con CTA, botón "Exportar PDF" (solo si hay registros), botón "Agregar registro" |
| `MedicalRecordForm` | `app/features/medical/components/MedicalRecordForm.vue` | Crear/editar: date, veterinario, diagnóstico, tratamiento, notas (opcionales), peso (0-200 kg, step 0.1), próxima visita. Bootstrap `was-validated`, contadores de caracteres |

**Composable:** `features/medical/composables/useMedical.ts`
— CRUD completo (`fetchMedicalHistory`, `fetchMedicalRecord`, `createMedicalRecord`, `updateMedicalRecord`, `deleteMedicalRecord`, `exportPDF`). Soporta ambas formas de respuesta del API: `{ medical_records: [] }` y array directo. `exportPDF` usa `$fetch` con `responseType: blob` + `import.meta.client` guard para SSR safety.

**Store:** `features/medical/stores/medical.store.ts` — `useMedicalStore`
— `records[]` (newest-first via prepend), `selectedRecord`, `isLoading`. Acciones: `setRecords`, `addRecord`, `updateRecord`, `removeRecord`, `setSelectedRecord`, `clearSelectedRecord`, `setLoading`, `clearMedicalRecords`, getter `hasRecords`, `getRecordById`

**Páginas:** ✅ Todas implementadas (thin wrappers con `auth` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard/medical/[petId]` | `app/pages/dashboard/medical/[petId]/index.vue` | Historial médico de una mascota |
| `/dashboard/medical/[petId]/record/new` | `app/pages/dashboard/medical/[petId]/record/new.vue` | Crear registro médico |
| `/dashboard/medical/[petId]/record/[recordId]/edit` | `app/pages/dashboard/medical/[petId]/record/[recordId]/edit.vue` | Editar registro médico |

**Endpoints:** `GET /api/pets/:petId/medical-records`, `GET /api/pets/:petId/medical-records/:id`, `POST /api/pets/:petId/medical-records`, `PUT /api/pets/:petId/medical-records/:id`, `DELETE /api/pets/:petId/medical-records/:id`, `GET /api/pets/:petId/medical-records/export`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `medicalStore.clearMedicalRecords()`

**PetDetail integration:** ✅ Botón "Ver historial médico" agregado en `PetDetail.vue`

**Test coverage:** ✅ 273 tests
| Archivo | Tests |
|---|---|
| `medical.store.test.ts` | 44 |
| `useMedical.test.ts` | 65 |
| `MedicalRecordCard.test.ts` | 38 |
| `MedicalHistory.test.ts` | 31 |
| `MedicalRecordForm.test.ts` | 86 |

---

### 5.5. Exportación y PDF (RF-400 a RF-409)

**Funcionalidades:**
- Exportación de perfil de mascota
- Exportación de historial médico
- Exportación de recordatorios

**Implementación:**
- Backend genera PDF y devuelve como `blob`
- Frontend descarga usando `URL.createObjectURL` + `<a>` click

---

### 5.6. Refugios y Adopciones (RF-500 a RF-509)

**Funcionalidades:**
- Registro y login de refugios (tipo de usuario diferente)
- Directorio público de refugios
- Listado de mascotas disponibles
- Sistema de solicitudes de adopción
- Perfil de refugio editable (PRO)

**Componentes Frontend:**
- `ShelterCard` — tarjeta de refugio
- `ShelterDirectory` — listado público
- `ShelterDetail` — perfil de refugio
- `AdoptionList` — mascotas disponibles
- `AdoptionCard` — mascota disponible
- `AdoptionForm` — solicitar adopción

**Rutas de refugios:**
```
/shelter (público)
  → Directorio searchable
  → Filtros por ubicación, especies

/shelter/[id] (público)
  → Perfil del refugio
  → Listado de adopciones
  → Reviews/testimonios

/dashboard/shelter (protegido para refugios)
  → Gestión de mascotas disponibles
  → Gestión de solicitudes
  → Estadísticas
```

---

### 5.7. Blog Editorial (RF-600 a RF-609)

**Funcionalidades:**
- Listado público de artículos
- Artículos individual (SSG ideal)
- Búsqueda y filtro por categoría
- Sistema de comentarios (optional)
- SEO optimizado para cada artículo

**Estrategia SSG (Static Site Generation):**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Pre-render blog articles at build time
    '/blog/**': { prerender: true },
    // Cache /blog at CDN for 60s, revalidate every 60s
    '/blog': { cache: { maxAge: 60 * 60 } },
  }
})
```

**Componentes:**
- `BlogList` — listado con paginación
- `BlogArticle` — artículo individual con sidebar
- `BlogCategories` — filtros

---

### 5.8. Directorio de Tiendas Pet-Friendly (RF-700 a RF-709)

**Funcionalidades:**
- Directorio público de tiendas
- Búsqueda y filtro (ubicación, categoría, horario)
- Detalle de tienda (ubicación mapa, horario, contacto)
- Tiendas destacadas (PRO)

**Componentes:**
- `StoreCard` — tarjeta de tienda
- `StoreList` — listado grid
- `StoreFilters` — búsqueda avanzada
- `StoreDetail` — perfil de tienda
- `StoreMap` — ubicación en mapa (Google Maps?)

---

### 5.9. Monetización (RF-800 a RF-809)

**Funcionalidades:**
- Suscripción PRO (mensual, anual)
- Donaciones a refugios
- Tiendas y refugios destacados

**Componentes Frontend:**
- `ProUpgradeModal` — oferta de suscripción
- `ProBanner` — banner de PRO features
- `PricingTable` — tabla de planes
- `DonationForm` — formulario de donaciones
- `PaymentCheckout` — (integración con Stripe/gateway)

**Estrategia:**
- Mostrar `ProBanner` o bloquear funciones PRO en dashboard
- Integración con Stripe (webhook backend)
- Persistencia de `is_pro` en store desde API

---

### 5.10. Clínicas Veterinarias (RF-900 a RF-909)

**Funcionalidades:**
- Directorio público de clínicas
- Búsqueda por ubicación y especialidad
- Agenda online (opcional)
- Perfil editable (PRO)
- Vinculación mascota ↔ clínica

**Componentes:**
- `ClinicCard` — tarjeta de clínica
- `ClinicDirectory` — listado searchable
- `ClinicDetail` — perfil con horario, contacto, servicios

---

### 5.11. Panel Administrativo (RF-1000 a RF-1009)

**Funcionalidades:**
- Dashboard de admin
- Gestión de usuarios
- Gestión de refugios
- Gestión de tiendas
- Gestión de clínicas
- Logs de transacciones

**Componentes:**
- `AdminDashboard` — overview de stats
- `AdminUserManager` — CRUD de usuarios
- `AdminShelterManager` — CRUD de refugios
- `AdminStoreManager` — CRUD de tiendas
- `AdminClinicManager` — CRUD de clínicas
- `AdminTransactionLog` — historial de pagos/donaciones

**Middleware:**
```typescript
// app/middleware/admin.ts
export default defineRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  if (!authStore.currentUser?.is_admin) {
    return navigateTo('/')
  }
})
```

---

### 5.12. Estadísticas y Métricas (RF-1100 a RF-1109)

**Funcionalidades:**
- Dashboard general (usuarios, mascotas, adopciones)
- Métricas de revenue (PRO, donaciones)
- Actividad de usuarios
- Gráficos y reportes

**Componentes:**
- `StatsOverview` — cards de KPIs
- `StatsChart` — gráficos (Chart.js o similar)
- `RevenueReport` — ingresos por fuente
- `ActivityLog` — eventos recientes

---

### 5.13. Sistema de Mantenimiento (RF-1200 a RF-1209)

**Funcionalidades:**
- Bandera de mantenimiento desde admin
- Página de mantenimiento
- Redirección automática si frontend detecta mantenimiento

**Implementación:**
```typescript
// features/shared/composables/useApi.ts
export const useApi = () => {
  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.apiBase,
    onResponse({ response }) {
      // Chequear header de mantenimiento
      if (response.headers.get('x-maintenance') === 'true') {
        navigateTo('/maintenance')
      }
    },
    onRequestError({ error }) {
      // Handle errors
    }
  })

  return api
}

// Página de mantenimiento
// app/pages/maintenance.vue
```

---

## 6. Estrategia de SEO

### 6.1. Server-Side Rendering (SSR)

Nuxt 4 hace SSR por defecto. Cada página se renderiza en servidor y se envía como HTML completo al cliente.

**Ventajas:**
- Meta tags se insertan en `<head>` durante la renderización
- Contenido es indexable por bots de búsqueda
- Performance: primer paint más rápido
- Social sharing: las preview cards ven contenido real

### 6.2. Meta Tags por Página

```typescript
// En cada página o componente
useHead({
  title: 'Mis Mascotas — Mopetoo Dashboard',
  meta: [
    { name: 'description', content: 'Gestiona toda la información de tus mascotas en un solo lugar' },
    { name: 'og:title', content: 'Mis Mascotas — Mopetoo' },
    { name: 'og:description', content: 'Gestiona toda la información de tus mascotas en un solo lugar' },
    { name: 'og:image', content: 'https://mopetoo.com/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
})

// O usar composable
useSeoMeta({
  title: 'Mis Mascotas — Mopetoo Dashboard',
  description: 'Gestiona toda la información de tus mascotas en un solo lugar',
  ogTitle: 'Mis Mascotas — Mopetoo',
  ogDescription: 'Gestiona toda la información de tus mascotas en un solo lugar',
  ogImage: 'https://mopetoo.com/og-image.png',
  twitterCard: 'summary_large_image',
})
```

### 6.3. Structured Data (Schema.org)

Para blog y directorio de tiendas:

```vue
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{ article.title }}",
  "description": "{{ article.excerpt }}",
  "image": "{{ article.featured_image }}",
  "datePublished": "{{ article.published_at }}",
  "author": {
    "@type": "Person",
    "name": "{{ article.author.name }}"
  }
}
</script>
```

### 6.4. Sitemap y Robots.txt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt'],
      crawlLinks: true,
    }
  }
})
```

### 6.5. Rutas a Pre-renderizar

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/shelter/**': { prerender: true },
    '/stores/**': { prerender: true },
    '/clinics/**': { prerender: true },
  }
})
```

---

## 7. Configuración de HTTP Client

### 7.1. useApi Composable

```typescript
// app/features/shared/composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
    },
    onError: (error) => {
      // Manejo global de errores
      if (error.response?.status === 401) {
        authStore.clearSession()
        navigateTo('/login')
      }
    }
  })
}
```

### 7.2. Uso en Composables

```typescript
const api = useApi()

// GET
const response = await api('/api/pets')

// POST
const response = await api('/api/pets', {
  method: 'POST',
  body: { name: 'Fluffy', species: 'cat' }
})

// PATCH
const response = await api(`/api/pets/${id}`, {
  method: 'PATCH',
  body: { name: 'Fluff' }
})

// DELETE
await api(`/api/pets/${id}`, { method: 'DELETE' })

// FormData (multipart)
const formData = new FormData()
formData.append('photo', photoFile)
const response = await api('/api/pets', {
  method: 'POST',
  body: formData
})
```

### 7.3. Manejo de Errores

```typescript
try {
  const response = await api('/api/pets')
  petsStore.setPets(response)
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Recurso no encontrado')
  } else if (error.response?.status === 400) {
    console.error('Validación:', error.data?.message)
  } else {
    console.error('Error genérico:', error.message)
  }
}
```

---

## 8. Variables de Entorno

### 8.1 Archivo `.env.example`

```env
# API Configuration
NUXT_PUBLIC_API_BASE=http://localhost:4000

# Optional: Analytics, CDN, etc.
# NUXT_PUBLIC_GA_ID=
# NUXT_PUBLIC_SENTRY_DSN=
```

### 8.2 Archivo `.env` (local development)

```env
NUXT_PUBLIC_API_BASE=http://localhost:4000
```

### 8.3 Archivo `.env.production`

```env
NUXT_PUBLIC_API_BASE=https://api.mopetoo.com
```

### 8.4 Nuxt Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000'
    }
  }
})
```

### 8.5 Acceso en Frontend

```typescript
const config = useRuntimeConfig()
console.log(config.public.apiBase) // 'http://localhost:4000'
```

**⚠️ Nota:** Solo variables con prefijo `NUXT_PUBLIC_` se exponen al cliente. Variables sin prefijo quedan en servidor (secretas).

---

## 9. State Management (Pinia)

### 9.1. Estructura de Stores

Cada feature tiene su store bajo `features/<feature>/stores/`:

```typescript
// features/auth/stores/auth.store.ts
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isPending = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const setSession = (data: SessionData) => {
    currentUser.value = data.user
    token.value = data.token
    localStorage.setItem('mopetoo_token', data.token)
  }

  const clearSession = () => {
    currentUser.value = null
    token.value = null
    localStorage.removeItem('mopetoo_token')
  }

  const restoreFromStorage = async () => {
    const stored = localStorage.getItem('mopetoo_token')
    if (stored) {
      token.value = stored
      // Opcionalmente, validar token en backend
      // const user = await verifyToken()
    }
  }

  return {
    currentUser,
    token,
    isPending,
    isAuthenticated,
    setSession,
    clearSession,
    restoreFromStorage,
  }
})
```

### 9.2. Auto-import de Stores

```typescript
// En cualquier componente o composable, no necesita import
const authStore = useAuthStore()
const petsStore = usePetsStore()
```

### 9.3. Persistencia

Solo `authStore` persiste `token` en `localStorage`. Otros stores son ephemeral (refetch en cada navegación).

---

## 10. Guía de Desarrollo

### 10.1. Crear una Nueva Feature

```bash
# 1. Crear estructura de directorios
mkdir -p app/features/mynew/{components,composables,stores,types}

# 2. Crear archivos base
touch app/features/mynew/types/index.ts
touch app/features/mynew/composables/useMyNew.ts
touch app/features/mynew/stores/mynew.store.ts
touch app/features/mynew/components/MyNewComponent.vue

# 3. Crear página
mkdir -p app/pages/mynew
touch app/pages/mynew/index.vue

# 4. Código en types/index.ts
export interface MyNewItem {
  id: string
  name: string
  // ...
}

# 5. Código en stores/mynew.store.ts
export const useMyNewStore = defineStore('mynew', () => {
  const items = ref<MyNewItem[]>([])
  // ...
  return { items }
})

# 6. Código en composables/useMyNew.ts
export const useMyNew = () => {
  const store = useMyNewStore()
  const api = useApi()
  // ...
  return { fetchItems, createItem }
}

# 7. Componente .vue auto-importado
# features/mynew/components/MyNewComponent.vue (sin ruta prefijo)
<script setup lang="ts">
const { fetchItems } = useMyNew()
</script>
```

### 10.2. Convenciones de Nombres

| Artefacto | Convención | Ejemplo |
|---|---|---|
| Feature | snake-case | `app/features/my-feature/` |
| Component | PascalCase | `PetCard.vue`, `UserProfile.vue` |
| Composable | camelCase `use*` | `useAuth.ts`, `usePets.ts` |
| Store | camelCase `*Store` | `auth.store.ts`, `pets.store.ts` |
| Type file | `index.ts` | `types/index.ts` |
| Page | kebab-case | `dashboard.vue`, `user-profile.vue` |

### 10.3. Workflow de Desarrollo

```bash
# 1. Start dev server
npm run dev

# 2. Código y test en http://localhost:3000

# 3. Build para producción
npm run build

# 4. Preview build local
npm run preview

# 5. Deploy (configurar según hosting)
```

### 10.4. Debugging

**Componentes:**
- Vue DevTools extension
- `console.log` en `<script setup>`

**API:**
- Network tab del navegador
- `useApi()` wrapper con logs

**State:**
- Pinia DevTools extension
- Inspeccionar `localStorage`

---

## 11. Deployment & Build

### 11.1. Build Commands

```bash
# Development (SSR + hot reload)
npm run dev

# Build producción (Node server)
npm run build

# Generate estático (SSG)
npm run generate

# Preview build local
npm run preview
```

### 11.2. Hosting Options

- **Vercel** (nativo Nuxt, muy recomendado)
- **Netlify** (con configuración)
- **Railway** (con Docker)
- **AWS Amplify** (compatible)
- **Heroku** (legacy, pero posible)

### 11.3. Environment Setup

```bash
# Local .env
NUXT_PUBLIC_API_BASE=http://localhost:4000

# Production .env (en hosting)
NUXT_PUBLIC_API_BASE=https://api.mopetoo.com
```

---

## 12. Performance & Optimization

### 12.1. Image Optimization

Usar `<NuxtImg>` en lugar de `<img>`:

```vue
<template>
  <NuxtImg
    src="/images/pet.jpg"
    alt="Pet photo"
    width="300"
    height="300"
    loading="lazy"
  />
</template>
```

### 12.2. Code Splitting

Nuxt 4 automáticamente divide código por rutas. Para lazy-load componentes:

```vue
<template>
  <Suspense>
    <HeavyComponent />
    <template #fallback>
      <div>Cargando...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
const HeavyComponent = defineAsyncComponent(() => import('~/features/heavy/components/Heavy.vue'))
</script>
```

### 12.3. Caching

```typescript
// nuxt.config.ts
routeRules: {
  '/blog/**': { cache: { maxAge: 60 * 60 * 24 } },
  '/api/**': { cache: { maxAge: 60 } },
}
```

---

## Resumen y Checklist

### Arquitectura & Setup
- [x] Arquitectura Feature-Based Vertical Slice definida
- [x] Stack tecnológico especificado (Nuxt 4, Vue 3, Pinia, Axios, Bootstrap 5)
- [x] Rutas públicas y protegidas mapeadas
- [x] Composables y stores pattern establecido
- [x] SEO strategy con SSR, meta tags, schema.org
- [x] HTTP client (useApi) pattern con soporte multipart
- [x] Variables de entorno (.env, .env.example, nuxt.config runtimeConfig)
- [x] State management (Pinia) structure con persistencia token
- [x] Development workflow documentado
- [x] Vitest + @nuxt/test-utils configurado (vitest.config.ts, globals: true)
- [x] Security headers baseline (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

### Funcionalidades Implementadas
- [x] **RF-001 a RF-009 — Gestión de Usuarios (Auth slice)**
  - Store (`auth.store.ts`): estado, persistencia localStorage, computed properties
  - Composable (`useAuth.ts`): login, register, logout, password reset, profile update, account delete
  - Components: LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, UserProfileForm, UserProfilePicture
  - Middleware: auth (protege /dashboard/**), guest (protege /login, /register)
  - Plugin: auth.client.ts (restaura sesión en boot)
  - Test coverage: 85 tests (store 41, composable 36, middleware 8)
  - Security review: 3 fixes aplicados, rating MEDIUM

### Próximas implementaciones
- [x] RF-100 a RF-109 — Gestión de mascotas (pets slice) ✅
- [x] RF-200 a RF-209 — Recordatorios (reminders slice) ✅
- [x] RF-300 a RF-309 — Historial médico (medical slice) ✅
- [ ] RF-500 a RF-509 — Refugios y adopciones (shelters slice)
- [ ] RF-600 a RF-609 — Blog editorial (blog slice)
- [ ] RF-700 a RF-709 — Directorio tiendas pet-friendly (stores slice)
- [ ] RF-900 a RF-909 — Clínicas veterinarias (clinics slice)
- [ ] RF-1000 a RF-1009 — Panel administrativo (admin slice)
- [ ] Content Security Policy (CSP) implementation
- [ ] Multi-language support (@nuxtjs/i18n)

---

**Versión:** 1.0 | **Fecha:** 2025-02-25 | **Autor:** Claude Code
**Próximas actualizaciones:** post-MVP (testing strategy, error handling patterns, analytics)
