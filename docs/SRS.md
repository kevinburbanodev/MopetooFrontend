# **📘 Documento de Requerimientos de Software (SRS) - ACTUALIZADO**

## **Proyecto: Mopetoo**

> **Nota de actualización:** La base de datos pasa de PostgreSQL nativo (self-hosted) a **Supabase (PostgreSQL gestionado)**. El sistema de migraciones Go existente se mantiene — Supabase es PostgreSQL compatible, por lo que no requiere cambios en el código de migraciones, solo en las variables de entorno de conexión.

> **Stack completo:** El sistema está compuesto por tres capas independientes que consumen la misma API REST:
> - **Backend Go + Gin** — este repositorio, API REST.
> - **Frontend web en Nuxt.js** — aplicación web SSR/SSG (repositorio separado), consumo completo de la API con SEO optimizado para el blog público y dashboard de usuario.
> - **App móvil en Flutter** — aplicación nativa para iOS y Android (repositorio separado), consumo completo de la API.

---

## **📊 Estado General del Proyecto — MVP Completo ✅**

| Sección | Estado |
|---------|--------|
| 5.1 — Gestión de Usuarios | ✅ IMPLEMENTADO |
| 5.2 — Gestión de Mascotas | ✅ IMPLEMENTADO |
| 5.3 — Recordatorios | ✅ IMPLEMENTADO |
| 5.4 — Historial Médico | ✅ IMPLEMENTADO |
| 5.5 — Exportación y PDF | ✅ IMPLEMENTADO |
| 5.6 — Refugios y Adopciones | ✅ IMPLEMENTADO |
| 5.7 — Blog Editorial | ✅ IMPLEMENTADO |
| 5.8 — Tiendas Pet-Friendly | ✅ IMPLEMENTADO |
| 5.9 — Monetización (PRO, Donaciones, Publicidad) | ✅ IMPLEMENTADO |
| 5.10 — Clínicas Veterinarias | ✅ IMPLEMENTADO |
| 5.11 — Panel Administrativo | ✅ IMPLEMENTADO |
| 5.12 — Estadísticas y Métricas | ✅ IMPLEMENTADO |
| 5.13 — Sistema de Mantenimiento | ✅ IMPLEMENTADO |

**Total:** 13/13 módulos funcionales completamente implementados. **Proyecto MVP finalizado.**

---

## **1\. 🧭 Visión General del Proyecto**

**Mopetoo Cuidá a tus mascotas como nunca 🐾** es una plataforma multi-canal centrada en el cuidado de mascotas, diseñada para ayudar a los dueños a gestionar de forma simple, organizada y proactiva la salud y bienestar de sus animales de compañía. El sistema está compuesto por:

- **Backend API REST** — construido en **Go + Gin**, basado en principios de **DDD, arquitectura hexagonal y vertical slicing**. Es el núcleo del sistema y la única fuente de verdad de los datos.
- **Frontend web** — **Nuxt.js** (Vue 3, SSR/SSG), consumo completo de la API. Ofrece el portal público (blog, adopciones), el dashboard de usuario, directorio de tiendas y gestión de mascotas desde el navegador, con SSR/SSG para SEO.
- **App móvil** — **Flutter** (iOS + Android), experiencia nativa para la gestión diaria de mascotas, recordatorios y notificaciones push.

Las tres capas son repositorios independientes que se comunican únicamente a través de la API REST del backend.

---

## **2\. 🎯 Objetivos**

* Facilitar el seguimiento de información crítica de una o varias mascotas.

* Automatizar recordatorios importantes relacionados con vacunas, medicación o visitas médicas.

* Generar historial médico organizado, exportable y compartible.

* Monetizar mediante anuncios y funciones premium escalables.

* Sentar las bases para futuras funcionalidades avanzadas (IA, comunidad, red social de mascotas, etc.).

---

## **3\. 👥 Público Objetivo**

* Dueños de mascotas (perros, gatos, etc.).

* Veterinarios y clínicas veterinarias que deseen digitalizarse, captar clientes y ofrecer agenda online.

* Refugios y fundaciones de rescate animal que necesiten visibilidad y gestión de adopciones.

* Cuidadores, paseadores o rescatistas que deseen centralizar datos de animales a su cargo.

---

## **4\. 🧱 Alcance Inicial del MVP**

El MVP incluirá:

* ✅ **Registro y login de usuarios** (IMPLEMENTADO)
* ✅ **Recuperación de contraseña por email** (IMPLEMENTADO)
* ✅ **Registro de mascotas** (IMPLEMENTADO)
* ✅ **CRUD de recordatorios** (vacunas, medicamentos, baños) (IMPLEMENTADO)
* ✅ **CRUD de historial médico** (IMPLEMENTADO)
* ✅ **Exportación en PDF** del perfil e historial (IMPLEMENTADO)
* ✅ **Sistema PRO** — flag `is_pro` + endpoint de activación (IMPLEMENTADO)
* ✅ **Sistema de Refugios y Adopciones** — registro/login de refugios + listados de adopción + solicitudes (IMPLEMENTADO)
* ⏳ Monetización visual vía anuncios AdMob (mobile-side, PENDIENTE)

---

## **5\. 🔧 Requerimientos Funcionales**

### **5.1. Gestión de Usuarios** ✅ **IMPLEMENTADO**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-001 | El sistema debe permitir el **registro de nuevos usuarios** con nombre, apellido, país, ciudad, email, contraseña, código de país y teléfono. | ✅ **IMPLEMENTADO** |
| RF-002 | El sistema debe permitir el **login** mediante autenticación JWT. | ✅ **IMPLEMENTADO** |
| RF-003 | El sistema debe permitir la **recuperación de contraseña** por email con token seguro. | ✅ **IMPLEMENTADO** |
| RF-004 | El sistema debe permitir **reset de contraseña** usando el token recibido por email. | ✅ **IMPLEMENTADO** |
| RF-005 | El sistema debe permitir **subir foto de perfil** durante el registro. | ✅ **IMPLEMENTADO** |
| RF-006 | El sistema debe permitir **obtener información del usuario** (requiere autenticación). | ✅ **IMPLEMENTADO** |
| RF-007 | El sistema debe incluir **fecha de nacimiento** del usuario (opcional). | ✅ **IMPLEMENTADO** |

---

### **5.2. Gestión de Mascotas** ✅ **IMPLEMENTADO**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-101 | El usuario podrá **registrar mascotas** con nombre, especie, raza, edad, peso, género, foto y observaciones. | ✅ **IMPLEMENTADO** |
| RF-102 | El sistema debe permitir **editar y eliminar mascotas**. | ✅ **IMPLEMENTADO** |
| RF-103 | Cada usuario puede tener **más de una mascota**. | ✅ **IMPLEMENTADO** |

---

### **5.3. Recordatorios** ✅ **IMPLEMENTADO**

| ID     | Requerimiento                                                                 | Estado                |
|--------|-------------------------------------------------------------------------------|-----------------------|
| RF-201 | El usuario podrá **crear recordatorios** asociados a una mascota: tipo (vacuna, medicina, baño, etc.), fecha, notas. | ✅ **IMPLEMENTADO**   |
| RF-202 | El sistema debe permitir **listar recordatorios próximos** ordenados por fecha. | ✅ **IMPLEMENTADO**   |
| RF-203 | El usuario podrá **editar o eliminar** recordatorios.                         | ✅ **IMPLEMENTADO**   |
| RF-204 | El sistema podrá, en futuro, integrar notificaciones push.                    | ⏳ **PENDIENTE**      |

**Comportamiento de la API:**
- **GET /api/reminders/{id}:**  
  - Si el recordatorio existe: retorna el objeto recordatorio.
  - Si no existe:  
    ```json
    { "error": "El recordatorio especificado no existe" } (HTTP 404)
    ```
- **GET /api/pets/{petId}/reminders:**  
  - Si hay recordatorios:  
    ```json
    { "reminders": [ ... ] }
    ```
  - Si no hay recordatorios:  
    ```json
    { "reminders": [], "message": "No existen recordatorios para esta mascota" }
    ```
- **PUT /api/reminders/{id}** y **DELETE /api/reminders/{id}:**
  - Si el recordatorio no existe:  
    ```json
    { "error": "El recordatorio especificado no existe" } (HTTP 404)
    ```

---

### **5.4. Historial Médico** ✅ **IMPLEMENTADO**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-301 | El usuario podrá **agregar registros médicos**: fecha, síntoma, diagnóstico, tratamiento, notas. | ✅ **IMPLEMENTADO** |
| RF-302 | El usuario podrá consultar el **historial cronológico por mascota**. | ✅ **IMPLEMENTADO** |
| RF-303 | Cada registro podrá ser editado o eliminado. | ✅ **IMPLEMENTADO** |

**Comportamiento de la API:**
- **GET /api/medical-records/{id}:**
  - Si existe: retorna el registro médico.
  - Si no existe: `{ "error": "El registro médico especificado no existe" }` (HTTP 404)
- **GET /api/pets/{petId}/medical-records:**
  - Si hay registros: `{ "medical_records": [ ... ] }` ordenados por fecha DESC.
  - Si no hay registros: `{ "medical_records": [], "message": "No existen registros médicos para esta mascota" }`
- **PUT /api/medical-records/{id}** y **DELETE /api/medical-records/{id}:**
  - Si no existe: `{ "error": "El registro médico especificado no existe" }` (HTTP 404)

---

### **5.5. Exportación y PDF** ✅ **IMPLEMENTADO**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-401 | El sistema debe permitir al usuario generar un **PDF con los datos de su mascota y su historial médico**. | ✅ **IMPLEMENTADO** |
| RF-402 | Esta función estará **disponible solo para usuarios PRO** (pagaron una vez). | ✅ **IMPLEMENTADO** |

**Comportamiento:** `GET /api/pets/{id}/export` retorna `application/pdf` si el usuario es PRO. Retorna HTTP 403 si no lo es.

---

### **5.6. Refugios y Adopciones** ✅ **IMPLEMENTADO**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-601 | El sistema debe permitir el **registro de refugios** como entidad independiente con nombre, email, contraseña, descripción, ubicación y teléfono. | ✅ **IMPLEMENTADO** |
| RF-602 | El sistema debe permitir el **login de refugios** con JWT propio (`entity_type: "shelter"`). | ✅ **IMPLEMENTADO** |
| RF-603 | Los refugios podrán **crear, editar y eliminar listados** de mascotas en adopción. | ✅ **IMPLEMENTADO** |
| RF-604 | Los usuarios autenticados podrán **ver el listado** de mascotas disponibles en adopción. | ✅ **IMPLEMENTADO** |
| RF-605 | Los usuarios podrán **enviar una solicitud de adopción** con un mensaje de presentación. No se permite más de una solicitud por usuario por mascota. | ✅ **IMPLEMENTADO** |
| RF-606 | Los refugios podrán **aprobar o rechazar solicitudes** de adopción. | ✅ **IMPLEMENTADO** |
| RF-607 | Los usuarios podrán consultar **sus propias solicitudes** enviadas. | ✅ **IMPLEMENTADO** |

**Comportamiento:**
- `POST /shelters/register` y `POST /shelters/login` — rutas públicas, entidad separada de `users`
- JWT incluye `entity_type: "shelter"` | `"user"` — middleware de rol controla acceso
- `GET /api/adoption-listings` — accesible para cualquier entidad autenticada
- Solo refugios pueden crear/editar/eliminar listados y gestionar solicitudes
- Solo usuarios pueden enviar solicitudes de adopción
- Estado de listado: `available` | `reserved` | `adopted`
- Estado de solicitud: `pending` | `approved` | `rejected`

---

### **5.7. Blog Editorial** ✅ **IMPLEMENTADO**

El blog es contenido educativo producido por el equipo de Mopetoo — artículos sobre salud animal, nutrición, comportamiento, cuidados, etc. No es contenido generado por usuarios.

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-701 | El sistema debe permitir **crear, editar y eliminar artículos** del blog. Solo usuarios con rol `admin` pueden gestionar contenido. | ✅ **IMPLEMENTADO** |
| RF-702 | Los artículos tendrán: título, slug (URL amigable), contenido, imagen de portada, categoría y estado (`draft` \| `published`). | ✅ **IMPLEMENTADO** |
| RF-703 | Los usuarios autenticados y el frontend público (Nuxt.js) podrán **listar y leer artículos publicados**. | ✅ **IMPLEMENTADO** |
| RF-704 | El sistema debe permitir **filtrar artículos por categoría** (nutrición, salud, comportamiento, cuidados generales, etc.). | ✅ **IMPLEMENTADO** |
| RF-705 | Los artículos tendrán **fecha de publicación** y se listarán ordenados de más reciente a más antiguo. | ✅ **IMPLEMENTADO** |

**Decisiones de diseño:**
- El contenido es **editorial** (equipo Mopetoo), no generado por usuarios
- El acceso de lectura es **público** — sin necesidad de autenticación, pensado para SEO desde el frontend Nuxt.js
- La gestión (crear/editar/publicar) requiere un rol `admin` en el JWT
- El `slug` permite URLs amigables: `/blog/como-vacunar-a-tu-perro`

**Endpoints planificados:**

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/blog/posts` | Público | Listar artículos publicados (filtro por categoría opcional) |
| GET | `/blog/posts/:slug` | Público | Leer artículo por slug |
| POST | `/api/blog/posts` | Admin | Crear artículo |
| PUT | `/api/blog/posts/:id` | Admin | Actualizar artículo |
| DELETE | `/api/blog/posts/:id` | Admin | Eliminar artículo |
| PATCH | `/api/blog/posts/:id/publish` | Admin | Publicar / despublicar artículo |

**Entidad BlogPost:**

| Campo | Tipo | Requerido | Descripción |
| ----- | ----- | ----- | ----- |
| `id` | uint | ✅ | Identificador único |
| `title` | string | ✅ | Título del artículo |
| `slug` | string | ✅ | URL amigable única (ej: `como-vacunar-a-tu-perro`) |
| `content` | text | ✅ | Contenido del artículo (Markdown) |
| `cover_image_url` | string | ❌ | Imagen de portada |
| `category` | string | ✅ | Categoría: `nutricion`, `salud`, `comportamiento`, `cuidados`, `otros` |
| `published` | bool | ✅ | `false` = borrador, `true` = publicado |
| `published_at` | datetime | ❌ | Fecha/hora de publicación |
| `created_at` | datetime | ✅ | Fecha de creación |
| `updated_at` | datetime | ✅ | Última modificación |

**Nota frontend:** El frontend en **Nuxt.js** consumirá los endpoints públicos (`GET /blog/posts`) para el renderizado con SSR/SSG, lo cual es favorable para el SEO. La **app Flutter** también podrá mostrar artículos del blog en una sección de noticias dentro de la app.

---

### **5.8. Directorio de Tiendas Pet-Friendly** ✅ **IMPLEMENTADO**

Un directorio de descubrimiento donde tiendas de productos para mascotas se registran para publicar su perfil y catálogo de productos. Los usuarios navegan, exploran y contactan a la tienda de su preferencia directamente por WhatsApp o teléfono. **No hay carrito, checkout ni pagos procesados en la plataforma.**

> Concepto: similar a Rappi en la experiencia de exploración (ver tiendas, ver productos con fotos y precios), pero sin ningún flujo de pedido — el cierre de la venta ocurre 100% fuera de la app.

**¿Por qué este modelo?**
- Cero complejidad de pagos, inventario, despacho o devoluciones en el MVP.
- Las tiendas se benefician de visibilidad digital sin costos de integración.
- Los usuarios tienen una referencia centralizada de dónde comprar productos para sus mascotas.
- Monetizable: tiendas destacadas, posicionamiento premium (futuro).

**Actores:**
- **Tienda** — entidad registrada con cuenta propia (similar al modelo de Refugio), gestiona su perfil y productos.
- **Usuario / visitante** — navega el directorio, ve productos, hace clic en el enlace de contacto.

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-801 | El sistema debe permitir el **registro de tiendas** con nombre, descripción, logo, ciudad, país, teléfono y enlace de WhatsApp. | ✅ **IMPLEMENTADO** |
| RF-802 | El sistema debe permitir a las tiendas **publicar productos** con nombre, descripción, precio, foto, categoría y estado (disponible/agotado). | ✅ **IMPLEMENTADO** |
| RF-803 | Los usuarios autenticados podrán **explorar tiendas** registradas, con filtro por ciudad y/o categoría de producto. | ✅ **IMPLEMENTADO** |
| RF-804 | Los usuarios podrán **ver el catálogo de productos** de una tienda. | ✅ **IMPLEMENTADO** |
| RF-805 | Cada tienda tendrá un **enlace de contacto directo** (WhatsApp Business URL o número de teléfono) visible en su perfil y en cada producto. | ✅ **IMPLEMENTADO** (`whatsapp_link` auto-generado desde teléfono) |
| RF-806 | El sistema **no procesará pagos ni órdenes** — el cierre de la venta ocurre fuera de la plataforma. | ✅ **IMPLEMENTADO** (sin endpoints de pago/orden) |

**Endpoints implementados:**

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/stores/register` | Público | Registro de tienda |
| POST | `/stores/login` | Público | Login de tienda (JWT `entity_type:"store"`) |
| GET | `/api/stores` | Auth | Listar tiendas (filtro `?city=&category=`) |
| GET | `/api/stores/:id` | Auth | Perfil de una tienda |
| PUT | `/api/stores/:id` | Auth (RequireStore) | Actualizar perfil de la tienda (solo la propia) |
| GET | `/api/stores/:id/products` | Auth | Listar productos de una tienda |
| POST | `/api/stores/:id/products` | Auth (RequireStore) | Crear producto (solo la propia tienda) |
| PUT | `/api/store-products/:id` | Auth (RequireStore) | Actualizar producto (ownership validado) |
| DELETE | `/api/store-products/:id` | Auth (RequireStore) | Eliminar producto (ownership validado) |

**Entidad Store:**

| Campo | Tipo | Requerido | Descripción |
| ----- | ----- | ----- | ----- |
| `id` | uint | ✅ | Identificador único |
| `name` | string | ✅ | Nombre de la tienda |
| `email` | string | ✅ | Email único (login) |
| `password` | string | ✅ | Contraseña hasheada |
| `description` | text | ❌ | Descripción de la tienda |
| `logo_url` | string | ❌ | Logo de la tienda |
| `country` | string | ✅ | País |
| `city` | string | ✅ | Ciudad |
| `phone_country_code` | string | ✅ | Código de país del teléfono |
| `phone` | string | ✅ | Teléfono |
| `whatsapp_link` | string | ❌ | URL de WhatsApp Business (`https://wa.me/...`) |
| `website` | string | ❌ | Sitio web de la tienda |
| `verified` | bool | ✅ | Tienda verificada por Mopetoo (default false) |
| `created_at` | datetime | ✅ | Fecha de creación |
| `updated_at` | datetime | ✅ | Última modificación |
| `deleted_at` | datetime | ❌ | Soft delete |

**Entidad StoreProduct:**

| Campo | Tipo | Requerido | Descripción |
| ----- | ----- | ----- | ----- |
| `id` | uint | ✅ | Identificador único |
| `store_id` | uint | ✅ | Referencia a la tienda |
| `name` | string | ✅ | Nombre del producto |
| `description` | text | ❌ | Descripción del producto |
| `price` | decimal | ✅ | Precio referencial (sin transacción) |
| `photo_url` | string | ✅ | Foto del producto |
| `category` | string | ✅ | Categoría: `alimento`, `accesorios`, `salud`, `juguetes`, `higiene`, `otros` |
| `available` | bool | ✅ | Disponibilidad (default true) |
| `created_at` | datetime | ✅ | Fecha de creación |
| `updated_at` | datetime | ✅ | Última modificación |

**Decisiones de diseño:**
- Las tiendas usarán `entity_type: "store"` en el JWT (extensión del sistema de roles existente).
- El `whatsapp_link` sigue el formato estándar `https://wa.me/[número_con_código_de_país]`, generado automáticamente desde el teléfono registrado si no se provee uno personalizado.
- El precio en `StoreProduct` es meramente informativo — no se procesa ningún pago.
- La categoría de la tienda se infiere de sus productos (sin campo explícito en `Store`).

---

### **5.9. Monetización**

La estrategia de monetización es multi-canal: combina ingresos B2C (usuarios), B2B (refugios, tiendas, veterinarios) y publicidad contextual en cada plataforma.

#### **5.9.1. Suscripción PRO para usuarios (B2C)**

El modelo PRO evoluciona de pago único a suscripción recurrente para generar ingreso predecible.

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-501 | El sistema debe soportar **suscripción PRO mensual y anual** para usuarios, activada desde la app móvil o web tras confirmación de pago. | ✅ **IMPLEMENTADO** (PayU web checkout + IAP móvil via `upgrade-pro`) |
| RF-502 | Los usuarios PRO tendrán: exportación PDF, recordatorios ilimitados, historial médico ilimitado y eliminación de anuncios. | ✅ **IMPLEMENTADO** (PDF + límites de tier gratuito aplicados en use cases) |

**Beneficios PRO:**

| Función | Gratuito | PRO |
|---------|----------|-----|
| Mascotas registradas | Hasta 2 | Ilimitadas |
| Recordatorios por mascota | Hasta 5 | Ilimitados |
| Registros médicos por mascota | Hasta 10 | Ilimitados |
| Exportación PDF | ❌ | ✅ |
| Anuncios en app móvil | Con anuncios | Sin anuncios |

**Nota backend — Límites de tier gratuito (implementado):** Los use cases `CreatePet`, `CreateReminder` y `CreateMedicalRecord` verifican `user.IsProActive()` antes de crear. Si el usuario free supera el límite correspondiente retornan `ErrFreeTierXxxLimitReached`, y el handler responde `403 { "error": "...", "upgrade_required": true }`.

**Endpoints de suscripción web implementados:**
- `POST /api/users/{id}/subscribe` — crea transacción `pending` y retorna `checkout_url` + `form_params` para redirigir al usuario a PayU. Body: `{ "plan": "pro_monthly" | "pro_annual" }`.
- `GET /api/users/{id}/subscription` — retorna estado actual: `is_pro`, `is_active`, `subscription_plan`, `subscription_expires_at`, `days_remaining`.
- `POST /webhooks/payu/subscription` — webhook público (sin auth) que PayU llama tras el pago; valida firma MD5 y activa PRO automáticamente si fue aprobado.
- `POST /api/users/{id}/upgrade-pro` — activa PRO directamente (para IAP móvil o activación manual).

**Modelo de datos de suscripción (campos en `users`):**
- `subscription_plan VARCHAR(20) DEFAULT 'free'` — `'free'` | `'pro_monthly'` | `'pro_annual'`
- `subscription_expires_at TIMESTAMP WITH TIME ZONE` — null = sin expiración (legacy IAP)
- `User.IsProActive()` retorna `true` si `is_pro=true` Y (`expires_at` es null OR es futura)

**Pasarelas de pago por canal:**
- **App móvil (Flutter):** Google Play Billing (Android) / App Store In-App Purchases (iOS) — obligatorio por políticas de las tiendas. Usar `POST /api/users/{id}/upgrade-pro` después de confirmar el pago en el cliente.
- **Web (Nuxt.js):** **PayU** (líder colombiano; soporta PSE, Efecty, Nequi, Baloto y tarjetas locales). Integración via web checkout (form POST). **Stripe no aplica** — no acepta empresas registradas en Colombia.

**Infraestructura PayU desacoplada (`internal/infrastructure/payu/`):**
- `PaymentGateway` interface — `CreateCheckout()` y `ValidateConfirmation()`
- `PayUGateway` — implementación real con firma MD5, configurada via `PAYU_MERCHANT_ID`, `PAYU_ACCOUNT_ID`, `PAYU_API_KEY`
- `MockPaymentGateway` — stub para desarrollo/tests (activo cuando `PAYU_TEST_MODE=true` o `ENV=development`)

---

#### **5.9.2. Publicidad contextual por plataforma**

| ID | Requerimiento | Canal | Estado |
| ----- | ----- | ----- | ----- |
| RF-503 | La **app Flutter** mostrará anuncios **AdMob** (banners y/o intersticiales) en vistas de listado para usuarios no PRO. | Flutter (mobile-side) | ⏳ **PENDIENTE** |
| RF-504 | El **frontend Nuxt.js** mostrará anuncios **Google AdSense** en las páginas del blog, directorio de tiendas y listado de adopciones para usuarios no autenticados o no PRO. | Nuxt.js (frontend) | ⏳ **PENDIENTE** |
| RF-505 | Los usuarios PRO no verán anuncios en ninguna plataforma. | Backend flag | ✅ **IMPLEMENTADO** (via `is_pro`) |

**Nota:** AdMob (Flutter) y Google AdSense (Nuxt.js) son 100% client-side — el backend no requiere cambios. Solo se necesita el flag `is_pro` en el JWT para que cada cliente decida si renderiza anuncios.

---

#### **5.9.3. Visibilidad Verificada para Refugios (B2B)**

> **Decisión de producto:** Los refugios se sostienen mayoritariamente con donaciones. Obligarlos a pagar un plan para publicar mascotas en adopción contradice el propósito social de la plataforma. Por ello, **todas las funcionalidades core son siempre gratuitas** para refugios. La monetización con refugios se limita a features opcionales de visibilidad que agregan valor sin condicionar el acceso.

**Qué es siempre gratis para refugios:**
- Registro y login
- Listados de adopción ilimitados
- Gestión de solicitudes de adopción (aprobar / rechazar)
- Perfil público del refugio
- Botón de donación (ver sección 5.9.5)

**Qué es opcional (plan Verificado):**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-506 | El sistema debe soportar un campo `verified` en la entidad `Shelter` (`bool`, default false) que indica si Mopetoo ha verificado el refugio manualmente. | ⏳ **POST-MVP** |
| RF-507 | Los refugios **verificados** mostrarán un badge "Verificado ✓" en su perfil y en cada listado de adopción. | ⏳ **POST-MVP** |
| RF-508 | Los refugios **verificados** aparecerán primero en el listado de adopciones (posicionamiento destacado). | ⏳ **POST-MVP** |
| RF-509 | Los refugios **verificados** tendrán acceso a métricas básicas: vistas por mascota, solicitudes recibidas y tasa de adopción. | ⏳ **POST-MVP** |

**Nota de implementación:** El campo `verified` ya existe en la entidad `Shelter` como `bool` con default `false`. La activación es manual por el equipo de Mopetoo (no hay endpoint de auto-activación). El modelo de cobro por verificación (cuota simbólica anual o gratuito como estrategia de adopción) se decide según el crecimiento de la plataforma.

---

#### **5.9.4. Tiendas Destacadas (B2B)**

_(Aplica cuando se implemente el módulo de Directorio de Tiendas — sección 5.8)_

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-510 | El sistema debe soportar un campo `plan` en la entidad `Store` (`free` \| `featured`) para controlar visibilidad. | ⏳ **POST-MVP** |
| RF-511 | Tiendas en plan **gratuito** tendrán hasta 10 productos publicados. | ⏳ **POST-MVP** |
| RF-512 | Tiendas **destacadas** aparecerán primero en el directorio, tendrán badge verificado y productos ilimitados. | ⏳ **POST-MVP** |

---

#### **5.9.5. Donaciones a Refugios con Fee de Plataforma**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-513 | El perfil de cada refugio tendrá un botón "Apoyar este refugio" que abre un flujo de donación con **PayU** (lider del mercado colombiano; soporta PSE, Efecty, Nequi y tarjetas locales). | ✅ **IMPLEMENTADO** |
| RF-514 | Mopetoo retendrá un **fee del 5%** sobre cada donación procesada como costo de plataforma. El resto (95%) va íntegro al refugio. | ✅ **IMPLEMENTADO** |

**Endpoints de donaciones implementados:**
- `POST /api/shelters/{id}/donate` — (RequireUser) crea donación `pending` y retorna `checkout_url` + `form_params`. Body: `{ "amount": 50000, "currency": "COP", "message": "..." }`.
- `POST /webhooks/payu/donation` — webhook público que PayU llama tras el pago; actualiza el status de la donación.
- `GET /api/donations/my` — (RequireUser) lista todas las donaciones realizadas por el usuario autenticado.
- `GET /api/shelters/{id}/donations` — (RequireShelter) lista las donaciones recibidas por el refugio + `total_received` (suma de `shelter_amount` de donaciones aprobadas).

**Modelo de datos (`donations`):**
- `amount`, `platform_fee` (5%), `shelter_amount` (95%) — calculados al crear la donación
- `status`: `pending` | `approved` | `declined` | `error`
- `message TEXT` — mensaje opcional del donante al refugio

---

#### **Resumen del modelo de ingresos**

| Canal | Actor | Modelo | Pasarela | Precio estimado | Plazo |
|-------|-------|--------|----------|-----------------|-------|
| Usuarios PRO (móvil) | Dueños de mascotas | Suscripción mensual/anual | Google Play / App Store IAP | $3–5/mes · $25–40/año | ✅ **Backend listo** |
| Usuarios PRO (web) | Dueños de mascotas | Suscripción mensual/anual | **PayU** | COP 15.000/mes · COP 120.000/año | ✅ **Backend listo** |
| Donaciones | Usuarios → Refugios | Fee 5% sobre monto donado | **PayU** | Variable | ✅ **Backend listo** |
| Publicidad Flutter | Usuarios no PRO | AdMob (mobile-side) | AdMob | CPM variable | Post-MVP |
| Publicidad web | Visitantes no PRO | Google AdSense (blog + directorio) | Google AdSense | CPM variable | Post-MVP |
| Refugios Verificados | Refugios / fundaciones | Cuota simbólica anual (o gratuito) | PayU | TBD según crecimiento | Post-MVP |
| **Clínicas Pro** | **Clínicas veterinarias** | **Suscripción mensual/anual** | **PayU** | **$15–30/mes · $120–250/año** | **Post-MVP** |
| Tiendas destacadas | Tiendas pet-friendly | Suscripción mensual | PayU | $30–60/mes | Post-MVP |

> **Nota sobre pasarelas de pago:** Mopetoo opera en Colombia. **Stripe no aplica** como pasarela web (no acepta empresas registradas en CO). Las opciones viables son **PayU** (líder del mercado colombiano, soporta PSE, Efecty, Nequi, Baloto y tarjetas locales) y **Wompi** (by Bancolombia, API moderna, integración nativa con Nequi y PSE, mejor DX para suscripciones recurrentes web). Los pagos in-app móvil deben procesarse obligatoriamente por **Google Play Billing** (Android) o **App Store IAP** (iOS) según las políticas de las tiendas.
>
> **Nota sobre refugios:** Siempre tienen acceso gratuito a todas las funcionalidades core. La verificación es un diferenciador de visibilidad, no una restricción de acceso.
>
> **Nota sobre clínicas:** El tier gratuito garantiza visibilidad en el directorio. El tier Pro desbloquea agenda online, escritura en historial médico y métricas — herramientas de alto valor operativo que justifican el cobro dado que las clínicas operan como negocios con ingresos recurrentes.

---

### **5.10. Clínicas Veterinarias** ✅ **Implementado**

Las clínicas veterinarias son actores B2B con ingresos recurrentes y un incentivo claro para pagar por visibilidad y herramientas de gestión. A diferencia de los refugios (organizaciones sin ánimo de lucro), las clínicas operan como negocios con flujos de caja estables, por lo que **la monetización mediante suscripción mensual/anual es apropiada**.

**Modelo de actor:** Las clínicas son una entidad independiente de `User` y `Shelter`, con su propia tabla `clinics`, login con JWT (`entity_type: "clinic"`) y middleware `RequireClinic()`.

---

#### **5.10.1. Registro y Autenticación de Clínicas**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-901 | El sistema debe permitir el **registro de clínicas veterinarias** con nombre, dirección, ciudad, país, teléfono, email, contraseña y especialidades. | ✅ **Implementado** |
| RF-902 | El sistema debe permitir el **login de clínicas** mediante JWT con `entity_type: "clinic"`. | ✅ **Implementado** |
| RF-903 | El sistema debe permitir a la clínica **actualizar su perfil**: descripción, horarios, foto de portada, servicios ofrecidos y URL de redes sociales. | ✅ **Implementado** |

---

#### **5.10.2. Directorio Público de Clínicas**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-904 | El sistema debe exponer un **directorio público** de clínicas filtrable por ciudad y especialidad, ordenado por clínicas verificadas primero. | ✅ **Implementado** |
| RF-905 | Cada clínica tendrá un **perfil público** con nombre, dirección, teléfono, horarios, servicios y botón de contacto directo (llamada o WhatsApp). | ✅ **Implementado** |
| RF-906 | El sistema debe soportar un campo `plan` en la entidad `Clinic` (`free` \| `pro`) para controlar el nivel de acceso a funcionalidades. | ✅ **Implementado** |

---

#### **5.10.3. Funcionalidades Pro para Clínicas (Suscripción)**

> **Decisión de producto:** El tier gratuito da visibilidad básica en el directorio. El tier Pro desbloquea herramientas de gestión activa (agenda online, registros médicos, métricas) que generan valor directo y medible para la clínica.

**Qué es siempre gratuito para clínicas:**
- Registro y login
- Perfil público con información de contacto
- Listado en el directorio de clínicas
- Aparición en búsquedas por ciudad/especialidad

**Qué desbloquea el plan Pro:**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-907 | Las clínicas **Pro** mostrarán un badge "Clínica Verificada ✓" en el directorio y en su perfil. | ✅ **Implementado** |
| RF-908 | Las clínicas **Pro** tendrán posicionamiento destacado en el directorio (aparecen primero). | ✅ **Implementado** |
| RF-909 | Las clínicas **Pro** podrán activar **agenda de citas online**: el dueño solicita cita desde la app, la clínica confirma o rechaza. | ✅ **Implementado** |
| RF-910 | Las clínicas **Pro** podrán **agregar registros médicos** al historial de una mascota, siempre con autorización previa del dueño (el dueño acepta una solicitud de vinculación). | ✅ **Implementado** |
| RF-911 | Las clínicas **Pro** tendrán acceso a **métricas básicas**: visitas al perfil, citas agendadas por mes, mascotas vinculadas y registros médicos añadidos. | ✅ **Implementado** |

---

#### **5.10.4. Vinculación Mascota ↔ Clínica (RF-910 detalle)**

El flujo de autorización para que una clínica escriba en el historial médico de una mascota:
1. La clínica Pro busca la mascota (por código único o QR del dueño).
2. Se genera una solicitud de vinculación que el dueño recibe en la app.
3. El dueño acepta → la clínica queda autorizada para ese registro específico.
4. El registro médico creado por la clínica se muestra en el historial del dueño con tag "Creado por [Nombre Clínica]".

Este mecanismo garantiza que el dueño siempre controla quién puede escribir en el historial de su mascota.

---

#### **5.10.5. Tabla de Entidad `Clinic` (diseño preliminar)**

```sql
CREATE TABLE clinics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    description TEXT,
    specialties TEXT[],          -- ej: ['general','dermatologia','cirugia']
    cover_image_url VARCHAR(500),
    plan VARCHAR(10) NOT NULL DEFAULT 'free', -- 'free' | 'pro'
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

> **Nota:** `verified` lo activa el equipo de Mopetoo manualmente como parte del proceso de alta Pro. `plan_expires_at` permite gestionar renovaciones y expiración automática del plan.

---

#### **5.10.6. Endpoints planeados**

```
# Públicos (sin auth)
POST  /clinics/register              → Registro de clínica
POST  /clinics/login                 → Login de clínica (retorna JWT entity_type:"clinic")
GET   /clinics                       → Directorio público (filtros: city, specialty)
GET   /clinics/:id                   → Perfil público de clínica

# Protegidos (RequireClinic — JWT entity_type:"clinic")
GET   /api/clinics/:id               → Perfil completo (admin view)
PUT   /api/clinics/:id               → Actualizar perfil
GET   /api/clinics/:id/metrics       → Métricas (solo plan Pro)
POST  /api/clinics/:id/appointments  → Gestión de citas (solo plan Pro)
POST  /api/pets/:id/link-clinic      → Solicitar vinculación para registros médicos (solo plan Pro)

# Protegidos (RequireUser — solo dueños)
POST  /api/clinic-link-requests/:id/accept  → Aceptar vinculación clínica↔mascota
POST  /api/clinic-link-requests/:id/reject  → Rechazar vinculación
```

---

### **5.11. Panel Administrativo** ✅ **IMPLEMENTADO**

El panel administrativo centraliza la gestión de todas las entidades del sistema (usuarios, refugios, tiendas y clínicas) bajo un único conjunto de endpoints protegidos por el middleware `RequireAdmin()`. El acceso queda restringido exclusivamente a usuarios con `is_admin = true` en la base de datos.

**Principio de diseño:** El admin no puede auto-asignarse permisos. La promoción inicial al rol admin se realiza directamente en la base de datos por el equipo técnico. Un admin puede promover a otros usuarios, pero no puede revocar su propio rol.

**Migración aplicada:** `022_add_is_active_to_entities` — agrega `is_active BOOLEAN NOT NULL DEFAULT true` a `users`, `shelters`, `stores`, `clinics`; y `plan VARCHAR(20) NOT NULL DEFAULT 'free'` a `stores`. El `AuthMiddleware(db *gorm.DB)` verifica este campo en cada request y retorna `401 {"error":"cuenta suspendida"}` si la cuenta fue suspendida por un admin.

---

#### **5.11.1. Gestión de Usuarios**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1001 | El admin debe poder **listar todos los usuarios** con paginación y filtros por plan (`free`/`pro`), estado (`active`/`inactive`), país y rango de fechas de registro. | ✅ **IMPLEMENTADO** |
| RF-1002 | El admin debe poder **ver el detalle completo de un usuario**: información personal, cantidad de mascotas registradas, suscripción activa, historial de pagos y donaciones realizadas. | ✅ **IMPLEMENTADO** |
| RF-1003 | El admin debe poder **suspender una cuenta de usuario** (`is_active = false`). Cualquier request del usuario suspendido recibirá `401` en el middleware de autenticación. | ✅ **IMPLEMENTADO** |
| RF-1004 | El admin debe poder **reactivar una cuenta de usuario** suspendida (`is_active = true`). | ✅ **IMPLEMENTADO** |
| RF-1005 | El admin debe poder **otorgar el plan PRO manualmente** a un usuario, especificando el plan (`pro_monthly`/`pro_annual`) y calculando la fecha de expiración. Útil para soporte al cliente, refunds o cuentas de prueba. | ✅ **IMPLEMENTADO** |
| RF-1006 | El admin debe poder **revocar el plan PRO** de un usuario, estableciendo `is_pro = false` y limpiando `subscription_expires_at`. | ✅ **IMPLEMENTADO** |
| RF-1007 | El admin debe poder **promover a otro usuario al rol admin** (`is_admin = true`). | ✅ **IMPLEMENTADO** |
| RF-1008 | El admin debe poder **revocar el rol admin** de otro usuario. Un admin no puede revocar su propio rol (validación en el use case). | ✅ **IMPLEMENTADO** |

---

#### **5.11.2. Gestión de Refugios**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1009 | El admin debe poder **listar todos los refugios** con paginación y filtros por estado (`active`/`inactive`), país y ciudad. | ✅ **IMPLEMENTADO** |
| RF-1010 | El admin debe poder **ver el detalle completo de un refugio**: información de registro, listados de adopción activos, solicitudes recibidas y donaciones recibidas con totales acumulados. | ✅ **IMPLEMENTADO** |
| RF-1011 | El admin debe poder **suspender un refugio** (`is_active = false`). Sus listados de adopción quedarán ocultos del directorio público mientras dure la suspensión. | ✅ **IMPLEMENTADO** |
| RF-1012 | El admin debe poder **reactivar un refugio** suspendido. Sus listados de adopción volverán a aparecer en el directorio. | ✅ **IMPLEMENTADO** |
| RF-1013 | El admin debe poder **marcar un refugio como verificado** (`verified = true`) directamente desde el panel, sin necesidad de acceso directo a la base de datos. | ✅ **IMPLEMENTADO** |

---

#### **5.11.3. Gestión de Tiendas**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1014 | El admin debe poder **listar todas las tiendas** con paginación y filtros por categoría, estado (`active`/`inactive`) y ciudad. | ✅ **IMPLEMENTADO** |
| RF-1015 | El admin debe poder **ver el detalle completo de una tienda**: información de perfil, productos publicados, plan actual y datos de contacto. | ✅ **IMPLEMENTADO** |
| RF-1016 | El admin debe poder **suspender o reactivar una tienda** (`is_active`). | ✅ **IMPLEMENTADO** |
| RF-1017 | El admin debe poder **actualizar el plan de una tienda** (`free` → `featured`) manualmente, para activaciones comerciales o acuerdos directos. | ✅ **IMPLEMENTADO** |

---

#### **5.11.4. Gestión de Clínicas**

_(El módulo de Clínicas Veterinarias — sección 5.10 — ya está implementado)_

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1018 | El admin debe poder **listar todas las clínicas** registradas con filtros por plan (`free`/`pro`), estado (`active`/`inactive`) y ciudad. | ✅ **IMPLEMENTADO** |
| RF-1019 | El admin debe poder **ver el detalle completo de una clínica**: información de perfil, plan activo, fecha de expiración del plan, mascotas vinculadas y registros médicos creados. | ✅ **IMPLEMENTADO** |
| RF-1020 | El admin debe poder **suspender o reactivar una clínica** (`is_active`). Una clínica suspendida no aparece en el directorio público ni puede autenticarse. | ✅ **IMPLEMENTADO** |
| RF-1021 | El admin debe poder **marcar una clínica como verificada** (`verified = true`), activando el badge "Clínica Verificada ✓" como parte del proceso de alta del plan Pro. | ✅ **IMPLEMENTADO** |
| RF-1022 | El admin debe poder **actualizar el plan de una clínica** (`free` → `pro`) manualmente, útil para activaciones comerciales, períodos de prueba o acuerdos directos. | ✅ **IMPLEMENTADO** |

---

#### **5.11.5. Log de Transacciones y Pagos**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1023 | El admin debe poder **buscar y listar transacciones de pago PRO** con filtros por usuario, plan, estado (`pending`/`approved`/`declined`/`error`) y rango de fechas. | ✅ **IMPLEMENTADO** |
| RF-1024 | El admin debe poder **ver el detalle de una transacción individual**: usuario, plan, monto, moneda, IDs de PayU (`payu_order_id`, `payu_transaction_id`), `state_pol`, estado y timestamp. Imprescindible para soporte cuando un pago se aprueba en PayU pero la suscripción no se activa. | ✅ **IMPLEMENTADO** |
| RF-1025 | El admin debe poder **listar todas las donaciones** con filtros por usuario, refugio, estado y rango de fechas, visualizando `amount`, `platform_fee`, `shelter_amount` e IDs de PayU por cada donación. | ✅ **IMPLEMENTADO** |

---

#### **5.11.6. Endpoints implementados**

```
# Todos bajo RequireAdmin() — JWT con is_admin=true

# Usuarios
GET    /api/admin/users                          → Listar usuarios (query: plan, status, country, from, to, page, limit)
GET    /api/admin/users/:id                      → Detalle completo de usuario
PATCH  /api/admin/users/:id/deactivate           → Suspender cuenta
PATCH  /api/admin/users/:id/activate             → Reactivar cuenta
PATCH  /api/admin/users/:id/grant-pro            → Otorgar PRO manualmente (body: { "plan": "pro_monthly" })
PATCH  /api/admin/users/:id/revoke-pro           → Revocar PRO
PATCH  /api/admin/users/:id/grant-admin          → Promover a admin
PATCH  /api/admin/users/:id/revoke-admin         → Revocar rol admin

# Refugios
GET    /api/admin/shelters                       → Listar refugios (query: status, country, city, page, limit)
GET    /api/admin/shelters/:id                   → Detalle completo de refugio
PATCH  /api/admin/shelters/:id/deactivate        → Suspender refugio
PATCH  /api/admin/shelters/:id/activate          → Reactivar refugio
PATCH  /api/admin/shelters/:id/verify            → Marcar como verificado

# Tiendas
GET    /api/admin/stores                         → Listar tiendas (query: category, status, city, page, limit)
GET    /api/admin/stores/:id                     → Detalle completo de tienda
PATCH  /api/admin/stores/:id/deactivate          → Suspender tienda
PATCH  /api/admin/stores/:id/activate            → Reactivar tienda
PATCH  /api/admin/stores/:id/plan                → Actualizar plan (body: { "plan": "featured" })

# Clínicas (cuando exista el módulo — sección 5.10)
GET    /api/admin/clinics                        → Listar clínicas (query: plan, status, city, page, limit)
GET    /api/admin/clinics/:id                    → Detalle completo de clínica
PATCH  /api/admin/clinics/:id/deactivate         → Suspender clínica
PATCH  /api/admin/clinics/:id/activate           → Reactivar clínica
PATCH  /api/admin/clinics/:id/verify             → Marcar como verificada (activa badge ✓)
PATCH  /api/admin/clinics/:id/plan               → Actualizar plan (body: { "plan": "pro" })

# Transacciones y Donaciones
GET    /api/admin/transactions                   → Listar pagos PRO (query: user_id, plan, status, from, to, page, limit)
GET    /api/admin/transactions/:id               → Detalle de transacción individual
GET    /api/admin/donations                      → Listar donaciones (query: user_id, shelter_id, status, from, to, page, limit)
```

---

### **5.12. Estadísticas y Métricas del Sistema** ✅ **IMPLEMENTADO**

El módulo de estadísticas expone endpoints de **solo lectura** que agregan datos sobre las tablas existentes del sistema. No requiere nuevas tablas — se construye con queries SQL de agregación. Solo accesible para administradores (`RequireAdmin()`). Todos los endpoints soportan filtro por rango de fechas (`from` / `to` en formato `YYYY-MM-DD`).

---

#### **5.12.1. Dashboard General**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1026 | El sistema debe exponer un endpoint de **overview global** que consolide en una sola respuesta los totales de usuarios, refugios, tiendas, clínicas, revenue y donaciones. | ✅ **IMPLEMENTADO** |
| RF-1027 | El overview debe incluir **variación respecto a los últimos 30 días** para las métricas clave: nuevos usuarios, revenue generado y donaciones procesadas. | ✅ **IMPLEMENTADO** |
| RF-1028 | Todos los endpoints de estadísticas deben soportar **filtro por rango de fechas** (`from` / `to`) para análisis de períodos específicos. | ✅ **IMPLEMENTADO** |

---

#### **5.12.2. Métricas de Usuarios**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1029 | El sistema debe retornar: total de usuarios registrados, usuarios activos, usuarios nuevos en el período, usuarios PRO activos (suscripción no expirada) y usuarios en plan free. | ✅ **IMPLEMENTADO** |
| RF-1030 | El sistema debe retornar la **distribución geográfica** de usuarios por país y ciudad (top 10 de cada uno). | ✅ **IMPLEMENTADO** |
| RF-1031 | El sistema debe retornar la **tasa de conversión free → PRO**: porcentaje de usuarios que han tenido al menos una transacción aprobada sobre el total de usuarios registrados. | ✅ **IMPLEMENTADO** |

---

#### **5.12.3. Métricas de Revenue**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1032 | El sistema debe retornar: revenue total acumulado (COP), revenue en el período seleccionado, desglose por plan (`pro_monthly` / `pro_annual`) y número de transacciones aprobadas. | ✅ **IMPLEMENTADO** |
| RF-1033 | El sistema debe retornar la **serie temporal de revenue** agrupada por día o por mes dentro del período, para visualización en gráficos de barras o líneas. | ✅ **IMPLEMENTADO** |
| RF-1034 | El sistema debe retornar el **revenue promedio por usuario PRO activo** (ARPU) en el período. | ✅ **IMPLEMENTADO** |

---

#### **5.12.4. Métricas de Donaciones**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1035 | El sistema debe retornar: monto total donado (COP), fees de plataforma recolectados (5%), monto neto transferido a refugios (95%), número total de donaciones y donantes únicos. | ✅ **IMPLEMENTADO** |
| RF-1036 | El sistema debe retornar el **top 5 de refugios más donados** por monto total en el período, con nombre y monto acumulado. | ✅ **IMPLEMENTADO** |
| RF-1037 | El sistema debe retornar el **monto promedio por donación** y la **donación máxima** procesada en el período. | ✅ **IMPLEMENTADO** |

---

#### **5.12.5. Métricas de Contenido y Actividad**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1038 | El sistema debe retornar totales globales de: mascotas registradas, recordatorios creados, registros médicos, artículos de blog publicados y listados de adopción activos. | ✅ **IMPLEMENTADO** |
| RF-1039 | El sistema debe retornar el **promedio de mascotas por usuario** y el **promedio de registros médicos por mascota** como indicadores de engagement. | ✅ **IMPLEMENTADO** |
| RF-1040 | El sistema debe retornar el **conteo de listados de adopción desglosado por estado** (`available`, `reserved`, `adopted`) para medir la efectividad del módulo de adopciones. | ✅ **IMPLEMENTADO** |

---

#### **5.12.6. Endpoints implementados**

```
# Todos bajo RequireAdmin() — solo lectura, sin modificaciones de datos

GET  /api/admin/stats/overview     → Dashboard global consolidado (query: from, to)
GET  /api/admin/stats/users        → Métricas de usuarios con geo top10 (query: from, to)
GET  /api/admin/stats/revenue      → Métricas de revenue PRO + serie diaria (query: from, to)
GET  /api/admin/stats/donations    → Métricas de donaciones + top5 refugios (query: from, to)
GET  /api/admin/stats/content      → Métricas de contenido y actividad (query: from, to)
```

---

#### **5.12.7. Ejemplo de respuesta — `GET /api/admin/stats/overview`**

```json
{
  "generated_at": "2026-02-23T15:00:00Z",
  "period": { "from": "2026-01-24", "to": "2026-02-23" },
  "users": {
    "total": 1240,
    "active": 1198,
    "suspended": 42,
    "new_in_period": 87,
    "pro_active": 43,
    "free": 1155,
    "conversion_rate_pct": 3.5
  },
  "shelters": {
    "total": 28,
    "active": 25,
    "suspended": 3,
    "verified": 6
  },
  "stores": {
    "total": 47,
    "active": 44,
    "suspended": 3,
    "featured": 5
  },
  "clinics": {
    "total": 0,
    "active": 0,
    "suspended": 0,
    "pro": 0
  },
  "revenue_cop": {
    "total_accumulated": 1850000,
    "in_period": 195000,
    "monthly_subscriptions": 35,
    "annual_subscriptions": 8,
    "arpu": 4535
  },
  "donations_cop": {
    "total_amount": 4200000,
    "in_period": 650000,
    "platform_fees_accumulated": 210000,
    "net_to_shelters": 3990000,
    "total_count": 94,
    "unique_donors": 61,
    "avg_donation": 44680
  },
  "content": {
    "total_pets": 3102,
    "total_reminders": 8741,
    "total_medical_records": 5230,
    "active_adoption_listings": 67,
    "adopted_in_period": 12,
    "blog_posts_published": 12
  }
}
```

---

### **5.13. Sistema de Mantenimiento** ✅ **IMPLEMENTADO**

El sistema de mantenimiento permite a los administradores activar un modo global que restringe el acceso a la plataforma mientras se realizan labores de actualización, migración o soporte crítico. Durante el mantenimiento:

- **Frontend web**: Solo usuarios con rol `admin` pueden acceder al panel administrativo. Los demás usuarios ven una página informativa bloqueando todas las funcionalidades.
- **App móvil**: Muestra una ventana de mantenimiento con mensaje personalizado y hora estimada de retorno.
- **API Backend**: Los endpoints no autenticados (blog público, adopciones, tiendas) quedan accesibles. Los endpoints autenticados retornan `503 Service Unavailable` con información del mantenimiento.

**Migración requerida:** `023_add_maintenance_mode` — agrega tabla `system_config` con campos de mantenimiento.

---

#### **5.13.1. Requerimientos Funcionales**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-1041 | El admin debe poder **activar el modo mantenimiento** desde el panel, especificando un mensaje personalizado y una hora estimada de retorno. | ✅ **IMPLEMENTADO** |
| RF-1042 | El admin debe poder **desactivar el modo mantenimiento** desde el mismo panel, restaurando el acceso normal a todos los usuarios. | ✅ **IMPLEMENTADO** |
| RF-1043 | El **endpoint público** `GET /healthy` debe retornar `{"status":"up"}` o `{"status":"maintenance", "message":"...", "estimated_return":"2026-02-26T10:00:00Z"}` para que clientes (frontend, app móvil) puedan leer el estado sin autenticación. | ✅ **IMPLEMENTADO** |
| RF-1044 | Cuando el modo mantenimiento esté **activo**, todos los endpoints autenticados (excepto aquellos llamados por usuarios con rol `admin`) deben retornar `503 Service Unavailable` con el cuerpo: `{"error":"Servicio en mantenimiento","message":"...","estimated_return":"..."}`. | ✅ **IMPLEMENTADO** |
| RF-1045 | Los endpoints **públicos** (blog, adopciones, tiendas, directorio de clínicas, registros de nuevos usuarios) deben permanecer **accesibles durante el mantenimiento** para no bloquear la experiencia de navegación pública. | ✅ **IMPLEMENTADO** |
| RF-1046 | Cuando mantenimiento esté **activo**, usuarios autenticados con rol `admin` pueden usar **todos los endpoints** normalmente, incluyendo la gestión de usuarios y estadísticas. | ✅ **IMPLEMENTADO** |

---

#### **5.13.2. Endpoints**

```
# Información de mantenimiento (PÚBLICO, sin autenticación)
GET    /healthy                                → Estado global del sistema

# Gestión de mantenimiento (requiere admin JWT)
GET    /api/admin/maintenance                  → Obtener estado actual del mantenimiento
PATCH  /api/admin/maintenance/activate         → Activar modo mantenimiento (body: { "message": "...", "estimated_return": "2026-02-26T10:00:00Z" })
PATCH  /api/admin/maintenance/deactivate       → Desactivar modo mantenimiento
```

---

#### **5.13.3. Ejemplos de Respuesta**

**`GET /healthy` — Sistema Normal**
```json
{
  "status": "up",
  "timestamp": "2026-02-25T14:30:00Z"
}
```

**`GET /healthy` — Sistema en Mantenimiento**
```json
{
  "status": "maintenance",
  "message": "Realizando actualización de la plataforma. Disculpa las molestias.",
  "estimated_return": "2026-02-26T02:00:00Z",
  "timestamp": "2026-02-25T22:00:00Z"
}
```

**`GET /api/admin/maintenance` — Estado Actual (Admin)**
```json
{
  "is_active": true,
  "message": "Realizando actualización de la plataforma. Disculpa las molestias.",
  "estimated_return": "2026-02-26T02:00:00Z",
  "activated_at": "2026-02-25T22:00:00Z",
  "activated_by_admin_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Endpoint Autenticado Durante Mantenimiento (para usuarios no-admin)**
```
GET /api/pets/:id
→ 503 Service Unavailable

{
  "error": "Servicio en mantenimiento",
  "message": "Realizando actualización de la plataforma. Disculpa las molestias.",
  "estimated_return": "2026-02-26T02:00:00Z"
}
```

---

#### **5.13.4. Flujo de Implementación Técnica**

1. **Tabla `system_config`** (PostgreSQL):
   ```sql
   CREATE TABLE system_config (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     key VARCHAR(255) NOT NULL UNIQUE,
     value TEXT,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   INSERT INTO system_config (key, value) VALUES
     ('maintenance_active', 'false'),
     ('maintenance_message', ''),
     ('maintenance_estimated_return', NULL),
     ('maintenance_activated_at', NULL),
     ('maintenance_activated_by', NULL);
   ```

2. **Middleware de Mantenimiento** (`internal/middleware/maintenance.go`):
   - Consulta `system_config` al inicio de cada request
   - Si `maintenance_active = true` y el usuario NO es admin → retorna 503
   - Inyecta información de mantenimiento en el contexto para respuestas dinámicas

3. **Use Cases** (`internal/modules/admin/application/`):
   - `ActivateMaintenanceModeUseCase` — actualiza `system_config`
   - `DeactivateMaintenanceModeUseCase` — restaura estado normal
   - `GetMaintenanceStatusUseCase` — retorna estado actual

4. **Handler** (`internal/handlers/admin.go`):
   - `GET /api/admin/maintenance` → obtiene estado
   - `PATCH /api/admin/maintenance/activate` → activa modo
   - `PATCH /api/admin/maintenance/deactivate` → desactiva modo

5. **Endpoint Público** (`internal/handlers/health.go` — ya existe):
   - Actualizar `GET /healthy` para incluir estado de mantenimiento

---

#### **5.13.5. Comportamiento en Clientes**

**Frontend (Nuxt.js):**
```javascript
// Al cargar la app, check inicial
async function checkSystemStatus() {
  const res = await fetch('/healthy');
  const data = await res.json();

  if (data.status === 'maintenance') {
    // Mostrar pantalla de mantenimiento
    showMaintenancePage(data.message, data.estimated_return);
    // Si usuario NO está logueado como admin → bloquear acceso
    // Si usuario es admin → permitir acceso normal al panel
  }
}
```

**App Móvil (Flutter):**
```dart
Future<void> checkMaintenanceStatus() async {
  final response = await http.get(Uri.parse('$apiBase/healthy'));
  final data = jsonDecode(response.body);

  if (data['status'] == 'maintenance') {
    showMaintenanceDialog(
      message: data['message'],
      estimatedReturn: data['estimated_return'],
    );
    // Bloquear navegación a funcionalidades, salvo para admin
  }
}
```

---

#### **5.13.6. Consideraciones Adicionales**

- **Caché**: Para evitar consultas constantes a BD, cachear `system_config` en memoria con TTL de 30-60 segundos.
- **Logs de auditoría**: Registrar quién activó/desactivó el mantenimiento con timestamp.
- **Notificación previa**: Opcionalmente, enviar emails a admins antes de activar.
- **Status Page**: Integración futura con página externa de estado (StatusPage.io, etc.).

---

## **6\. 🧱 Requerimientos No Funcionales**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RNF-001 | El backend debe estar implementado en **Go** usando el framework **Gin**. | ✅ **IMPLEMENTADO** |
| RNF-002 | La arquitectura del backend debe seguir principios de **DDD, Hexagonal y Vertical Slicing**. | ✅ **IMPLEMENTADO** |
| RNF-003 | La persistencia de datos debe realizarse con **GORM** y **Supabase (PostgreSQL)**. | ✅ **IMPLEMENTADO** |
| RNF-004 | El backend debe ser **independiente de frameworks** en su dominio y aplicación. | ✅ **IMPLEMENTADO** |
| RNF-005 | Debe soportar al menos 10,000 usuarios concurrentes a nivel API (escalable en infraestructura). | ✅ **IMPLEMENTADO** |
| RNF-006 | El sistema debe implementar **rate limiting** para prevenir ataques de fuerza bruta. | ✅ **IMPLEMENTADO** |
| RNF-007 | El sistema debe incluir **validación de entrada** en todos los endpoints. | ✅ **IMPLEMENTADO** |
| RNF-008 | El sistema debe incluir **documentación Swagger** de la API. | ✅ **IMPLEMENTADO** |
| RNF-009 | El sistema debe incluir **sistema de migraciones** versionado para la base de datos. | ✅ **IMPLEMENTADO** |
| RNF-010 | El sistema debe incluir **tests unitarios** y de integración. | ✅ **IMPLEMENTADO** |

---

## **7\. 🛠️ Arquitectura de Software**

### **7.0. Visión de Sistema**

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTES                               │
│  ┌─────────────────┐   ┌──────────────────────────────┐  │
│  │  Nuxt.js (Web)  │   │     Flutter (iOS / Android)  │  │
│  │  SSR/SSG · Vue3 │   │     App nativa multi-plat.   │  │
│  └────────┬────────┘   └──────────────┬───────────────┘  │
└───────────┼──────────────────────────┼──────────────────┘
            │  HTTP/REST (JSON)         │  HTTP/REST (JSON)
            ▼                          ▼
┌──────────────────────────────────────────────────────────┐
│              Backend API REST — Go + Gin                  │
│   Hexagonal Architecture · DDD · Vertical Slicing         │
│   JWT Auth · Rate Limiting · Migrations                    │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
             ┌─────────────────────────┐
             │  Supabase (PostgreSQL)  │
             │  Managed DB + Storage   │
             └─────────────────────────┘
```

**Backend en Go con estructura implementada (13 módulos):**

```
internal/
├── handlers/              # Manejadores HTTP
│   ├── health.go         # Health check + mantenimiento
│   ├── user.go           # Gestión de usuarios
│   ├── pet.go            # Gestión de mascotas
│   ├── reminder.go       # Gestión de recordatorios
│   ├── medical_record.go # Gestión de historial médico
│   ├── pdf.go            # Exportación PDF
│   ├── shelter.go        # Gestión de refugios
│   ├── adoption.go       # Gestión de adopciones
│   ├── adoption_request.go # Solicitudes de adopción
│   ├── blog.go           # Blog editorial
│   ├── store.go          # Tiendas pet-friendly
│   ├── clinic.go         # Clínicas veterinarias
│   ├── payment.go        # Pagos y suscripciones
│   ├── donation.go       # Donaciones
│   └── admin.go          # Panel administrativo
├── infrastructure/        # Implementaciones concretas
│   ├── auth/             # Autenticación JWT (HS256, 24h)
│   ├── config/           # Configuración y env
│   ├── email/            # Servicio de email (Mailtrap)
│   ├── storage/          # Almacenamiento de archivos (local)
│   ├── payu/             # Pasarela PayU (real + mock)
│   └── migrations/       # Migraciones de BD (023 versiones)
├── middleware/            # Middleware
│   ├── auth.go           # JWT Bearer + is_active check
│   ├── rate_limiter.go   # Rate limiting (100 req/min por IP)
│   ├── role.go           # RequireUser/Shelter/Store/Clinic/Admin
│   └── maintenance.go    # Maintenance mode con caché TTL 30s
└── modules/              # Módulos con arquitectura hexagonal
    ├── health/           # Health check
    ├── user/             # Usuarios (registro, login, PRO, admin)
    ├── pet/              # Mascotas (CRUD, soft delete)
    ├── reminder/         # Recordatorios (CRUD)
    ├── medicalrecord/    # Historial médico (CRUD, ordenado DESC)
    ├── pdf/              # Exportación PDF (solo lectura, usa repos)
    ├── shelter/          # Refugios (registro, login, verificación)
    ├── adoption/         # Adopciones (listados: available|reserved|adopted)
    ├── adoptionrequest/  # Solicitudes de adopción
    ├── blog/             # Blog (CRUD admin + lectura pública)
    ├── store/            # Tiendas pet-friendly (CRUD productos)
    ├── clinic/           # Clínicas veterinarias (B2B, plan free|pro)
    ├── payment/          # Pagos PayU (suscripción PRO)
    ├── donation/         # Donaciones a refugios (5% fee)
    └── admin/            # Panel administrativo (35 use cases)
```

**Estructura hexagonal (cada módulo):**
- `domain/model/` — entidades del dominio
- `domain/port/` — interfaces de puertos (repositorio)
- `application/` — casos de uso/lógica de negocio
- `infrastructure/persistence/` — implementaciones GORM

### **7.1. Principios Arquitectónicos**

- **Hexagonal Architecture (Puertos & Adaptadores)**: Aislamiento del dominio de la infraestructura
- **Domain-Driven Design (DDD)**: Lenguaje ubicuo, agregados y entidades del dominio
- **Vertical Slicing**: Cada módulo es una "rebanada" vertical independiente
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

### **7.2. Flujo de Petición**

```
HTTP Request
  ↓ (Rate Limiter: 100 req/min por IP)
  ↓ (Gin Router)
  ↓ (AuthMiddleware: valida JWT, inyecta contexto)
  ↓ (MaintenanceModeMiddleware: verifica sistema en mantenimiento)
  ↓ (RequireRole: valida entity_type e is_admin)
  ↓ (Handler: valida entrada, llama use case)
  ↓ (Use Case: lógica de negocio)
  ↓ (Repository: acceso a datos)
  ↓ (PostgreSQL/Supabase)
  ↑ (JSON Response)
```

### **7.3. Autenticación & Autorización**

- **JWT (HS256)**: Token con claims `user_id`, `email`, `entity_type` (user|shelter|store|clinic), `is_admin`, `exp` (24h)
- **AuthMiddleware**: Valida Bearer token, inyecta valores en contexto Gin, verifica `is_active` en DB (contra suspensión de cuenta)
- **Role Middleware**: 5 funciones - `RequireUser()`, `RequireShelter()`, `RequireStore()`, `RequireClinic()`, `RequireAdmin()`
- **Account Suspension**: Admins pueden suspender cuentas sin invalidar JWT — middleware las bloquea en cada request

### **7.4. Mantenimiento del Sistema (5.13)**

- **MaintenanceModeMiddleware**: Retorna 503 para usuarios no-admin cuando el sistema está en mantenimiento
- **CachedMaintenanceChecker**: Caché en memoria con TTL 30s — evita queries repetidas a BD
- **Endpoints de Control**: `GET /api/admin/maintenance`, `PATCH /api/admin/maintenance/activate`, `PATCH /api/admin/maintenance/deactivate`
- **Health Endpoint**: `GET /healthy` (público) retorna `{"status":"up"}` o `{"status":"maintenance",...}`

### **7.5. Persistencia e Infraestructura**

- **GORM**: ORM para PostgreSQL, migraciones explícitas (nunca AutoMigrate)
- **Supabase**: PostgreSQL gestionado + almacenamiento de archivos
- **Migraciones**: 23 migraciones versionadas — cada una es una clase Go que implementa `MigrationInterface`
- **Local File Storage**: Almacena fotos de perfil, mascotas, y portadas de clínicas en `storage/`
- **Email**: Servicio Mailtrap para recuperación de contraseña
- **Payment Gateway**: PayU (real en producción, mock en desarrollo) para suscripciones PRO y donaciones

### **7.6. Especificidades Técnicas**

**Rate Limiting:**
- 100 peticiones por minuto por dirección IP
- Protege contra ataques de fuerza bruta

**Handlers:**
- Inyectan use cases por interfaz, no tipos concretos
- Validación de entrada en cada handler
- Respuestas JSON + HTTP status codes apropiados

**Errores de Negocio:**
- Errores del dominio son sentinelas Go (`errors.Is()`, no `==`)
- Handlers los mapean a respuestas HTTP

**Testing:**
- Mocks de repositorio en `tests/mocks/`
- Tests de use cases, handlers e integración
- Cobertura con `testify/assert` y `testify/require`

---

## **8\. 📈 Plan de Escalabilidad**

### **8.1. Funcionalidades Implementadas en MVP Extendido** ✅

Las siguientes fueron originalmente planeadas como post-MVP pero **ya están completamente implementadas**:

- ✅ **📰 Blog editorial** — Gestión completa de artículos (CRUD admin), lectura pública, slug para SEO (5.7)
- ✅ **🏪 Directorio de tiendas pet-friendly** — Registro de tiendas, catálogo de productos, contacto por WhatsApp (5.8)
- ✅ **🐾 Sistema de adopciones** — Refugios publican listados, usuarios solicitan adopción, estado tracking (5.6)
- ✅ **🏥 Clínicas veterinarias B2B** — Registro, autenticación, agenda Pro, vinculación con mascotas, historial médico (5.10)
- ✅ **💳 Monetización completa** — Suscripción PRO vía PayU, donaciones a refugios (5% fee), sistema de transacciones (5.9)
- ✅ **📊 Panel administrativo** — Gestión de usuarios, refugios, tiendas, clínicas, estadísticas completas (5.11 + 5.12)
- ✅ **🔧 Sistema de mantenimiento** — Modo mantenimiento global con acceso exclusivo para admins (5.13)

### **8.2. Funcionalidades Post-MVP Futuras**

Mejoras planificadas para versiones futuras:

* 🔔 **Notificaciones push** — Firebase Cloud Messaging (FCM) para recordatorios, donaciones y adopciones
* 🧠 **IA para síntomas** — Análisis automático de síntomas mediante modelos IA (OpenAI/similar)
* 🌍 **Internacionalización** — Soporte para múltiples idiomas y monedas
* 📱 **Notificaciones en tiempo real** — WebSockets para actualizaciones instantáneas (adopción, mensajes)
* 🎬 **Contenido multimedia** — Video tutoriales de cuidado animal
* 🏆 **Gamificación** — Insignias, logros, puntos por acciones (recordatorios completados, etc.)
* 📈 **Integración Analytics** — Google Analytics, Mixpanel para product insights
* 🔐 **2FA/Biometría** — Autenticación multi-factor en app móvil

---

## **9\. 🎯 KPIs y Métricas Clave**

### **9.1. Métricas de Usuarios**
- **DAU/MAU**: Usuarios activos diarios/mensuales (disponible en `GET /api/admin/stats/users`)
- **Tasa de conversión a PRO**: % de usuarios free que upgradean a PRO (ARPU en revenue stats)
- **Tasa de churn PRO**: % de usuarios que cancelan suscripción (en análisis de retention)
- **Distribución geográfica**: Top países y ciudades con usuarios (disponible en `GET /api/admin/stats/users`)
- **Usuarios verificados vs no verificados**: Tracking de penetración de features
- **Crecimiento neto**: Usuarios nuevos - usuarios suspendidos (por período)

### **9.2. Métricas de Mascotas y Recordatorios**
- **Promedio de mascotas por usuario**: Total mascotas / Total usuarios (en `stats/content`)
- **Recordatorios creados por mascota**: Promedio de recordatorios / número de mascotas
- **Recordatorios completados**: Tasa de adherencia a recordatorios programados
- **Total mascotas por categoría (especie)**: Perros vs gatos vs otros
- **Tasa de actualización de registros médicos**: Registros médicos activos vs totales

### **9.3. Métricas de Monetización**
- **Ingresos acumulados (COP)**: Total revenue histórico (disponible en `stats/revenue`)
- **Ingresos en período (COP)**: Revenue mensual/anual (filtrable por fecha)
- **ARPU (Average Revenue Per User)**: Ingresos PRO / usuarios PRO activos
- **Transacciones aprobadas**: Total de pagos exitosos vs rechazados
- **Tasa de conversión de checkout**: Checkouts iniciados vs completados
- **Revenue by plan**: Ingresos por tipo de suscripción (monthly vs annual)
- **LTV (Lifetime Value)**: Ingreso promedio por usuario durante su vida útil

### **9.4. Métricas de Donaciones**
- **Donaciones totales (COP)**: Total acumulado (disponible en `stats/donations`)
- **Donaciones en período**: Por rango de fechas
- **Promedio y máximo de donación**: Donor insights
- **Cantidad de donantes únicos**: Donor base
- **Top refugios donados**: Refugios que más reciben donaciones
- **Comisión platform (5%)**: Fee retenida vs neto a refugios
- **Distribución por refugio**: Donaciones concentradas vs dispersas

### **9.5. Métricas de Adopciones**
- **Listados de adopción activos**: Total de mascotas en adopción por estado
- **Adopciones completadas**: Listados con status = "adopted"
- **Tasa de conversión**: Listados disponibles → adoptados
- **Tiempo promedio en adopción**: Días desde listado hasta adoption
- **Top refugios**: Refugios con más adopciones completadas
- **Solicitudes de adopción pendientes**: Por procesar

### **9.6. Métricas de Blog y Contenido**
- **Artículos publicados**: Total de posts en estado "published" (en `stats/content`)
- **Engagement de blog**: Vistas, compartidos, comentarios (futuro)
- **Categorías populares**: Contenido más consultado
- **SEO metrics**: Traffic orgánico por artículo (integración futura)

### **9.7. Métricas de Clínicas y Tiendas**
- **Clínicas verificadas**: % de clínicas verificadas vs totales
- **Clínicas plan PRO**: Clínicas con suscripción activa
- **Tiendas destacadas**: Tiendas en plan featured
- **Productos en catálogo**: Total de productos por tienda
- **Cobertura geográfica**: Clínicas y tiendas por país/ciudad

### **9.8. Métrica de Sistema**
- **Requests por minuto**: Tráfico en tiempo real (rate limiter en `/middleware/rate_limiter.go`)
- **Uptime/Availability**: % de tiempo que el API está disponible
- **Latencia promedio**: Tiempo de respuesta p50/p95/p99
- **Errores 5xx**: Tasa de errores del servidor
- **Error rate**: Tasa de requests fallidas vs exitosas

---

## **10\. 📦 Entidades del Dominio**

---

### **🧍‍♂️ 10.1. User** ✅ **IMPLEMENTADO**

Representa al propietario o responsable de una o más mascotas.

| Campo | Tipo | Requerido | Descripción | Estado |
| ----- | ----- | ----- | ----- | ----- |
| `id` | uint (auto_increment) | ✅ | Identificador único del usuario. | ✅ **IMPLEMENTADO** |
| `name` | string | ✅ | Primer nombre del usuario. | ✅ **IMPLEMENTADO** |
| `last_name` | string | ✅ | Apellido del usuario. | ✅ **IMPLEMENTADO** |
| `email` | string | ✅ | Correo electrónico único. | ✅ **IMPLEMENTADO** |
| `password` | string | ✅ | Contraseña hasheada con bcrypt. | ✅ **IMPLEMENTADO** |
| `country` | string | ✅ | País de residencia (ej. Colombia, México). | ✅ **IMPLEMENTADO** |
| `city` | string | ✅ | Ciudad donde reside. | ✅ **IMPLEMENTADO** |
| `phone_country_code` | string | ✅ | Código de país del teléfono (ej: +34). | ✅ **IMPLEMENTADO** |
| `phone` | string | ✅ | Número de teléfono sin código de país. | ✅ **IMPLEMENTADO** |
| `profile_picture_url` | string | ❌ | URL de foto de perfil del usuario (opcional). | ✅ **IMPLEMENTADO** |
| `birth_date` | time.Time | ❌ | Fecha de nacimiento del usuario (opcional). | ✅ **IMPLEMENTADO** |
| `is_pro` | bool | ❌ | Indica si el usuario tiene acceso PRO (default false). | ✅ **IMPLEMENTADO** |
| `password_reset_token` | string | ❌ | Token para recuperación de contraseña. | ✅ **IMPLEMENTADO** |
| `password_reset_expires` | time.Time | ❌ | Fecha de expiración del token. | ✅ **IMPLEMENTADO** |
| `created_at` | time.Time | ✅ | Fecha de creación. | ✅ **IMPLEMENTADO** |
| `updated_at` | time.Time | ✅ | Última modificación. | ✅ **IMPLEMENTADO** |
| `deleted_at` | gorm.DeletedAt | ❌ | Soft delete. | ✅ **IMPLEMENTADO** |

---

### **🐶 10.2. Pet** ✅ **IMPLEMENTADO**

| Campo | Tipo | Requerido | Descripción | Estado |
| ----- | ----- | ----- | ----- | ----- |
| `id` | uint (auto_increment) | ✅ | Identificador único de la mascota. | ✅ **IMPLEMENTADO** |
| `user_id` | uint | ✅ | Referencia al usuario propietario. | ✅ **IMPLEMENTADO** |
| `name` | string | ✅ | Nombre de la mascota. | ✅ **IMPLEMENTADO** |
| `species` | string | ✅ | Especie (perro, gato, etc.). | ✅ **IMPLEMENTADO** |
| `breed` | string | ❌ | Raza de la mascota. | ✅ **IMPLEMENTADO** |
| `age` | int | ❌ | Edad aproximada. | ✅ **IMPLEMENTADO** |
| `weight` | float | ❌ | Peso en kg o libras. | ✅ **IMPLEMENTADO** |
| `gender` | string | ❌ | Género de la mascota. | ✅ **IMPLEMENTADO** |
| `photo_url` | string | ✅ | Foto de la mascota (obligatorio). | ✅ **IMPLEMENTADO** |
| `notes` | string | ❌ | Observaciones o comentarios generales. | ✅ **IMPLEMENTADO** |
| `created_at` | datetime | ✅ | Fecha de creación. | ✅ **IMPLEMENTADO** |
| `updated_at` | datetime | ✅ | Última modificación. | ✅ **IMPLEMENTADO** |
| `deleted_at` | gorm.DeletedAt | ❌ | Soft delete. | ✅ **IMPLEMENTADO** |
| `user` | User | ❌ | Relación con el usuario propietario. | ✅ **IMPLEMENTADO** |

---

### **⏰ 10.3. Reminder** ✅ **IMPLEMENTADO**

| Campo | Tipo | Requerido | Descripción | Estado |
| ----- | ----- | ----- | ----- | ----- |
| `id` | uint (auto_increment) | ✅ | Identificador único. | ✅ **IMPLEMENTADO** |
| `pet_id` | uint | ✅ | Referencia a la mascota. | ✅ **IMPLEMENTADO** |
| `type` | string | ✅ | Tipo: vacuna, medicina, baño, etc. | ✅ **IMPLEMENTADO** |
| `title` | string | ✅ | Título o resumen. | ✅ **IMPLEMENTADO** |
| `scheduled_date` | datetime | ✅ | Fecha programada del evento. | ✅ **IMPLEMENTADO** |
| `notes` | string | ❌ | Comentarios adicionales. | ✅ **IMPLEMENTADO** |
| `created_at` | datetime | ✅ | Fecha de creación. | ✅ **IMPLEMENTADO** |
| `updated_at` | datetime | ✅ | Última modificación. | ✅ **IMPLEMENTADO** |

---

### **🧾 10.4. MedicalRecord** ✅ **IMPLEMENTADO**

| Campo | Tipo | Requerido | Descripción | Estado |
| ----- | ----- | ----- | ----- | ----- |
| `id` | uint (auto_increment) | ✅ | Identificador único. | ✅ **IMPLEMENTADO** |
| `pet_id` | uint | ✅ | Referencia a la mascota. | ✅ **IMPLEMENTADO** |
| `date` | datetime | ✅ | Fecha del evento médico. | ✅ **IMPLEMENTADO** |
| `symptoms` | string | ❌ | Síntomas observados. | ✅ **IMPLEMENTADO** |
| `diagnosis` | string | ❌ | Diagnóstico otorgado. | ✅ **IMPLEMENTADO** |
| `treatment` | string | ❌ | Tratamiento aplicado. | ✅ **IMPLEMENTADO** |
| `notes` | string | ❌ | Comentarios adicionales. | ✅ **IMPLEMENTADO** |
| `created_at` | datetime | ✅ | Fecha de creación. | ✅ **IMPLEMENTADO** |
| `updated_at` | datetime | ✅ | Última modificación. | ✅ **IMPLEMENTADO** |
| `deleted_at` | datetime | ❌ | Soft delete. | ✅ **IMPLEMENTADO** |

---

## **11\. 🔐 Seguridad Implementada**

### **11.1. Autenticación y Autorización**
- ✅ **JWT (HS256)** — Token con 24h expiry, claims: `user_id`, `email`, `entity_type` (user|shelter|store|clinic), `is_admin`
- ✅ **Middleware de autenticación** — Valida Bearer token, inyecta valores en contexto, retorna 401 si inválido
- ✅ **Hashing de contraseñas** — bcrypt con salt + cost factor (GORM automático)
- ✅ **Validación de tokens** — En cada request protected; token signature verificada con JWT_SECRET_KEY
- ✅ **Entity Type enforcement** — Cada entidad (user/shelter/store/clinic) tiene su JWT separado
- ✅ **Type-safe role checking** — Middleware usa type assertions con checks (`ok`) antes de usar valores

### **11.2. Account Suspension (Sin invalidar JWT)**
- ✅ **Campo `is_active BOOLEAN`** en users, shelters, stores, clinics (migration 022)
- ✅ **Verificación en AuthMiddleware** — Consulta DB en cada request (si `db != nil`), retorna 401 si `is_active = false`
- ✅ **Suspensión instantánea** — No requiere que el usuario cierre sesión
- ✅ **Reactivación** — Admin puede reactivar la cuenta desde `/api/admin/users/{id}/activate`
- ✅ **Bypass para tests** — `AuthMiddleware(nil)` omite la verificación (para tests unitarios)

### **11.3. Autorización basada en Roles**
- ✅ **Middleware de roles** — `RequireUser()`, `RequireShelter()`, `RequireStore()`, `RequireClinic()`, `RequireAdmin()`
- ✅ **Validación de entity_type** — Solo permite acceso si el JWT tiene el tipo correcto
- ✅ **Admin check type-safe** — Valida `is_admin` como `bool` con type assertion antes de usar
- ✅ **Ownership validation** — Handlers verifican que el usuario sea propietario del recurso
- ✅ **Sanctuary check** — Se bloquea acceso cruzado entre entidades (usuario no puede actuar como refugio, etc.)

### **11.4. Rate Limiting**
- ✅ **Límite de 100 solicitudes por minuto** por dirección IP
- ✅ **Headers de rate limiting** — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- ✅ **Respuesta 429** — Cuando se excede el límite con retry-after
- ✅ **Protección contra ataques de fuerza bruta** — Afecta login, forgot-password, reset-password

### **11.5. Validación de Datos**
- ✅ **Validación de entrada** — Todos los endpoints validan request body/params
- ✅ **Validación de email** — RFC 5322 format check
- ✅ **Validación de contraseñas** — Mínimo 6 caracteres, verificación en login
- ✅ **Sanitización de datos** — GORM previene SQL injection automáticamente
- ✅ **Límites de tamaño** — Multipart uploads limitados (fotos, PDFs)
- ✅ **Validación de tipos** — Type checking en handlers, conversión segura de uint/string

### **11.6. Recuperación de Contraseña Segura**
- ✅ **Tokens seguros** — 32 bytes aleatorios (base58 encoded)
- ✅ **Expiración de tokens** — 1 hora máximo
- ✅ **One-time use** — Token se limpia tras uso exitoso
- ✅ **Envío por email** — Mailtrap en desarrollo, SMTP seguro en producción
- ✅ **Enlace seguro** — URL con token incluido, requiere reset inmediato
- ✅ **Limpieza automática** — Tokens expirados se descartan

### **11.7. Soft Delete & Data Privacy**
- ✅ **Soft delete** — Usuarios y mascotas tienen campo `deleted_at` (GORM DeletedAt)
- ✅ **GORM automático** — Consultas normales excluyen registros eliminados
- ✅ **Recuperación de datos** — Posible mediante consultas Unscoped (solo para admins)
- ✅ **Datos archivados** — No se pierden, disponibles para auditoría y compliance

### **11.8. Mantenimiento del Sistema Seguro**
- ✅ **Maintenance mode con caché** — TTL 30s, evita consultas repetidas a BD
- ✅ **Admin bypass** — Admins pueden acceder durante mantenimiento (verificado en middleware)
- ✅ **Endpoints públicos siguen activos** — Blog, adopciones, tiendas, clínicas no se bloquean
- ✅ **503 seguro** — Endpoints autenticados retornan 503 sin información sensible

### **11.9. Protección contra Ataques Comunes**

**SQL Injection:**
- ✅ **GORM con prepared statements** — Todas las queries parametrizadas
- ✅ **Operadores GORM** — `Where()`, `Scan()`, `Updates()` previenen inyección

**XSS (Cross-Site Scripting):**
- ✅ **JSON responses** — No hay HTML rendering en API
- ✅ **Content-Type headers** — `application/json` previene ejecución de scripts

**CSRF (Cross-Site Request Forgery):**
- ✅ **JWT stateless** — No requiere cookies, CSRF innato
- ✅ **SameSite cookies** — Si se usan cookies (futuro)

**Información Disclosure:**
- ✅ **Error messages seguros** — No exponen detalles internos (DB queries, stack traces)
- ✅ **HTTP status codes apropiados** — 400, 401, 403, 404, 500 con mensajes genéricos

**Brute Force:**
- ✅ **Rate limiting** — 100 req/min por IP protege endpoints de autenticación
- ✅ **Account suspension** — Admins pueden suspender cuentas sospechosas

**IDOR (Insecure Direct Object Reference):**
- ✅ **Ownership checks** — Handlers verifican que el usuario sea propietario antes de retornar datos
- ✅ **404 vs 403** — Retorna 404 si el recurso no existe o no pertenece al usuario

### **11.10. Gestión de Secretos**
- ✅ **JWT_SECRET_KEY** — En variable de entorno, nunca hardcoded
- ✅ **Database credentials** — En variables de entorno (Supabase connection string)
- ✅ **Email credentials** — Mailtrap API keys en .env
- ✅ **PayU credentials** — API keys y merchant ID en .env
- ✅ **.env.example** — Plantilla sin valores reales

### **11.11. Logging y Auditoría**
- ✅ **GORM logging** — Queries logeadas en modo debug (controlable por GORM_LOG_LEVEL)
- ✅ **Request/response logs** — Disponibles en producción vía stdout (Docker/K8s)
- ✅ **Error tracking** — Stack traces visibles en modo debug, escondidos en producción
- ✅ **Auditoría de cambios admin** — Historial de cambios por admin almacenado en DB (campos `activated_by_admin_id` en mantenimiento)

---

## **12\. 📊 Endpoints Implementados**

### **12.1. Gestión de Usuarios**
- `POST /users` - Crear usuario (con soporte para multipart/form-data)
- `POST /login` - Iniciar sesión
- `POST /forgot-password` - Solicitar recuperación de contraseña
- `POST /reset-password` - Resetear contraseña con token
- `GET /api/users/{id}` - Obtener usuario (requiere autenticación)
- `POST /api/users/{id}/upgrade-pro` - Activar cuenta PRO (requiere autenticación; solo el propio usuario)

### **12.2. Gestión de Mascotas**
- `POST /api/pets` - Crear mascota (requiere autenticación, multipart/form-data)
- `GET /api/pets/{id}` - Obtener mascota por ID (requiere autenticación)
- `GET /api/pets` - Obtener todas las mascotas del usuario autenticado (requiere autenticación)
- `PUT /api/pets/{id}` - Actualizar mascota (requiere autenticación, multipart/form-data)
- `DELETE /api/pets/{id}` - Eliminar mascota (requiere autenticación, soft delete)

### **12.3. Gestión de Recordatorios**
- `POST /api/reminders` - Crear recordatorio (requiere autenticación)
- `GET /api/reminders/{id}` - Obtener recordatorio por ID (requiere autenticación)
- `GET /api/pets/{petId}/reminders` - Obtener recordatorios por mascota (requiere autenticación)
- `PUT /api/reminders/{id}` - Actualizar recordatorio (requiere autenticación)
- `DELETE /api/reminders/{id}` - Eliminar recordatorio (requiere autenticación, soft delete)

**Comportamiento del endpoint `GET /api/pets`:**
- **Con mascotas**: Retorna array de mascotas del usuario autenticado
- **Sin mascotas**: Retorna mensaje `{"message": "No existen mascotas para este usuario"}`
- **Sin autenticación**: Retorna error 401 Unauthorized

### **12.4. Historial Médico**
- `POST /api/medical-records` - Crear registro médico (requiere autenticación)
- `GET /api/medical-records/{id}` - Obtener registro médico por ID (requiere autenticación)
- `GET /api/pets/{petId}/medical-records` - Obtener historial médico por mascota, orden cronológico DESC (requiere autenticación)
- `PUT /api/medical-records/{id}` - Actualizar registro médico (requiere autenticación)
- `DELETE /api/medical-records/{id}` - Eliminar registro médico (requiere autenticación, soft delete)

### **12.5. Exportación PDF**
- `GET /api/pets/{id}/export` - Descargar PDF del perfil + historial médico (requiere autenticación y ser usuario PRO)

### **12.6. Refugios**
- `POST /shelters/register` - Registrar refugio
- `POST /shelters/login` - Login de refugio
- `GET /api/shelters/{id}` - Obtener perfil del refugio (requiere auth shelter)
- `PUT /api/shelters/{id}` - Actualizar perfil del refugio (requiere auth shelter)

### **12.7. Adopciones**
- `GET /api/adoption-listings` - Listar mascotas disponibles en adopción (requiere auth)
- `GET /api/adoption-listings/{id}` - Ver detalle de mascota en adopción (requiere auth)
- `POST /api/adoption-listings` - Crear listado de adopción (solo refugios)
- `PUT /api/adoption-listings/{id}` - Actualizar listado (solo refugio propietario)
- `DELETE /api/adoption-listings/{id}` - Eliminar listado (solo refugio propietario)
- `GET /api/adoption-listings/{id}/requests` - Ver solicitudes recibidas (solo refugio propietario)
- `POST /api/adoption-listings/{id}/requests` - Enviar solicitud de adopción (solo usuarios)
- `PUT /api/adoption-requests/{id}` - Aprobar o rechazar solicitud (solo refugio)
- `GET /api/adoption-requests/my` - Ver mis solicitudes enviadas (solo usuarios)

### **12.8. Blog Editorial**
- `GET /blog/posts` - Listar artículos publicados (público, sin auth; query param `?category=salud`)
- `GET /blog/posts/:slug` - Leer artículo publicado por slug (público, sin auth)
- `POST /api/blog/posts` - Crear artículo (requiere admin JWT)
- `GET /api/blog/posts/:id` - Obtener artículo por ID, cualquier estado (requiere admin JWT)
- `PUT /api/blog/posts/:id` - Actualizar artículo (requiere admin JWT)
- `DELETE /api/blog/posts/:id` - Eliminar artículo (requiere admin JWT)
- `PATCH /api/blog/posts/:id/publish` - Publicar o despublicar artículo (requiere admin JWT)

### **12.9. Monetización y Pagos**
- `POST /api/users/{id}/subscribe` - Iniciar checkout PayU para suscripción PRO (requiere auth usuario; body: `{ "plan": "pro_monthly" | "pro_annual" }`)
- `GET /api/users/{id}/subscription` - Estado de suscripción activa (requiere auth usuario)
- `POST /webhooks/payu/subscription` - Webhook PayU para confirmación de pago PRO (público, form-data)
- `POST /api/shelters/{id}/donate` - Iniciar donación a un refugio vía PayU (requiere auth usuario; body: `{ "amount", "currency", "message" }`)
- `POST /webhooks/payu/donation` - Webhook PayU para confirmación de donación (público, form-data)
- `GET /api/donations/my` - Historial de donaciones del usuario autenticado (requiere auth usuario)
- `GET /api/shelters/{id}/donations` - Donaciones recibidas por el refugio + total acumulado (requiere auth shelter propietario)

### **12.10. Tiendas Pet-Friendly**
- `POST /stores/register` - Registrar tienda (multipart/form-data con logo)
- `POST /stores/login` - Login de tienda (retorna JWT con `entity_type: "store"`)
- `GET /api/stores` - Listar tiendas públicas (requiere auth)
- `GET /api/stores/{id}` - Ver perfil público de tienda (requiere auth)
- `PUT /api/stores/{id}` - Actualizar perfil de tienda (requiere auth store propietaria)
- `POST /api/stores/{id}/products` - Agregar producto al catálogo (requiere auth store)
- `GET /api/stores/{id}/products` - Listar productos de una tienda (requiere auth)
- `PUT /api/store-products/{id}` - Actualizar producto (requiere auth store propietaria)
- `DELETE /api/store-products/{id}` - Eliminar producto (requiere auth store propietaria)

### **12.11. Panel Administrativo** _(POST-MVP)_
- `GET /api/admin/users` - Listar usuarios con filtros (requiere admin JWT)
- `GET /api/admin/users/{id}` - Detalle completo de usuario (requiere admin JWT)
- `PATCH /api/admin/users/{id}/deactivate` - Suspender cuenta de usuario
- `PATCH /api/admin/users/{id}/activate` - Reactivar cuenta de usuario
- `PATCH /api/admin/users/{id}/grant-pro` - Otorgar PRO manualmente
- `PATCH /api/admin/users/{id}/revoke-pro` - Revocar PRO
- `PATCH /api/admin/users/{id}/grant-admin` - Promover a admin
- `PATCH /api/admin/users/{id}/revoke-admin` - Revocar rol admin
- `GET /api/admin/shelters` - Listar refugios con filtros (requiere admin JWT)
- `GET /api/admin/shelters/{id}` - Detalle completo de refugio
- `PATCH /api/admin/shelters/{id}/deactivate` - Suspender refugio
- `PATCH /api/admin/shelters/{id}/activate` - Reactivar refugio
- `PATCH /api/admin/shelters/{id}/verify` - Marcar refugio como verificado
- `GET /api/admin/stores` - Listar tiendas con filtros (requiere admin JWT)
- `GET /api/admin/stores/{id}` - Detalle completo de tienda
- `PATCH /api/admin/stores/{id}/deactivate` - Suspender tienda
- `PATCH /api/admin/stores/{id}/activate` - Reactivar tienda
- `PATCH /api/admin/stores/{id}/plan` - Actualizar plan de tienda
- `GET /api/admin/clinics` - Listar clínicas (requiere admin JWT; disponible cuando se implemente §5.10)
- `GET /api/admin/clinics/{id}` - Detalle completo de clínica
- `PATCH /api/admin/clinics/{id}/deactivate` - Suspender clínica
- `PATCH /api/admin/clinics/{id}/activate` - Reactivar clínica
- `PATCH /api/admin/clinics/{id}/verify` - Marcar clínica como verificada
- `PATCH /api/admin/clinics/{id}/plan` - Actualizar plan de clínica
- `GET /api/admin/transactions` - Listar transacciones de pago PRO con filtros
- `GET /api/admin/transactions/{id}` - Detalle de transacción individual
- `GET /api/admin/donations` - Listar donaciones con filtros

### **12.12. Estadísticas y Métricas** _(POST-MVP)_
- `GET /api/admin/stats/overview` - Dashboard global consolidado (requiere admin JWT; query: `from`, `to`)
- `GET /api/admin/stats/users` - Métricas de usuarios con distribución geográfica y tasa de conversión
- `GET /api/admin/stats/revenue` - Revenue PRO con serie temporal y ARPU
- `GET /api/admin/stats/donations` - Métricas de donaciones con top refugios y promedios
- `GET /api/admin/stats/content` - Métricas de contenido, mascotas y adopciones

### **12.13. Health Check**
- `GET /healthy` - Verificar estado del sistema

---

## **13\. 🗄️ Base de Datos**

### **13.0. Proveedor: Supabase**

El proyecto usa **Supabase** como plataforma de base de datos gestionada, que provee PostgreSQL compatible con todas las herramientas existentes (GORM, migraciones Go).

**Conexión directa** (recomendada para el backend Go — sesiones persistentes):
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Variables de entorno con Supabase** (reemplazan los valores locales):
```env
DB_HOST=db.[PROJECT_REF].supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[SUPABASE_DB_PASSWORD]
DB_NAME=postgres
DB_SSL_MODE=require
```

> **Nota:** Para producción usar `DB_SSL_MODE=require`. El `PROJECT_REF` y `PASSWORD` se obtienen en el dashboard de Supabase → Settings → Database.

**¿Siguen siendo necesarias las migraciones?** Sí. Supabase no gestiona automáticamente el schema de la aplicación. El sistema de migraciones Go existente es totalmente compatible — funciona sobre PostgreSQL igual que antes. No se requiere adoptar el CLI de Supabase (`supabase migration`).

### **13.1. Migraciones Implementadas**
- ✅ **001_create_users_table** - Tabla principal de usuarios
- ✅ **002_add_birth_date_to_users** - Campo de fecha de nacimiento
- ✅ **003_add_password_reset_fields** - Campos para recuperación de contraseña
- ✅ **004_create_pets_table** - Tabla de mascotas con relaciones
- ✅ **005_create_reminders_table** - Tabla de recordatorios con relaciones
- ✅ **006_create_medical_records_table** - Tabla de historial médico con relaciones
- ✅ **007_add_is_pro_to_users** - Campo `is_pro` para sistema PRO
- ✅ **008_create_shelters_table** - Tabla de refugios/fundaciones
- ✅ **009_create_adoption_listings_table** - Tabla de mascotas en adopción
- ✅ **010_create_adoption_requests_table** - Tabla de solicitudes de adopción
- ✅ **011_add_is_admin_to_users** - Campo `is_admin` para rol administrador en usuarios
- ✅ **012_create_blog_posts_table** - Tabla de artículos del blog editorial
- ✅ **013_create_stores_table** - Tabla de tiendas pet-friendly con índices
- ✅ **014_create_store_products_table** - Tabla de productos de tiendas con constraint de categoría
- ✅ **015_add_subscription_fields_to_users** - Campos `subscription_plan` y `subscription_expires_at` para modelo de suscripción
- ✅ **016_create_payment_transactions_table** - Tabla de transacciones de pago PRO (plan, amount, status, PayU IDs)
- ✅ **017_create_donations_table** - Tabla de donaciones a refugios (amount, platform_fee 5%, shelter_amount 95%)
- ⏳ **018_add_is_active_to_entities** - Campo `is_active` en `users`, `shelters`, `stores` y `clinics` para suspensión de cuentas desde el panel admin

### **13.2. Sistema de Migraciones**
- ✅ **Versionado automático** de migraciones
- ✅ **Comandos de migración** (migrate, rollback, status, list)
- ✅ **Integración con Make** para comandos simplificados
- ✅ **Compatible con Supabase** (PostgreSQL estándar, sin cambios de código)

---

## **14\. 🧪 Testing**

### **14.1. Tests Implementados**
- ✅ **Tests unitarios** para casos de uso
- ✅ **Tests de integración** para handlers
- ✅ **Tests de repositorio** con mocks
- ✅ **Tests de modelo** de dominio

### **14.2. Cobertura de Testing**
- ✅ **User creation** - 100% cubierto
- ✅ **User login** - 100% cubierto
- ✅ **Password reset** - 100% cubierto
- ✅ **User retrieval** - 100% cubierto
- ✅ **Pet creation** - 100% cubierto
- ✅ **Pet retrieval** - 100% cubierto
- ✅ **Pet update** - 100% cubierto
- ✅ **Pet deletion** - 100% cubierto
- ✅ **Get pets by user** - 100% cubierto (con y sin mascotas)
- ✅ **Medical record creation** - 100% cubierto
- ✅ **Medical record retrieval** - 100% cubierto
- ✅ **Medical records by pet** - 100% cubierto (con y sin registros)
- ✅ **Medical record update** - 100% cubierto
- ✅ **Medical record deletion** - 100% cubierto

---

## **15\. 📚 Documentación**

### **15.1. API Documentation**
- ✅ **Swagger/OpenAPI** integrado
- ✅ **Anotaciones automáticas** en handlers
- ✅ **Documentación interactiva** en `/swagger/index.html`

### **15.2. Código**
- ✅ **Comentarios JSDoc** en modelos
- ✅ **README detallado** en español e inglés
- ✅ **Documentación de migraciones**

---

## **16\. 🚀 Despliegue y DevOps**

### **16.1. Docker**
- ✅ **Dockerfile** multi-etapa optimizado
- ✅ **Docker Compose** (para desarrollo local; en producción la BD es Supabase)
- ✅ **Variables de entorno** configuradas (apuntar a Supabase en producción)

### **16.2. Comandos Make**
- ✅ **Comandos de desarrollo** (build, run, test)
- ✅ **Comandos de migración** (migrate, rollback)
- ✅ **Comandos de Docker** (docker-build, docker-run)

---

## **17\. 📋 Próximos Pasos**

### **17.1. MVP + Monetización Completado** ✅
El backend del MVP está completamente implementado, incluyendo el sistema de refugios, adopciones, monetización con PayU y donaciones. Todas las funcionalidades planificadas han sido entregadas.

### **17.2. Funcionalidades Post-MVP**
1. **Blog editorial** ✅ — rol `admin` en JWT, migraciones `blog_posts`, endpoints públicos para SEO con Nuxt.js, endpoints protegidos para admin (RF-701 a RF-705) — **IMPLEMENTADO**
2. **Directorio de tiendas pet-friendly** ✅ — tiendas se registran con JWT propio (`entity_type: "store"`), publican catálogo con fotos y precios, usuarios contactan por WhatsApp (sin pagos en app, RF-801 a RF-806) — **IMPLEMENTADO**
3. **Suscripción PRO + límites de tier gratuito** ✅ — flujo PayU web checkout, webhook de confirmación, `subscription_plan` + `subscription_expires_at`, `IsProActive()`, límites enforcement en use cases (RF-501, RF-502) — **IMPLEMENTADO**
4. **Donaciones a refugios con fee 5%** ✅ — flujo PayU, tabla `donations`, cálculo automático platform_fee/shelter_amount, webhook de confirmación (RF-513, RF-514) — **IMPLEMENTADO**
5. **Panel Administrativo** ✅ — gestión completa de usuarios, refugios, tiendas y clínicas desde endpoints `/api/admin/*` protegidos por `RequireAdmin()`. Suspensión/reactivación de cuentas, gestión de roles, log de transacciones y pagos (RF-1001 a RF-1025). Migración `022_add_is_active_to_entities`. `AuthMiddleware` verifica `is_active` en cada request — **IMPLEMENTADO**
6. **Estadísticas y Métricas del Sistema** — dashboard global, métricas de usuarios, revenue, donaciones y contenido. Queries de agregación SQL sobre tablas existentes, sin nuevas tablas. Endpoints `/api/admin/stats/*` de solo lectura (RF-1026 a RF-1040).
7. **Clínicas veterinarias** — nueva entidad `Clinic` con JWT propio (`entity_type: "clinic"`), directorio público filtrable, perfil con horarios y servicios, **plan Pro con agenda online, registros médicos colaborativos y métricas** (RF-901 a RF-911). Gestionable desde el panel admin. Monetización: suscripción $15–30/mes.
8. **Monetización: AdMob en Flutter** — anuncios en vistas de listado para usuarios no PRO (RF-503)
9. **Monetización: Google AdSense en Nuxt.js** — anuncios en blog, directorio y adopciones para no PRO (RF-504)
10. **Visibilidad Verificada para refugios** — campo `verified` en Shelter (ya existe), badge "Verificado ✓", posicionamiento destacado y métricas básicas. Core siempre gratuito (RF-506 a RF-509)
11. **Monetización B2B: Tiendas destacadas** — campo `plan` en Store, productos ilimitados, posicionamiento (RF-510 a RF-512)
12. **Notificaciones push** con Firebase — Flutter recibe notificaciones de recordatorios (RF-204)
13. **Validación de recibo** de compra in-app (Google Play / App Store) en el endpoint `upgrade-pro`

### **17.3. Mejoras Técnicas**
1. **Notificaciones push** con Firebase
2. **Caché Redis** para mejor rendimiento
3. **Logging estructurado** con niveles
4. **Métricas y monitoreo** con Prometheus
5. **CI/CD pipeline** automatizado

---

## **18\. 📞 Contacto**

### **Autor**
**Kevin Fernando Burbano Aragón**  
Ingeniero en Sistemas y Desarrollador de Software Senior

### **Información de Contacto**
- **Email**: [burbanokevin1997@gmail.com](mailto:burbanokevin1997@gmail.com)
- **GitHub**: [@kevinburbanodev](https://github.com/kevinburbanodev)
- **LinkedIn**: [Kevin Fernando Burbano Aragón](https://www.linkedin.com/in/kevin-fernando-burbano-arag%C3%B3n-78b3871a0/)

---

## **19\. 📄 Licencia**
MIT 