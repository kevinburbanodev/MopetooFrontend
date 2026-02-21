# **📘 Documento de Requerimientos de Software (SRS) - ACTUALIZADO**

## **Proyecto: Mopetoo**

> **Nota de actualización:** La base de datos pasa de PostgreSQL nativo (self-hosted) a **Supabase (PostgreSQL gestionado)**. El sistema de migraciones Go existente se mantiene — Supabase es PostgreSQL compatible, por lo que no requiere cambios en el código de migraciones, solo en las variables de entorno de conexión.

---

## **1\. 🧭 Visión General del Proyecto**

**Mopetoo Cuidá a tus mascotas como nunca 🐾** es una aplicación móvil centrada en el cuidado de mascotas, diseñada para ayudar a los dueños a gestionar de forma simple, organizada y proactiva la salud y bienestar de sus animales de compañía. El sistema cuenta con un backend robusto construido en **Go + Gin**, basado en principios de **DDD, arquitectura hexagonal y vertical slicing**, para garantizar escalabilidad y mantenimiento limpio.

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

* Veterinarios que recomienden apps a sus clientes.

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

### **5.6. Monetización**

| ID | Requerimiento | Estado |
| ----- | ----- | ----- |
| RF-501 | La app incluirá anuncios (AdMob) en ciertas vistas. | ⏳ **PENDIENTE** (mobile-side) |
| RF-502 | El usuario podrá **pagar para eliminar anuncios** y desbloquear funciones premium. | ✅ **IMPLEMENTADO** (flag `is_pro` + endpoint) |

**Nota RF-502:** El backend implementa el campo `is_pro` en el usuario y el endpoint `POST /api/users/{id}/upgrade-pro`. La app móvil llama a este endpoint después de confirmar el pago con la tienda (Google Play / App Store). La validación de recibo es responsabilidad de la app en el MVP.

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

**Backend en Go con estructura implementada:**

```
internal/
├── handlers/              # Manejadores HTTP
│   ├── health.go         # Health check
│   ├── user.go           # Gestión de usuarios
│   ├── pet.go            # Gestión de mascotas
│   ├── reminder.go       # Gestión de recordatorios
│   ├── medical_record.go # Gestión de historial médico
│   └── pdf.go            # Exportación PDF
├── infrastructure/        # Implementaciones concretas
│   ├── auth/             # Autenticación JWT
│   ├── config/           # Configuración
│   ├── email/            # Servicio de email
│   ├── migrations/       # Migraciones de BD (007 versiones)
│   └── storage/          # Almacenamiento de archivos
├── middleware/            # Middleware (auth, rate limiting)
└── modules/              # Módulos de la aplicación
    ├── health/           # Módulo de health check
    ├── user/             # Módulo de usuario
    │   ├── application/      # Casos de uso
    │   ├── domain/           # Modelos y puertos
    │   └── infrastructure/   # Implementaciones
    ├── pet/              # Módulo de mascotas
    │   ├── application/      # Casos de uso (Create, Get, Update, Delete)
    │   ├── domain/           # Modelos y puertos
    │   └── infrastructure/   # Implementaciones
    ├── reminder/         # Módulo de recordatorios
    │   ├── application/      # Casos de uso
    │   ├── domain/           # Modelos y puertos
    │   └── infrastructure/   # Implementaciones
    ├── medicalrecord/    # Módulo de historial médico
    │   ├── application/      # Casos de uso
    │   ├── domain/           # Modelos y puertos
    │   └── infrastructure/   # Implementaciones
    └── pdf/              # Módulo de exportación PDF
        └── application/      # Caso de uso GeneratePetPDF
```

* **domain/**: entidades, interfaces y reglas del negocio.
* **application/**: casos de uso como `CreateUser`, `LoginUser`, `ForgotPassword`, etc.
* **infrastructure/**: implementación concreta (DB, JWT, Email, File Storage).
* **handlers/**: entrada (HTTP), aislada del core.

---

## **8\. 📈 Plan de Escalabilidad**

Funcionalidades futuras (post-MVP):

* 🔔 Notificaciones push con Firebase.
* 🐾 Perfiles sociales de mascotas.
* 📸 Diario visual (fotos de aventuras o tratamientos).
* 🧠 Detección automática de síntomas por IA.
* 🌐 Comunidad de adopción y rescate.
* 📦 E-commerce con productos sugeridos para cada mascota.

---

## **9\. 🎯 KPIs y Métricas Clave**

* **DAU/MAU** (usuarios activos diarios/mensuales).
* **Número de recordatorios creados por usuario.**
* **Tasa de conversión a PRO.**
* **Exportaciones de PDF generadas.**
* **Promedio de mascotas por usuario.**

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
- ✅ **JWT (JSON Web Tokens)** para autenticación
- ✅ **Middleware de autenticación** para rutas protegidas
- ✅ **Hashing de contraseñas** con bcrypt
- ✅ **Validación de tokens** en cada request

### **11.2. Rate Limiting**
- ✅ **Límite de 100 solicitudes por minuto** por IP
- ✅ **Headers de rate limiting** (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- ✅ **Respuesta 429** cuando se excede el límite

### **11.3. Validación de Datos**
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Validación de email** con formato correcto
- ✅ **Validación de contraseñas** (mínimo 6 caracteres)
- ✅ **Sanitización de datos** antes de procesar

### **11.4. Recuperación de Contraseña**
- ✅ **Tokens seguros** de 32 bytes generados aleatoriamente
- ✅ **Expiración de tokens** (1 hora)
- ✅ **Envío por email** con enlace seguro
- ✅ **Limpieza automática** de tokens usados

### **11.5. Soft Delete**
- ✅ **Soft delete implementado** para usuarios y mascotas
- ✅ **Campo `deleted_at`** en las tablas correspondientes
- ✅ **GORM automático** para excluir registros eliminados en consultas normales
- ✅ **Recuperación de datos** posible mediante consultas Unscoped

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

### **12.6. Health Check**
- `GET /health` - Verificar estado del sistema

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

### **17.1. MVP Completado** ✅
El backend del MVP está completamente implementado. Todas las funcionalidades planificadas para la versión inicial han sido entregadas.

### **17.2. Funcionalidades Post-MVP**
1. **Notificaciones push** con Firebase (RF-204)
2. **Validación de recibo** de compra in-app (Google Play / App Store) en el endpoint `upgrade-pro`
3. **Monetización visual** AdMob (mobile-side, sin cambios en backend)

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