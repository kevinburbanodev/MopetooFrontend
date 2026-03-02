# 📘 Frontend Development Document (FDD) - Mopetoo Nuxt.js

**Versión:** 1.1
**Fecha:** 2025-02-25 (actualizado 2026-03-01)
**Stack:** Nuxt 4 + Vue 3 + TypeScript + Bootstrap 5 + $fetch/ofetch + SSR

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
│   │   ├── composables/              # useApi, useExportPDF
│   │   ├── components/               # AppNavbar, AppFooter, etc.
│   │   ├── stores/                   # Stores compartidas
│   │   ├── types/                    # API types compartidas
│   │   └── utils/                    # extractErrorMessage, formatters, validators
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
│   └── auth.client.ts                # Restaura sesión JWT desde localStorage en boot
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
| **$fetch/ofetch** | built-in Nuxt 4 | HTTP client (peticiones a API) |
| **Bootstrap** | ^5.0 | CSS framework (responsive, components) |
| **Dart Sass** | compilado con Vite | Preprocessing SCSS |
| **Vite** | ^5.0 (built-in Nuxt 4) | Build tool |

### Instalación de Dependencias

```bash
# $fetch viene incluido con Nuxt 4 (ofetch) — no requiere instalación

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
- ✅ Registro multi-entidad: user, shelter, store, clinic (cada uno con payload específico)
- ✅ Login con JWT (Bearer token en Authorization header)
- ✅ Recuperación y reset de contraseña
- ✅ Foto de perfil (upload multipart, avatar fallback con initiales)
- ✅ Edición de datos personales multi-entidad (endpoint dinámico según `entityType`)
- ✅ Cambio de contraseña con validación
- ✅ Eliminación de cuenta multi-entidad (endpoint dinámico según `entityType`)
- ✅ Protección de rutas (`auth` middleware redirige a /login)
- ✅ Redirección automática de usuarios autenticados (`guest` middleware)
- ✅ Restauración de sesión en boot del cliente
- ✅ JWT `user_id` tipado como `number` (Go lo codifica así), normalizado a `string` con `String()`

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
export function useAuth() {
  const authStore = useAuthStore()
  const { post, patch, del } = useApi()

  // Registro multi-entidad (user, shelter, store, clinic)
  const register = async (data: RegisterDTO) => { /* POST /users */ }
  const registerShelter = async (data: RegisterShelterPayload) => { /* POST /shelters */ }
  const registerStore = async (data: RegisterStorePayload) => { /* POST /stores */ }
  const registerClinic = async (data: RegisterClinicPayload) => { /* POST /clinics */ }

  const login = async (email: string, password: string) => {
    const response = await post<LoginResponse>('/login', { email, password })
    authStore.setSession(response)
  }

  const logout = () => { authStore.clearSession() }

  // Multi-entity: endpoint dinámico según entityType
  const updateProfile = async (data: UpdateProfileDTO, photo?: File) => {
    const type = authStore.entityType ?? 'user'
    const entityId = decodeEntityIdFromToken()
    const endpoint = getProfileEndpoint(type, entityId) // /api/users/:id, /api/shelters/:id, etc.
    // PATCH con FormData si hay foto, o JSON sin foto
    const entity = photo
      ? await $fetch(endpoint, { method: 'PATCH', body: buildProfileFormData(data, photo) })
      : await patch(endpoint, data)
    authStore.setEntity(entity, type)
  }

  const deleteAccount = async () => {
    const type = authStore.entityType ?? 'user'
    const entityId = decodeEntityIdFromToken()
    await del(getProfileEndpoint(type, entityId))
    authStore.clearSession()
  }

  return { register, registerShelter, registerStore, registerClinic, login, logout, updateProfile, deleteAccount, /* ... */ }
}
```

**Nota:** `decodeEntityIdFromToken()` decodifica el JWT y extrae `user_id` (number en Go), normalizado a string con `String(payload.user_id)`. `getProfileEndpoint(type, id)` retorna `/api/{type}s/:id` según el `entityType` (user, shelter, store, clinic). Todas las funciones `register*` usan `finally { pending.value = false }` para garantizar limpieza del estado de carga.

**Store (Pinia):**
```typescript
// features/auth/stores/auth.store.ts
export const useAuthStore = defineStore('auth', () => {
  const currentEntity = ref<AuthEntity | null>(null)
  const entityType = ref<EntityType | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value)
  const isPro = computed(() => currentEntity.value?.is_pro ?? false)
  const isAdmin = computed(() => currentEntity.value?.is_admin ?? false)

  const setSession = (data: LoginResponse) => {
    currentEntity.value = data.user ?? data.shelter ?? data.store ?? data.clinic
    entityType.value = data.entity_type ?? 'user'
    token.value = data.token
    localStorage.setItem('mopetoo_token', data.token)
  }

  const setEntity = (entity: AuthEntity, type: EntityType) => {
    currentEntity.value = entity
    entityType.value = type
  }

  const clearSession = () => {
    currentEntity.value = null
    entityType.value = null
    token.value = null
    localStorage.removeItem('mopetoo_token')
    // Limpia todos los stores específicos del usuario
    // petsStore, remindersStore, medicalStore, sheltersStore, proStore, adminStore, statsStore
  }

  return { currentEntity, entityType, token, isAuthenticated, isPro, isAdmin, setSession, setEntity, clearSession, /* ... */ }
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
- ✅ Foto de mascota **requerida** (upload multipart con validación MIME + tamaño — backend `binding:"required"`)
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
- `features/pets/composables/usePets.ts` — CRUD completo, manejo de errores. `createPet(data, photo: File)` — photo es **requerido** (backend `binding:"required"`). Retorna `{ error, fetchPets, fetchPetById, createPet, updatePet, deletePet, exportProfilePDF, petsStore }` (nota: `pending` ref eliminado — no se usaba)
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

**Test coverage:** ✅ 255 tests
| Archivo | Tests |
|---|---|
| `pets.store.test.ts` | 40 |
| `usePets.test.ts` | 64 |
| `usePetAge.test.ts` | 8 |
| `PetAvatar.test.ts` | 22 |
| `PetCard.test.ts` | 24 |
| `PetList.test.ts` | 19 |
| `PetForm.test.ts` | 48 |
| `PetDetail.test.ts` | 30 |

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
— CRUD completo (`fetchReminders`, `fetchReminderById`, `createReminder`, `updateReminder`, `deleteReminder`), estado en `useRemindersStore`, manejo de errores. **IDs normalizados:** `Reminder.id` y `Reminder.pet_id` son `string` en el frontend (normalizados desde `number` del backend via `normalizeReminder()` / `normalizeReminders()`). Parámetros: `fetchReminders(petId?: string)`, `fetchReminderById(id: string)`, `updateReminder(id: string, ...)`, `deleteReminder(id: string)`.

**Store:** `features/reminders/stores/reminders.store.ts`
— `reminders[]`, `selectedReminder`, `isLoading`. Acciones: `setReminders`, `addReminder`, `updateReminder`, `removeReminder(id: string)`, `setSelectedReminder`, `clearSelectedReminder`, `setLoading`, `clearReminders`. Getter: `getReminderById(id: string)`

**Páginas:** ✅ Todas implementadas (thin wrappers con `auth` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard/reminders` | `app/pages/dashboard/reminders/index.vue` | Listado con filtros por mascota/tipo |
| `/dashboard/reminders/new` | `app/pages/dashboard/reminders/new.vue` | Crear recordatorio |
| `/dashboard/reminders/[id]/edit` | `app/pages/dashboard/reminders/[id]/edit.vue` | Editar recordatorio |

**Endpoints:** `GET /api/reminders`, `GET /api/pets/:petId/reminders`, `GET /api/reminders/:id`, `POST /api/reminders`, `PUT /api/reminders/:id`, `DELETE /api/reminders/:id`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `remindersStore.clearReminders()`

**AppNavbar:** ✅ Enlace "Recordatorios" agregado al menú autenticado

**Test coverage:** ✅ 228 tests (store 53, useReminders 57, ReminderCard 25, ReminderList 38, ReminderForm 55)

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

### 5.5. Exportación y PDF (RF-400 a RF-409) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ Exportación de perfil de mascota
- ✅ Exportación de historial médico (ya implementado en RF-300)
- ✅ Exportación de recordatorios
- ✅ Detección de header `x-maintenance` en respuestas de exportación

**Implementación:**
- Backend genera PDF y devuelve como `blob`
- Frontend descarga usando `URL.createObjectURL` + `<a>` click + `revokeObjectURL`
- Detección de mantenimiento: `onResponseCheck` en `$fetch` detecta header `x-maintenance: true` y redirige a `/maintenance`

**Composable compartido:** `features/shared/composables/useExportPDF.ts`
— `downloadPDF(endpoint, filename)`: fetch blob con `$fetch` + `responseType: 'blob'` + Bearer token + `onResponse: onResponseCheck` (detección de mantenimiento), luego dispara descarga con `<a>` temporal. Siempre guarda con `import.meta.client`. `slugify(name)` convierte nombres de mascota a slugs seguros para filenames. `onResponseCheck` detecta header `x-maintenance: true` y redirige a `/maintenance` (mismo patrón que `useApi.ts`).

**Integración en features:**

| Feature | Función | Endpoint | Filename |
|---|---|---|---|
| `usePets` | `exportProfilePDF(petId, petName?)` | `GET /api/pets/:petId/export` | `perfil-{slug}.pdf` |
| `useMedical` | `exportPDF(petId, petName?)` | `GET /api/pets/:petId/medical-records/export` | `historial-medico-{slug}.pdf` |
| `useReminders` | `exportRemindersPDF(petId?, petName?)` | `GET /api/reminders/export` o `GET /api/pets/:petId/reminders/export` | `recordatorios[-{slug}].pdf` |

**UI de exportación:**
- `PetDetail.vue` — botón "Exportar perfil" emite `export-pdf` al padre (`[id].vue`)
- `MedicalHistory.vue` — botón "Exportar PDF" (ya implementado en RF-300)
- `app/pages/dashboard/reminders/index.vue` — botón "Exportar PDF" en cabecera (solo visible cuando hay recordatorios)

**Endpoints backend:** `GET /api/pets/:petId/export`, `GET /api/pets/:petId/medical-records/export`, `GET /api/reminders/export`, `GET /api/pets/:petId/reminders/export`

**Test coverage:** ✅ 25 tests (composable compartido)
| Archivo | Tests |
|---|---|
| `useExportPDF.test.ts` | 25 |

> **Nota:** Los tests de `exportProfilePDF` y `exportRemindersPDF` se contabilizan en sus respectivos slices (pets y reminders).

---

### 5.6. Refugios y Adopciones (RF-500 a RF-509) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ MVP público implementado
- ✅ Directorio público de refugios (searchable, filtro por especie)
- ✅ Detalle de refugio con perfil completo y listado de mascotas en adopción
- ✅ Tarjetas de mascotas en adopción con estado visual (disponible/en proceso/adoptado)
- ✅ Formulario de solicitud de adopción (autenticado, min 20 / max 500 chars)
- ✅ CTA de login para usuarios no autenticados
- ✅ Skeleton loading y empty states en todas las vistas
- ✅ Foto con validación `isSafeImageUrl`, fallback a emoji por especie
- 📋 Dashboard de gestión para refugios (post-MVP)
- 📋 Perfil de refugio editable (PRO)

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `ShelterCard` | `app/features/shelters/components/ShelterCard.vue` | Tarjeta con foto/fallback 🏠, nombre, ciudad, descripción (2-líneas clamp), badges de especie, badge verificado |
| `ShelterList` | `app/features/shelters/components/ShelterList.vue` | Grid responsive, filtro client-side (búsqueda + especie), skeleton 6 cards, empty state, contador de resultados |
| `ShelterDetail` | `app/features/shelters/components/ShelterDetail.vue` | Banner hero, perfil completo con contacto, especies aceptadas, integra AdoptionList |
| `AdoptionPetCard` | `app/features/shelters/components/AdoptionPetCard.vue` | Foto/fallback por especie, badge estado overlay, chips vacunado/esterilizado, edad desde `age_months`, link a detalle |
| `AdoptionList` | `app/features/shelters/components/AdoptionList.vue` | Grid con 4 filtros (especie, género, talla, estado), skeleton, empty states |
| `AdoptionDetail` | `app/features/shelters/components/AdoptionDetail.vue` | Perfil completo del animal, formulario adopción (solo autenticado + disponible) en `<ClientOnly>`, success/error state |

**Composable:** `features/shelters/composables/useShelters.ts`
— `fetchShelters(filters?)`, `fetchShelterById(id)`, `fetchAdoptionPets(shelterId, filters?)`, `fetchAdoptionPetById(shelterId, petId)`, `submitAdoptionRequest(shelterId, petId, message)`. Soporta ambas formas de respuesta del API: `{ shelters: [] }` y array directo. Patrón idéntico al de medical/reminders.

**Store:** `features/shelters/stores/shelters.store.ts` — `useSheltersStore`
— `shelters[]`, `selectedShelter`, `adoptionPets[]`, `selectedAdoptionPet`, `isLoading`. Getters: `hasShelters`, `hasAdoptionPets`, `getAvailablePets` (filtro computed status === 'available'). Acciones: `setShelters`, `addShelter`, `setSelectedShelter`, `clearSelectedShelter`, `setAdoptionPets`, `addAdoptionPet`, `setSelectedAdoptionPet`, `clearSelectedAdoptionPet`, `setLoading`, `clearShelters`.

**Páginas:** ✅ Todas implementadas (thin wrappers públicos sin middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/shelter` | `app/pages/shelter/index.vue` | Directorio de refugios |
| `/shelter/[id]` | `app/pages/shelter/[id].vue` | Detalle de refugio + adopciones |
| `/shelter/adoptions/[id]` | `app/pages/shelter/adoptions/[id].vue` | Detalle de mascota en adopción |

**Endpoints:** `GET /api/shelters`, `GET /api/shelters/:id`, `GET /api/shelters/:id/pets`, `GET /api/shelters/:id/pets/:petId`, `POST /api/shelters/:id/pets/:petId/adopt`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `sheltersStore.clearShelters()`

**AppNavbar:** ✅ Enlace "Adopciones" agregado al menú público (visible sin autenticación)

**SSR safety:** ✅ Formulario de adopción envuelto en `<ClientOnly>` — auth check nunca corre en servidor, elimina riesgo de hydration mismatch y filtración de estado auth en HTML.

**Security review:** ✅ Completado — rating MEDIUM→LOW tras fixes
- ✅ Fijo (HIGH): `safeWebsiteUrl` computed restringe website href a `http:`/`https:` — previene `javascript:` URI injection
- ✅ Fijo (MEDIUM): `safePhone` (regex `/^[+\d\s\-().]{4,25}$/`) y `safeEmail` (regex con `@`) sanitizan hrefs `tel:` y `mailto:`
- ✅ Fijo (LOW): `shelterId` del query param validado con `/^[\w-]{1,64}$/` antes de usar en path de API
- ✅ Sin `v-html` en ningún componente
- ✅ Todos los bindings `photo_url` pasan por `isSafeImageUrl()`
- ✅ `clearSession()` + `sheltersStore.clearShelters()` correctamente integrado
- 📋 Reportado: Strings raw del backend mostradas en UI (MEDIUM — patrón aceptado igual que otros slices)

**Test coverage:** ✅ 252 tests
| Archivo | Tests |
|---|---|
| `shelters.store.test.ts` | 65 |
| `useShelters.test.ts` | 67 |
| `ShelterCard.test.ts` | 21 |
| `ShelterList.test.ts` | 25 |
| `AdoptionPetCard.test.ts` | 35 |
| `AdoptionDetail.test.ts` | 39 |

---

### 5.7. Blog Editorial (RF-600 a RF-609) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ MVP público implementado
- ✅ Listado público de artículos con paginación tipo "Cargar más"
- ✅ Artículo individual con SEO dinámico (title, description, og:image)
- ✅ Búsqueda client-side (título, extracto, autor, tags)
- ✅ Filtro por categoría (server-side via query param)
- ✅ Skeleton loading y estados vacíos contextuales
- ✅ Imagen destacada con validación `isSafeImageUrl`, fallback SVG inline (pata de animal)
- ✅ Tiempo de lectura, badges de tags (máximo 3 + overflow `+N`)
- ✅ Breadcrumb en detalle de artículo
- ✅ `onUnmounted` limpia `selectedPost` para evitar datos obsoletos al navegar entre artículos
- 📋 Sistema de comentarios (post-MVP)
- 📋 Panel admin para gestión de artículos (post-MVP)

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `BlogCategoryFilter` | `app/features/blog/components/BlogCategoryFilter.vue` | Pills horizontales scrollables, `role="tablist"`, "Todos" + una pill por categoría, activa con `btn-primary`, badge con `post_count` |
| `BlogCard` | `app/features/blog/components/BlogCard.vue` | Imagen (con `isSafeImageUrl`) o SVG placeholder, badge categoría overlay, título 2-líneas clamp, extracto 3-líneas, avatar con fallback inicial, fecha en español, badge tiempo lectura, `stretched-link` |
| `BlogList` | `app/features/blog/components/BlogList.vue` | Grid 1/2/3 columnas, filtro categoría (server-side) + búsqueda (client-side), skeleton 6 cards, 3 estados vacíos distintos, botón "Cargar más" (append pattern) |
| `BlogArticle` | `app/features/blog/components/BlogArticle.vue` | Hero con `aspect-ratio: 2/1` (previene CLS), meta autor+fecha, contenido como texto plano (sin `v-html`), tags, CTA "Ver más artículos" |

**Composable:** `features/blog/composables/useBlog.ts`
— `fetchPosts(filters?, append)`: soporta ambas formas de respuesta (`BlogListResponse` envelope y array directo), controla `setPosts` vs `appendPosts`. `fetchPostBySlug(slug)`: consulta caché del store antes de llamar a la API. `fetchCategories()`: fallo no-crítico (no bloquea el listado).

**Store:** `features/blog/stores/blog.store.ts` — `useBlogStore`
— `posts[]`, `selectedPost`, `categories[]`, `isLoading`, `currentPage`, `totalPages`, `total`. Getters: `hasPosts`, `hasCategories`, `getPostBySlug` (factory computed). Acciones: `setPosts`, `appendPosts`, `setSelectedPost`, `clearSelectedPost`, `setCategories`, `setLoading`, `setPagination`, `clearBlog`.

**Páginas:** ✅ Todas implementadas (thin wrappers públicos sin middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/blog` | `app/pages/blog/index.vue` | Listado de artículos con SEO estático |
| `/blog/[slug]` | `app/pages/blog/[slug].vue` | Detalle de artículo con SEO dinámico + breadcrumb |

**Endpoints:** `GET /api/blog/posts`, `GET /api/blog/posts/:slug`, `GET /api/blog/categories`

**AppNavbar:** ✅ Enlace "Blog" ya presente en `publicLinks` (visible sin autenticación)

**Nota de seguridad:** Contenido del artículo renderizado como texto plano (NO `v-html`). Comentario en `BlogArticle.vue` documenta los requisitos para habilitar `v-html` en el futuro (DOMPurify en backend + flag explícito).

**Cross-store cleanup:** No requerido — el blog es datos públicos sin contenido específico del usuario. `clearBlog()` está disponible para usos futuros.

**Test coverage:** ✅ 208 tests
| Archivo | Tests |
|---|---|
| `blog.store.test.ts` | 44 |
| `useBlog.test.ts` | 60 |
| `BlogCategoryFilter.test.ts` | 18 |
| `BlogCard.test.ts` | 24 |
| `BlogList.test.ts` | 28 |
| `BlogArticle.test.ts` | 34 |

---

### 5.8. Directorio de Tiendas Pet-Friendly (RF-700 a RF-709) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ MVP público implementado
- ✅ Directorio público de tiendas (searchable, filtro por categoría y ciudad)
- ✅ Sección "Tiendas Destacadas" (`plan === 'featured'`) separada, oculta al filtrar
- ✅ Detalle de tienda (horario por día, contacto seguro, placeholder de mapa)
- ✅ Foto con validación `isSafeImageUrl`, fallback emoji 🏪
- ✅ Badges de verificación y destaque
- ✅ Skeleton loading y empty states en todas las vistas
- ✅ Store-first lookup en `fetchPetshopById` (evita llamadas redundantes a la API)
- 📋 Mapa interactivo (post-MVP — Google Maps / Leaflet)
- 📋 Perfil editable para dueños de tiendas (PRO)

**Feature path:** `app/features/petshops/` (nombre `petshops` para evitar conflicto con el concepto `stores` de Pinia)

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `PetshopCard` | `app/features/petshops/components/PetshopCard.vue` | Foto/fallback 🏪, badges verificado/destacado, chips de categoría (max 3 + overflow), contacto seguro (tel:/mailto:/https:), `stretched-link` |
| `PetshopList` | `app/features/petshops/components/PetshopList.vue` | Grid 1/2/3 col, búsqueda + filtro categoría + filtro ciudad, sección "Tiendas Destacadas" (oculta si filtros activos), skeleton 6 cards, empty states |
| `PetshopDetail` | `app/features/petshops/components/PetshopDetail.vue` | Hero 16/9, tabla de horarios con "Cerrado", contacto sanitizado, placeholder mapa si lat+lng presente, back button |

**Composable:** `features/petshops/composables/usePetshops.ts`
— `fetchPetshops(filters?)`: GET `/api/stores` con query params opcionales, soporta ambas formas de respuesta. `fetchPetshopById(id)`: store-first lookup antes de llamar a la API.

**Tipos:** `features/petshops/types/index.ts`
— `Petshop.plan` tipado como union: `'free' | 'featured' | ''` (no `string` genérico)

**Store:** `features/petshops/stores/petshops.store.ts` — `usePetshopsStore`
— `petshops[]`, `selectedPetshop`, `storeProducts[]`, `isLoading`. Getters: `hasPetshops`, `getPremiumPetshops` (filtra `plan === 'featured'` — excluye `'free'` y `''`). Acciones: `setPetshops`, `addPetshop`, `setSelectedPetshop`, `clearSelectedPetshop`, `setStoreProducts`, `clearStoreProducts`, `setLoading`, `clearPetshops`.

**Páginas:** ✅ Todas implementadas (thin wrappers públicos sin middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/stores` | `app/pages/stores/index.vue` | Directorio de tiendas pet-friendly |
| `/stores/[id]` | `app/pages/stores/[id].vue` | Detalle de tienda |

**Endpoints:** `GET /api/stores`, `GET /api/stores/:id`

**AppNavbar:** ✅ Enlace "Tiendas" agregado a `publicLinks` (visible sin autenticación)

**Security:** ✅ Completado — mismo patrón que shelters
- `isSafeImageUrl` en todos los bindings de `photo_url`
- `safeWebsiteUrl` computed restringe href a `http:`/`https:` (previene `javascript:` URI injection)
- `safePhone` regex `/^[+\d\s\-().]{4,25}$/` guarda `tel:` hrefs
- `safeEmail` regex guarda `mailto:` hrefs
- `petshopId` del route param validado con `/^[\w-]{1,64}$/` antes de usar en path de API
- Sin `v-html` en ningún componente

**Cross-store cleanup:** No requerido — datos públicos sin contenido específico del usuario. `clearPetshops()` disponible para usos futuros.

**Test coverage:** ✅ 203 tests
| Archivo | Tests |
|---|---|
| `petshops.store.test.ts` | 49 |
| `usePetshops.test.ts` | 45 |
| `PetshopCard.test.ts` | 29 |
| `PetshopList.test.ts` | 38 |
| `PetshopDetail.test.ts` | 42 |

---

### 5.9. Monetización (RF-800 a RF-809) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ MVP implementado
- ✅ Planes PRO definidos como constantes en frontend (`PRO_PLANS` en `types/index.ts`)
- ✅ Checkout PayU Latam: `subscribe(plan)` llama `POST /api/users/:id/subscribe`, recibe `checkout_url`, redirige via hidden form POST a PayU (HTTPS guard)
- ✅ Donaciones a refugios (`donate(shelterId: number, data)`) con importes preset + libre, mensaje opcional
- ✅ Tabla de precios pública en `/pricing`
- ✅ `ProBanner` inline para gates de funciones PRO
- ✅ Badge "Hazte PRO" en navbar para usuarios autenticados no-PRO
- ✅ Badge "PRO ✓" en navbar para usuarios PRO
- 📋 Tiendas y refugios destacados (is_featured ya modelado en petshops/shelters slices)
- 📋 Webhooks PayU (responsabilidad del backend)

**Feature path:** `app/features/pro/`

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `ProBanner` | `app/features/pro/components/ProBanner.vue` | Banner inline para features PRO. Props: `featureName?`, `compact?`. Emite `upgrade` / `close`. Muestra CTA de login a usuarios no autenticados |
| `ProUpgradeModal` | `app/features/pro/components/ProUpgradeModal.vue` | Modal Bootstrap v-model. Selección mensual/anual con badge de ahorro. "Continuar al pago" llama `subscribe(plan)`. Planes son constantes (`PRO_PLANS`) |
| `PricingTable` | `app/features/pro/components/PricingTable.vue` | 3 columnas: Free / PRO Mensual / PRO Anual. Features list, badge "Más popular", "Plan activo ✓" para PRO. Emite `select-plan(planId)` |
| `DonationForm` | `app/features/pro/components/DonationForm.vue` | Props: `shelterId` (number), `shelterName`. Importes preset (5k/10k/25k/50k COP) + libre. Mensaje 200 chars. Envuelto en `<ClientOnly>`. Success state → `isRedirecting` con "Redirigiendo al pago..." + spinner |
| `PaymentCheckout` | `app/features/pro/components/PaymentCheckout.vue` | Display puro: `status: 'success' \| 'canceled' \| 'pending'`. Alerta verde / amarilla / spinner |

**Composable:** `features/pro/composables/usePro.ts`
— `fetchSubscription()`: 404 → null silencioso (no error). `subscribe(plan: PlanValue)`: POST `/api/users/:id/subscribe`, guard HTTPS en `checkout_url`, redirige via hidden form POST a PayU Latam. `donate(shelterId: number, data: DonationRequest)`: POST `/api/shelters/:id/donate` — valida `shelterId` como entero positivo (`typeof number && > 0 && isInteger`).

**Store:** `features/pro/stores/pro.store.ts` — `useProStore`
— `subscription`, `isLoading`. Getters: `isSubscribed` (status === 'active'). Acciones: `setSubscription`, `clearSubscription`, `setLoading`, `clearPro`.

**Páginas:** ✅ Todas implementadas
| Ruta | Archivo | Middleware | Descripción |
|---|---|---|---|
| `/pricing` | `app/pages/pricing/index.vue` | ninguno | Tabla de precios pública + modal de upgrade |
| `/dashboard/subscription` | `app/pages/dashboard/subscription/index.vue` | `auth` | Gestión de suscripción: ver plan, cancelar, upgrade. Lee `?checkout` query param |

**AppNavbar:** ✅ Actualizado
- "Precios" agregado a `publicLinks`
- "Hazte PRO" (btn-warning) visible para autenticados no-PRO
- Badge "PRO ✓" visible para usuarios con `authStore.isPro`

**Endpoints:** `GET /api/users/:id/subscription`, `POST /api/users/:id/subscribe`, `POST /api/shelters/:id/donate`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `proStore.clearPro()` — subscription es dato específico del usuario.

**Security:** ✅ Completado — rating LOW post-review
- ✅ Fijo (HIGH): `shelterId` validado como entero positivo (`typeof number && > 0 && Number.isInteger`) en `donate()` — previene interpolación de valores inválidos en path de API
- ✅ Fijo (PASS): Guard HTTPS en `checkout_url` (`new URL().protocol === 'https:'`) antes de redirect a PayU — previene open redirect
- ✅ `import.meta.client` guard en `subscribe` (accede a `document` para crear form)
- ✅ Sin `v-html` en ningún componente
- ✅ Validación de importe en `DonationForm` (> 0 y ≤ 10,000,000) — backend también debe validar
- ✅ Bootstrap Modal instanciado solo en cliente (lazy import de bootstrap)
- ✅ `proStore.clearPro()` integrado en `clearSession()` — evita leakage de datos de suscripción en dispositivos compartidos
- 📋 Reportado (LOW): `proStore` expuesto directamente en return de `usePro()` — refactor a computed refs en sprint futuro

**Test coverage:** ✅ 157 tests
| Archivo | Tests |
|---|---|
| `pro.store.test.ts` | 24 |
| `usePro.test.ts` | 38 |
| `ProBanner.test.ts` | 23 |
| `PricingTable.test.ts` | 16 |
| `ProUpgradeModal.test.ts` | 19 |
| `DonationForm.test.ts` | 37 |

---

### 5.10. Clínicas Veterinarias (RF-900 a RF-909) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ MVP implementado
- ✅ Directorio público de clínicas veterinarias cargado desde API
- ✅ Filtros client-side: búsqueda por nombre/dirección, especialidad y ciudad
- ✅ Sección "Clínicas Destacadas" (is_featured) oculta cuando hay filtros activos
- ✅ Perfil completo de clínica: foto hero 16:9, especialidades, horario semanal, contacto, mapa placeholder
- ✅ Store-first lookup en `fetchClinicById` (sin network call si ya está en caché)
- ✅ Soporte dual API shape: envelope `{ clinics: [] }` y array directo
- ✅ Skeleton loading (6 tarjetas) en ClinicList; skeleton de perfil en ClinicDetail
- ✅ Estados vacíos con ilustración animada (sin resultados, sin clínicas)
- ✅ Contador de resultados singular/plural ("1 clínica encontrada" / "N clínicas encontradas")
- ✅ Badges de verificación (✓ Verificada) y destacado (⭐ Destacada)
- ✅ Link "Clínicas" en AppNavbar (publicLinks)
- 📋 Agenda online (sprint futuro)
- 📋 Perfil editable PRO (sprint futuro)
- 📋 Vinculación mascota ↔ clínica (sprint futuro)

**Feature path:** `app/features/clinics/`

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `ClinicCard` | `app/features/clinics/components/ClinicCard.vue` | Tarjeta de clínica con foto (🏥 fallback), specialties chips (máx 3 + overflow "+N"), badges verificada/destacada, contacto con guards de seguridad, stretched-link "Ver clínica" |
| `ClinicList` | `app/features/clinics/components/ClinicList.vue` | Directorio completo: filtros search/especialidad/ciudad, sección destacadas, grid de tarjetas, skeleton 6-cards, dos estados vacíos, contador de resultados |
| `ClinicDetail` | `app/features/clinics/components/ClinicDetail.vue` | Perfil completo: banner 16:9, especialidades, tabla de horario semanal ("Cerrado" para días sin horario), datos de contacto, mapa placeholder (cuando hay coordenadas), botón "Visitar sitio web" |

**Composable:** `features/clinics/composables/useClinics.ts`
— `fetchClinics(filters?)`: GET `/api/clinics`, construye URLSearchParams de filtros no vacíos, soporta envelope `{ clinics: [] }` y array directo. `fetchClinicById(id)`: store-first lookup (cache hit evita network), luego GET `/api/clinics/${id}`.

**Store:** `features/clinics/stores/clinics.store.ts` — `useClinicsStore`
— `clinics[]`, `selectedClinic`, `isLoading`. Getters: `hasClinics` (array.length > 0), `getFeaturedClinics` (filtra `is_featured === true`). Acciones: `setClinics`, `addClinic` (unshift — newest-first), `setSelectedClinic`, `clearSelectedClinic`, `setLoading`, `clearClinics`.

**Páginas:** ✅ Todas implementadas
| Ruta | Archivo | Middleware | Descripción |
|---|---|---|---|
| `/clinics` | `app/pages/clinics/index.vue` | ninguno | Directorio de clínicas veterinarias (público) |
| `/clinics/:id` | `app/pages/clinics/[id].vue` | ninguno | Perfil de clínica (público) |

**AppNavbar:** ✅ Actualizado
- "Clínicas" agregado a `publicLinks` (entre "Tiendas" y "Precios")

**Endpoints:** `GET /api/clinics`, `GET /api/clinics/:id`

**Cross-store cleanup:** No aplica — datos públicos, sin contenido específico del usuario. `useClinicsStore` NO se integra en `clearSession()`.

**Security:** ✅ Completado — rating LOW post-review
- ✅ `isSafeImageUrl()` guard en `photo_url` (ClinicCard y ClinicDetail) — previene binding de URLs `data:` o `javascript:`
- ✅ `safeWebsiteUrl` computed restringe href externo a `http:`/`https:` únicamente — previene URI `javascript:` en "Visitar sitio web"
- ✅ `safePhone` regex `/^[+\d\s\-().]{4,25}$/` valida hrefs `tel:` antes de renderizar
- ✅ `safeEmail` regex valida hrefs `mailto:` antes de renderizar
- ✅ `clinicId` validado con `/^[\w-]{1,64}$/` en ClinicDetail antes de interpolación en path de API — previene path traversal
- ✅ Sin `v-html` en ningún componente — `clinic.description` renderizado como texto plano con `white-space: pre-line`
- ✅ SSR-safe: sin acceso a `window`/`document`. Fechas vía `Intl.DateTimeFormat`. Sin `import.meta.client` necesario (no hay operaciones cliente-exclusivas)

**Test coverage:** ✅ 186 tests
| Archivo | Tests |
|---|---|
| `clinics.store.test.ts` | 43 |
| `useClinics.test.ts` | 36 |
| `ClinicCard.test.ts` | 36 |
| `ClinicList.test.ts` | 30 |
| `ClinicDetail.test.ts` | 41 |

---

### 5.11. Panel Administrativo (RF-1000 a RF-1009) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ Dashboard de admin con 8 KPIs (usuarios, mascotas, refugios, clínicas, tiendas, adopciones, suscripciones PRO, donaciones) + ingresos COP
- ✅ Gestión de usuarios: tabla paginada + búsqueda + filtros PRO/Admin + toggle PRO/Admin + eliminación en 2 pasos + protección contra auto-democión
- ✅ Gestión de refugios: tabla + toggle Verificado/Destacado + eliminación en 2 pasos
- ✅ Gestión de tiendas: tabla + toggle Verificado/Destacado + eliminación en 2 pasos
- ✅ Gestión de clínicas: tabla + especialidades chips + toggle Verificado/Destacado + eliminación en 2 pasos
- ✅ Logs de transacciones: historial de pagos/donaciones con tipo/estado badges, solo lectura

**Feature path:** `app/features/admin/`

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `AdminDashboard` | `app/features/admin/components/AdminDashboard.vue` | 8 KPI cards en 2 filas, ingresos COP formateados, quick-nav links, skeleton 8-cards, retry en error |
| `AdminUserManager` | `app/features/admin/components/AdminUserManager.vue` | Tabla paginada, búsqueda debounced, filtros PRO/Admin, toggle PRO/Admin, 2-step delete, self-protection guard (`isSelf()`) |
| `AdminShelterManager` | `app/features/admin/components/AdminShelterManager.vue` | Tabla con pets_count, toggle Verificado/Destacado, 2-step delete |
| `AdminStoreManager` | `app/features/admin/components/AdminStoreManager.vue` | Tabla, toggle Verificado/Destacado, 2-step delete |
| `AdminClinicManager` | `app/features/admin/components/AdminClinicManager.vue` | Tabla con specialty chips (máx 2 + overflow), toggle Verificado/Destacado, 2-step delete |
| `AdminTransactionLog` | `app/features/admin/components/AdminTransactionLog.vue` | Log de lectura: type badges (subscription=primary/donation=success), status badges (4 variantes), paginación |

**Composable:** `features/admin/composables/useAdmin.ts`
— Funciones: `fetchStats`, `fetchUsers`, `grantPro(id, plan)`, `revokePro(id)`, `grantAdmin(id)`, `revokeAdmin(id)`, `activateUser(id)`, `deactivateUser(id)`, `fetchShelters`, `verifyShelter(id)`, `updateShelterPlan(id, plan)`, `fetchPetshops`, `verifyPetshop(id)`, `updatePetshopPlan(id, plan)`, `fetchAdminClinics`, `verifyClinic(id)`, `updateClinicPlan(id, plan)`, `fetchTransactions`, `fetchDonations`. Dual API shapes en todos los fetches. No hay PUT/DELETE genéricos — todas las mutaciones usan endpoints PATCH específicos (`grant-pro`, `revoke-pro`, `grant-admin`, `revoke-admin`, `activate`, `deactivate`, `verify`, `plan`). IDs son `number`.

**Store:** `features/admin/stores/admin.store.ts` — `useAdminStore`
— `stats`, `users[]`, `shelters[]`, `petshops[]`, `clinics[]`, `transactions[]`, `selectedUser`, `isLoading`, 5 total-count refs. Getters: `hasStats`, `hasUsers`. Acciones CRUD por entidad + `clearAdmin()`.

**Middleware:**
```typescript
// app/middleware/admin.ts — doble check: isAuthenticated + isAdmin
// No autenticado → /login
// Autenticado sin admin → / (403 redirect)
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) return navigateTo('/login')
  if (!authStore.isAdmin) return navigateTo('/')
})
```

**Páginas:** ✅ Todas implementadas (thin wrappers con `admin` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/admin` | `app/pages/admin/index.vue` | Dashboard con KPIs |
| `/admin/users` | `app/pages/admin/users/index.vue` | Gestión de usuarios |
| `/admin/shelters` | `app/pages/admin/shelters/index.vue` | Gestión de refugios |
| `/admin/stores` | `app/pages/admin/stores/index.vue` | Gestión de tiendas |
| `/admin/clinics` | `app/pages/admin/clinics/index.vue` | Gestión de clínicas |
| `/admin/stats` | `app/pages/admin/stats.vue` | Vista de estadísticas |

**AppNavbar:** ✅ Actualizado
- Botón "⚙️ Admin" visible solo para `authStore.isAdmin` (en área autenticada, antes del badge PRO)

**Endpoints:**
- `GET /api/admin/stats` — KPIs overview
- `GET /api/admin/users?search=&limit=&offset=` — listado paginado
- `PATCH /api/admin/users/:id/grant-pro`, `PATCH /api/admin/users/:id/revoke-pro`
- `PATCH /api/admin/users/:id/grant-admin`, `PATCH /api/admin/users/:id/revoke-admin`
- `PATCH /api/admin/users/:id/activate`, `PATCH /api/admin/users/:id/deactivate`
- `GET /api/admin/shelters`, `PATCH /api/admin/shelters/:id/verify`, `PATCH /api/admin/shelters/:id/plan`
- `GET /api/admin/stores`, `PATCH /api/admin/stores/:id/verify`, `PATCH /api/admin/stores/:id/plan`
- `GET /api/admin/clinics`, `PATCH /api/admin/clinics/:id/verify`, `PATCH /api/admin/clinics/:id/plan`
- `GET /api/admin/transactions`, `GET /api/admin/donations`

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `adminStore.clearAdmin()` — datos de admin son específicos de la sesión (lista de usuarios, stats, etc.).

**Security:** ✅ Completado — rating LOW post-review
- ✅ Doble-gate middleware: `isAuthenticated` + `isAdmin` (no basta con solo `isAdmin`)
- ✅ Validación de IDs antes de interpolación en paths de API (previene path traversal)
- ✅ Sin `v-html` — todo el PII (email, nombre, teléfono) renderizado via `{{ }}` text interpolation
- ✅ Auto-democión protegida: `isSelf()` guard desactiva "Quitar Admin" y "Eliminar" en la fila propia del admin logueado
- ✅ SSR-safe: datos en `onMounted`, `Intl` formatters sin acceso a `window`/`document`
- ✅ `clearAdmin()` en `clearSession()` previene data leakage en dispositivos compartidos
- 📋 Reportado (MEDIUM): Backend debe validar `is_admin === true` en JWT claims en cada endpoint `/api/admin/**`
- 📋 Reportado (LOW): IDOR en operaciones de toggle — el frontend no puede prevenir raw HTTP requests; el backend es la autoridad

**Test coverage:** ✅ 330 tests
| Archivo | Tests |
|---|---|
| `admin.store.test.ts` | 60 |
| `useAdmin.test.ts` | 85 |
| `admin.test.ts` (middleware) | 7 |
| `AdminDashboard.test.ts` | 28 |
| `AdminUserManager.test.ts` | 34 |
| `AdminShelterManager.test.ts` | 27 |
| `AdminStoreManager.test.ts` | 27 |
| `AdminClinicManager.test.ts` | 34 |
| `AdminTransactionLog.test.ts` | 28 |

---

### 5.12. Estadísticas y Métricas (RF-1100 a RF-1109) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ Resumen general de KPIs: 10 métricas (usuarios, mascotas, refugios, clínicas, tiendas, adopciones, suscripciones PRO, donaciones, ingresos del mes, ingresos totales)
- ✅ Métricas de revenue por fuente (PRO vs donaciones) en gráfico y tabla
- ✅ Gráfico de ingresos por mes (CSS progress bars, sin dependencias externas, métrica seleccionable: total / suscripciones / donaciones)
- ✅ Tabla de ingresos mensual con totales acumulados (COP formateado)
- ✅ Skeleton loading en los 3 componentes
- ✅ Empty states + retry en StatsOverview
- ✅ Dual API response shape en los 2 endpoints (array directo y envelope)
- ✅ SSR-safe: datos en `onMounted`, `Intl` formatters sin `window`
- ✅ Overview con estructura nested del backend: `overview.users.total`, `overview.content.total_pets`, `overview.revenue_cop.in_period`, etc.

**Feature path:** `app/features/stats/`

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `StatsOverview` | `app/features/stats/components/StatsOverview.vue` | 8 KPI cards de conteo + 2 cards de ingresos COP; skeleton 8+2; empty state con retry; auto-fetch en onMounted |
| `StatsChart` | `app/features/stats/components/StatsChart.vue` | Gráfico de barras horizontal con CSS progress bars; métricas: total, suscripciones, donaciones; skeleton 6 filas |
| `RevenueReport` | `app/features/stats/components/RevenueReport.vue` | Tabla mensual con badges (bg-info suscripciones, bg-success donaciones); fila de totales acumulados en tfoot; skeleton 6 filas |

**Composable:** `features/stats/composables/useStats.ts`
— `fetchOverview()`: GET `/api/admin/stats`, dual API shape, usa `statsStore.isLoading`. Overview es nested: `StatsOverview` contiene `users`, `content`, `services`, `revenue_cop` sub-objetos. `fetchRevenueData(filters?)`: GET `/api/admin/stats/revenue?months=N`, dual API shape, usa `revenueLoading` ref local. Revenue response contiene `data[]` (time series) y `stats` (RevenueStats: totals, averages).

**Store:** `features/stats/stores/stats.store.ts` — `useStatsStore`
— `overview`, `revenueData[]`, `revenueStats`, `isLoading`. Getters: `hasOverview`, `hasRevenueData`, `hasRevenueStats`. Acciones: `setOverview`, `setRevenueData`, `setRevenueStats`, `setLoading`, `clearStats`.

**Página:** ✅ Actualizada (thin wrapper con `admin` middleware)
| Ruta | Archivo | Descripción |
|---|---|---|
| `/admin/stats` | `app/pages/admin/stats.vue` | Orquesta los 3 componentes; fetcha revenue en onMounted y pasa como props a StatsChart y RevenueReport; StatsOverview se auto-fetcha |

**Endpoints:**
- `GET /api/admin/stats` — overview KPIs nested (compartido con admin slice)
- `GET /api/admin/stats/revenue?months=N` — time series mensual de ingresos + stats acumulados

**Cross-store cleanup:** ✅ `clearSession()` en `auth.store.ts` llama `statsStore.clearStats()` — datos admin son específicos de la sesión.

**Security:** ✅ SSR-safe; sin `v-html`; sin ID del usuario en paths de API; datos de solo lectura (sin acciones destructivas).

**Test coverage:** ✅ 117 tests
| Archivo | Tests |
|---|---|
| `stats.store.test.ts` | 31 |
| `useStats.test.ts` | 25 |
| `StatsOverview.test.ts` | 26 |
| `StatsChart.test.ts` | 14 |
| `RevenueReport.test.ts` | 21 |

---

### 5.13. Sistema de Mantenimiento (RF-1200 a RF-1209) — ✅ IMPLEMENTADO

**Funcionalidades:** ✅ Todas implementadas
- ✅ Bandera de mantenimiento controlable desde admin (toggle con confirmación en 2 pasos)
- ✅ Página de mantenimiento (`/maintenance`) accesible y con soporte de mensaje personalizado
- ✅ Redirección automática vía header `x-maintenance: true` en cualquier respuesta de API
- ✅ Middleware global que redirige a `/maintenance` cuando está activo (bypass para admins)
- ✅ Redirect inverso: si mantenimiento termina y el usuario está en `/maintenance`, redirige a `/`
- ✅ Widget `MaintenanceToggle` en `AdminDashboard` con skeleton, estado vacío, metadatos y vista previa del mensaje
- ✅ Soporte dual API shapes en `fetchStatus()` y `toggleMaintenance()`
- ✅ SSR-safe: header check en `useApi.ts` guardado con `import.meta.client`
- ✅ Diseño accesible: `role="main"`, jerarquía de headings, aria-labels, foco visible

**Feature path:** `app/features/maintenance/`

**Componentes Frontend:** ✅ Todos implementados
| Componente | Ubicación | Descripción |
|---|---|---|
| `MaintenancePage` | `app/features/maintenance/components/MaintenancePage.vue` | Página completa centrada con 🔧, título "En mantenimiento", subtítulo (prop `message?` con fallback por defecto), botón "Volver al inicio" (NuxtLink to="/") |
| `MaintenanceToggle` | `app/features/maintenance/components/MaintenanceToggle.vue` | Widget de admin para togglear mantenimiento: badge Activo/Inactivo, confirmación en 2 pasos inline (con formulario de mensaje + estimated_return al activar), metadatos `activated_by_admin_id`/`activated_at` (Intl formatado), preview del mensaje actual, skeleton loading, empty state con Reintentar |

**Composable:** `features/maintenance/composables/useMaintenance.ts`
— `fetchStatus()`: GET `/api/admin/maintenance`, dual API shapes, **falla silenciosamente** (no setea `error.value`) — endpoint es admin-only, usuarios no-admin no deben ver 403. `activateMaintenance(request: { message, estimated_return? })`: PATCH `/api/admin/maintenance/activate`. `deactivateMaintenance()`: PATCH `/api/admin/maintenance/deactivate` (sin body). Ambos superfician errores. Returns: `{ error, maintenanceStore, fetchStatus, activateMaintenance, deactivateMaintenance }`.

**Store:** `features/maintenance/stores/maintenance.store.ts` — `useMaintenanceStore`
— `status` (MaintenanceStatus | null), `isLoading`. Getters: `isEnabled` (computed: `status?.is_active ?? false` — default `false` para renderizar normalmente antes del primer fetch), `hasStatus` (computed: `status !== null`). Acciones: `setStatus`, `setLoading`, `clearMaintenance`. Campos de `MaintenanceStatus`: `is_active`, `message`, `activated_at`, `activated_by_admin_id`, `estimated_return` (ISO-8601 opcional).

> **Nota crítica:** `useMaintenanceStore` **NO se agrega** a `clearSession()` en `auth.store.ts`. El estado de mantenimiento es una bandera global de plataforma, no dato específico del usuario. Persiste entre sesiones intencionalmente.

**Middleware:** `app/middleware/maintenance.ts` — middleware **global** (default export → Nuxt lo registra automáticamente en todas las rutas)
```typescript
// Lógica:
// 1. Admin users → bypass completo (siempre pueden acceder al admin panel)
// 2. isEnabled && !isMaintenancePage → navigateTo('/maintenance')
// 3. !isEnabled && isMaintenancePage → navigateTo('/') (mantenimiento terminó)
// 4. Resto → pass-through (undefined)
```

**Página:** `app/pages/maintenance.vue`
— Thin wrapper. **Sin middleware** (aplicar cualquier middleware podría crear redirect loops). `useHead` con `title` y `robots: noindex, nofollow`. Lee `maintenanceStore.status?.message` y lo pasa como prop a `MaintenancePage`.

**Integración con `useApi.ts` y `useExportPDF.ts`:** ✅ Updated
— `onResponseCheck()` hook agregado a todos los métodos `$fetch` en `useApi.ts` (GET, POST, PUT, PATCH, DELETE) **y** en `useExportPDF.ts` (blob download). Guardado con `import.meta.client`. Si `response.headers.get('x-maintenance') === 'true'`: llama `maintenanceStore.setStatus({ is_active: true })` y `navigateTo('/maintenance')`. Detección pasiva y reactiva sin polling.

**Integración con `AdminDashboard.vue`:** ✅ Updated
— `<MaintenanceToggle />` agregado en sección "Sistema" dentro del bloque `v-else-if="adminStore.hasStats"`, entre las revenue cards y la navegación rápida. Auto-contenido.

**`nuxt.config.ts`:** ✅ Updated
— `'/maintenance': { cache: false }` — previene que CDN o browser sirvan la página de mantenimiento desde caché cuando el admin la desactiva.

**Endpoints:**
- `GET /api/admin/maintenance` — estado actual de mantenimiento (solo admin)
- `PATCH /api/admin/maintenance/activate` — activar modo mantenimiento (body: `{ message, estimated_return? }`)
- `PATCH /api/admin/maintenance/deactivate` — desactivar modo mantenimiento (sin body)

**Cross-store cleanup:** No aplica — datos de plataforma, no específicos del usuario. `clearMaintenance()` disponible para uso futuro.

**Security:** ✅ Completado
- ✅ `import.meta.client` guard en el hook de header — previene redirect SSR indeseados
- ✅ Middleware con bypass completo para admins — nunca se les bloquea el acceso al panel
- ✅ Sin `v-html` en ningún componente
- ✅ SSR-safe: no `window`/`document` en ningún componente
- ✅ `/maintenance` sin cache — usuarios ven el estado live inmediatamente al restaurar servicio

**Test coverage:** ✅ 187 tests
| Archivo | Tests |
|---|---|
| `maintenance.store.test.ts` | 33 |
| `useMaintenance.test.ts` | 47 |
| `MaintenancePage.test.ts` | 18 |
| `MaintenanceToggle.test.ts` | 65 |
| `maintenance.test.ts` (middleware) | 24 |

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
export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  // Lee el token directamente de localStorage para cada request
  function getHeaders(): Record<string, string> {
    const token = localStorage.getItem('mopetoo_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Detección pasiva de mantenimiento en cada respuesta
  function onResponseCheck({ response }: { response: Response }): void {
    if (!import.meta.client) return
    if (response.headers.get('x-maintenance') === 'true') {
      const maintenanceStore = useMaintenanceStore()
      maintenanceStore.setStatus({ is_active: true })
      navigateTo('/maintenance')
    }
  }

  async function get<T>(endpoint: string): Promise<T> {
    return $fetch<T>(`${baseURL}${endpoint}`, {
      method: 'GET', headers: getHeaders(), onResponse: onResponseCheck,
    })
  }

  async function post<T>(endpoint: string, body: unknown): Promise<T> { /* ... */ }
  async function put<T>(endpoint: string, body: unknown): Promise<T> { /* ... */ }
  async function patch<T>(endpoint: string, body: unknown): Promise<T> { /* ... */ }
  async function del<T>(endpoint: string): Promise<T> { /* ... */ }

  return { get, post, put, patch, del }
}
```

### 7.2. Uso en Composables

```typescript
const { get, post, patch, del } = useApi()

// GET
const pets = await get<Pet[]>('/api/pets')

// POST
const pet = await post<Pet>('/api/pets', { name: 'Fluffy', species: 'cat' })

// PATCH
const updated = await patch<Pet>(`/api/pets/${id}`, { name: 'Fluff' })

// DELETE
await del<void>(`/api/pets/${id}`)

// FormData (multipart) — $fetch directo con Bearer token
const formData = new FormData()
formData.append('photo', photoFile)
const pet = await $fetch<Pet>(`${baseURL}/api/pets`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})
```

### 7.3. Manejo de Errores — `extractErrorMessage`

Función centralizada en `features/shared/utils/extractErrorMessage.ts`, importada por **todos** los composables del proyecto (12 archivos):

```typescript
// app/features/shared/utils/extractErrorMessage.ts
export function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data)
        return String((data as { error: unknown }).error)
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string')
      return (err as { message: string }).message
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
```

Uso en composables:
```typescript
try {
  const pets = await get<Pet[]>('/api/pets')
  petsStore.setPets(pets)
} catch (err: unknown) {
  error.value = extractErrorMessage(err)
}
```

### 7.4. Detección de Mantenimiento

Tanto `useApi.ts` como `useExportPDF.ts` incluyen `onResponseCheck` en todas sus llamadas a `$fetch`. Si el backend responde con header `x-maintenance: true`, el frontend automáticamente:
1. Setea `maintenanceStore.status.is_active = true`
2. Redirige a `/maintenance`

Guardado con `import.meta.client` para evitar redirects SSR indeseados.

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
  const currentEntity = ref<AuthEntity | null>(null)
  const entityType = ref<EntityType | null>(null) // 'user' | 'shelter' | 'store' | 'clinic'
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isPro = computed(() => currentEntity.value?.is_pro ?? false)
  const isAdmin = computed(() => currentEntity.value?.is_admin ?? false)

  const setSession = (data: LoginResponse) => {
    currentEntity.value = data.user ?? data.shelter ?? data.store ?? data.clinic
    entityType.value = data.entity_type ?? 'user'
    token.value = data.token
    localStorage.setItem('mopetoo_token', data.token)
  }

  const setEntity = (entity: AuthEntity, type: EntityType) => {
    currentEntity.value = entity
    entityType.value = type
  }

  const clearSession = () => {
    currentEntity.value = null
    entityType.value = null
    token.value = null
    localStorage.removeItem('mopetoo_token')
    // Limpia stores de usuario: pets, reminders, medical, shelters, pro, admin, stats
  }

  return { currentEntity, entityType, token, isAuthenticated, isPro, isAdmin, setSession, setEntity, clearSession, /* ... */ }
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
- [x] Stack tecnológico especificado (Nuxt 4, Vue 3, Pinia, $fetch/ofetch, Bootstrap 5)
- [x] Rutas públicas y protegidas mapeadas
- [x] Composables y stores pattern establecido
- [x] SEO strategy con SSR, meta tags, schema.org
- [x] HTTP client (useApi) pattern con soporte multipart, detección de mantenimiento, extractErrorMessage centralizado
- [x] Variables de entorno (.env, .env.example, nuxt.config runtimeConfig)
- [x] State management (Pinia) structure con persistencia token
- [x] Development workflow documentado
- [x] Vitest + @nuxt/test-utils configurado (vitest.config.ts, globals: true)
- [x] Security headers baseline (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

### Funcionalidades Implementadas
- [x] **RF-001 a RF-009 — Gestión de Usuarios (Auth slice)**
  - Store (`auth.store.ts`): multi-entity (user/shelter/store/clinic), persistencia localStorage, computed properties
  - Composable (`useAuth.ts`): login, register (4 entity types), logout, password reset, multi-entity profile update/delete, JWT user_id normalization
  - Components: LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, UserProfileForm, UserProfilePicture
  - Middleware: auth (protege /dashboard/**), guest (protege /login, /register)
  - Plugin: auth.client.ts (restaura sesión en boot)
  - Test coverage: 90 tests (store 42, composable 40, middleware 8)
  - Security review: 3 fixes aplicados, rating MEDIUM

### Próximas implementaciones
- [x] RF-100 a RF-109 — Gestión de mascotas (pets slice) ✅
- [x] RF-200 a RF-209 — Recordatorios (reminders slice) ✅
- [x] RF-300 a RF-309 — Historial médico (medical slice) ✅
- [x] RF-400 a RF-409 — Exportación y PDF (export slice) ✅
- [x] RF-500 a RF-509 — Refugios y adopciones (shelters slice) ✅
- [x] RF-600 a RF-609 — Blog editorial (blog slice) ✅
- [x] RF-700 a RF-709 — Directorio tiendas pet-friendly (petshops slice) ✅
- [x] RF-800 a RF-809 — Monetización / PRO subscriptions (pro slice) ✅
- [x] RF-900 a RF-909 — Clínicas veterinarias (clinics slice) ✅
- [x] RF-1000 a RF-1009 — Panel administrativo (admin slice) ✅
- [x] RF-1100 a RF-1109 — Estadísticas y métricas (stats slice) ✅
- [x] RF-1200 a RF-1209 — Sistema de mantenimiento (maintenance slice) ✅
- [ ] Content Security Policy (CSP) implementation
- [ ] Multi-language support (@nuxtjs/i18n)

---

**Versión:** 1.1 | **Fecha:** 2026-03-01 | **Autor:** Claude Code
**Cambios v1.1:** Sincronización completa con backend Go+Gin — multi-entity auth, JWT user_id number, IDs normalizados (reminders), PayU Latam (reemplaza Stripe), extractErrorMessage centralizado, detección de mantenimiento en useExportPDF, PATCH endpoints en admin/maintenance, plan union type en petshops, donate(number) en pro, ActivityLog removido (endpoint fabricado). 2377 tests passing.
**Próximas actualizaciones:** CSP implementation, multi-language support (@nuxtjs/i18n)
