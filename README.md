# Farm to Table — Marketplace de Lotes Agrícolas

Plataforma web que conecta productores agrícolas con compradores (usuarios y organizaciones) para la comercialización de lotes excedentes. Construida con **PHP · JavaScript vanilla · HTML · CSS**, sin frameworks de backend ni frontend.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Arquitectura](#arquitectura)
6. [Roles de usuario](#roles-de-usuario)
7. [Módulos del frontend](#módulos-del-frontend)
8. [API Endpoints](#api-endpoints)
9. [Capa de dominio](#capa-de-dominio)
10. [Capa de modelos](#capa-de-modelos)
11. [Sistema de routing SPA](#sistema-de-routing-spa)
12. [Chat en tiempo real](#chat-en-tiempo-real)
13. [Autenticación](#autenticación)
14. [Estándares de nomenclatura](#estándares-de-nomenclatura)
15. [Reglas que no se negocian](#reglas-que-no-se-negocian)
16. [Cómo añadir un módulo nuevo](#cómo-añadir-un-módulo-nuevo)
17. [Documentación extendida](#documentación-extendida)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | PHP 8.1+ (sin framework) |
| Base de datos | MySQL 8.0+ / MariaDB 10.6+ |
| Frontend | JavaScript ES Modules (vanilla), HTML5, CSS3 |
| Estilos | Bootstrap 5.3 |
| Chat en tiempo real | Ably Realtime SDK |
| Autenticación social | Google Identity Services (OAuth 2.0) |
| Servidor web | Apache con `.htaccess` |
| Gestión de dependencias JS | npm (solo para `@ably/chat` y `ably`) |

---

## Requisitos

- PHP 8.1 o superior
- MySQL 8.0+ o MariaDB 10.6+
- Apache con `mod_rewrite` habilitado y soporte para `.htaccess`
- Node.js y npm (solo para instalar dependencias JS de Ably si se necesita localmente)
- Cuenta en [Ably](https://ably.com/) para el chat en tiempo real
- Credenciales de Google OAuth para el login social

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/farm-to-table.git
cd farm-to-table

# 2. Copiar y editar la configuración
cp config/config.example.php config/config.php
# Completar DB_HOST, DB_NAME, DB_USER, DB_PASS, GOOGLE_CLIENT_ID, etc.

# 3. Importar el esquema de base de datos
mysql -u root -p farm_to_table < database/schema.sql

# 4. Instalar dependencias JS (opcional — solo si se necesitan localmente)
npm install

# 5. Apuntar el virtual host de Apache a la raíz del proyecto
#    El .htaccess redirige automáticamente todo el tráfico a /public/
```

> `config/config.php` **nunca** se sube al repositorio. Está en `.gitignore`.

---

## Estructura de carpetas

```
farm-to-table/
│
├── config/
│   ├── config.php                  ← Credenciales reales (no commitear)
│   └── config.example.php          ← Plantilla para nuevos colaboradores
│
├── docs/
│   ├── guia-equipo-endpoints.html  ← Referencia de todos los endpoints
│   ├── guia-equipo-pantallas.html  ← Listado de pantallas por rol
│   └── guia-equipo-querys.html     ← Consultas SQL de referencia
│
├── querys/                         ← SQL de desarrollo por integrante
│   ├── Adriana/
│   ├── Alan/
│   ├── Andrés/
│   ├── Bayron/
│   ├── Dafne/
│   ├── Isra/
│   └── Juan/
│
├── src/                            ← Backend PHP (nunca expuesto al navegador)
│   ├── api/                        ← Endpoints HTTP (un archivo por recurso)
│   │   ├── auth.php
│   │   ├── catalogo.php
│   │   ├── chats.php
│   │   ├── config.php              ← Expone configuración pública (ej. Ably key)
│   │   ├── entregas.php
│   │   ├── favoritos.php
│   │   ├── lotes.php
│   │   ├── marketplace.php
│   │   ├── negociaciones.php
│   │   ├── perfil.php
│   │   ├── reportes.php
│   │   ├── usuarios.php
│   │   └── vendedores.php
│   │
│   ├── core/                       ← Infraestructura compartida
│   │   ├── Database.php            ← Singleton PDO (conexión única)
│   │   ├── Router.php              ← Helpers para leer método, body y query params
│   │   └── Response.php            ← json_ok() / json_error()
│   │
│   ├── domain/                     ← Lógica de negocio (orquesta modelos)
│   │   ├── AuthDomain.php
│   │   ├── ChatDomain.php
│   │   ├── EntregaDomain.php
│   │   ├── LoteDomain.php
│   │   ├── MarketplaceDomain.php
│   │   ├── NegociacionDomain.php
│   │   ├── PerfilDomain.php
│   │   ├── ReporteDomain.php
│   │   └── UsuarioDomain.php
│   │
│   ├── models/                     ← Acceso a datos (solo SQL y PDO)
│   │   ├── BaseModel.php
│   │   ├── CatalogoProductoModel.php
│   │   ├── CategoriaProductoModel.php
│   │   ├── ChatModel.php
│   │   ├── DetalleOfertaModel.php
│   │   ├── EntregaLogisticaModel.php
│   │   ├── EvidenciaFotograficaModel.php
│   │   ├── FavoritoModel.php
│   │   ├── HistorialTrazabilidadModel.php
│   │   ├── LoteExcedenteModel.php
│   │   ├── NegociacionModel.php
│   │   ├── ReporteModel.php
│   │   ├── UsuarioModel.php
│   │   ├── ValoracionReputacionModel.php
│   │   ├── VendedorModel.php
│   │   └── ZonaOperativaModel.php
│   │
│   └── uploads/                    ← Archivos subidos por usuarios
│       ├── page/                   ← Imágenes de página de vendedor
│       └── products/               ← Fotos de lotes/productos
│
├── public/                         ← Única carpeta expuesta al navegador
│   ├── index.html                  ← Punto de entrada único (shell HTML)
│   ├── .htaccess                   ← Redirige rutas SPA a index.html
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   └── global.css          ← Estilos globales y variables CSS
│   │   ├── images/
│   │   │   ├── login/              ← Imágenes de fondo del login
│   │   │   ├── lotes/              ← Fotos de lotes publicados
│   │   │   └── users/              ← Avatares de perfil de usuario
│   │   └── js/
│   │       ├── app.js              ← Enrutador SPA principal
│   │       ├── http.js             ← Wrapper de fetch() (Http.get/post/patch...)
│   │       ├── toast.js            ← Sistema de notificaciones toast
│   │       ├── ably.js             ← Inicialización y helpers de Ably Realtime
│   │       ├── google.js           ← Helper para Google Identity Services
│   │       ├── components/         ← Componentes JS reutilizables entre pantallas
│   │       │   ├── admin-components.js
│   │       │   ├── chat-components.js
│   │       │   ├── marketplace-components.js
│   │       │   ├── negociacion-components.js
│   │       │   └── vendor-components.js
│   │       └── services/           ← Un archivo por entidad API
│   │           ├── auth.js
│   │           ├── catalogo.js
│   │           ├── chats.js
│   │           ├── entregas.js
│   │           ├── favoritos.js
│   │           ├── lotes.js
│   │           ├── marketplace.js
│   │           ├── negociaciones.js
│   │           ├── perfil.js
│   │           ├── reportes.js
│   │           ├── usuarios.js
│   │           └── vendedores.js
│   │
│   └── components/
│       └── app/
│           ├── unlogged/                    ← Shell para usuarios no autenticados
│           │   ├── unlogged.html/css/js     ← Layout base (nav + contenido)
│           │   ├── nav/                     ← Barra de navegación pública
│           │   └── main-content/
│           │       ├── inicio/              ← Landing pública
│           │       └── login/               ← Formulario login/registro
│           │
│           └── logged/
│               ├── user/                    ← Shell para compradores (usuarios)
│               │   ├── user.html/css/js     ← Layout base del comprador
│               │   ├── nav/                 ← Navegación del comprador
│               │   └── main-content/
│               │       ├── landing-page/    ← Inicio del comprador
│               │       ├── marketplace/     ← Listado de lotes disponibles
│               │       ├── informacion-producto/  ← Detalle de un lote
│               │       ├── catalogo-vendedores/   ← Perfil público de un productor
│               │       ├── favoritos/       ← Lotes guardados como favoritos
│               │       ├── contraofertas/   ← Historial de negociaciones del comprador
│               │       ├── chats/           ← Mensajería en tiempo real
│               │       ├── calificar-producto/    ← Calificación tras compra
│               │       ├── perfil/          ← Editar perfil del comprador
│               │       ├── inicio/          ← Dashboard de inicio
│               │       ├── contact/         ← Contacto
│               │       └── login/           ← Ruta login dentro del shell (legacy)
│               │
│               ├── farmer/                  ← Shell para productores
│               │   ├── farmer.html/css/js   ← Layout base del productor
│               │   ├── nav/                 ← Navegación del productor
│               │   └── main-content/
│               │       ├── landing-page/    ← Inicio del productor
│               │       ├── lotes/           ← Mis lotes publicados
│               │       ├── publicar-lote/   ← Crear nuevo lote
│               │       ├── editar-lote/     ← Editar lote existente
│               │       ├── contraofertas/   ← Negociaciones recibidas
│               │       ├── chats/           ← Mensajería en tiempo real
│               │       └── perfil/          ← Editar perfil del productor
│               │
│               └── admin/                   ← Shell para administradores
│                   ├── admin.html/css/js    ← Layout base del admin
│                   ├── nav/                 ← Navegación del admin
│                   └── main-content/
│                       ├── inicio/          ← Dashboard con métricas
│                       ├── usuarios/        ← Gestión de usuarios
│                       ├── zonas/           ← Gestión de zonas operativas
│                       ├── productos/       ← Catálogo de productos
│                       └── reportes/        ← Reportes y estadísticas
│
├── .htaccess                       ← Redirige raíz y rutas a /public/
├── .gitignore
├── package.json                    ← Dependencias JS (Ably)
└── README.md
```

---

## Arquitectura

El proyecto aplica una **arquitectura en capas estrictamente unidireccional** inspirada en Clean Architecture. Ninguna capa puede saltarse otra.

```
Componente JS  →  services/*.js  →  api/*.php  →  domain/*.php  →  models/*.php  →  MySQL
      ↑                                                                                 │
      └─────────────────────────────────── JSON response ────────────────────────────────┘
```

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Presentación | `public/components/` | Renderizar la UI. Solo HTML, CSS y JS del componente |
| Servicios JS | `public/assets/js/services/` | Llamadas HTTP al backend vía `Http.*` |
| API | `src/api/` | Recibir la solicitud HTTP, validar campos requeridos y delegar al dominio |
| Dominio | `src/domain/` | Toda la lógica de negocio. Orquesta modelos. Toma decisiones |
| Datos | `src/models/` | Único punto de contacto con MySQL vía PDO preparado |

### Infraestructura del backend

- **`Database.php`** — Singleton que garantiza una única conexión PDO durante toda la solicitud. Configurada con `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES = false` y charset `utf8mb4`.
- **`Router.php`** — Utilidades estáticas: `method()`, `body()` (JSON o multipart), `query()` y `requireFields()` para validación rápida de campos obligatorios.
- **`Response.php`** — Dos funciones globales: `json_ok($data, $code)` y `json_error($message, $code)`. Toda respuesta HTTP pasa por aquí.

### Infraestructura del frontend

- **`app.js`** — Enrutador SPA: tabla de rutas, carga dinámica de shells y páginas vía `import()`, gestión del historial del navegador con `pushState`.
- **`http.js`** — Wrapper de `fetch()` con métodos `Http.get/post/patch/put/delete`. Deserializa automáticamente el envelope `{ status, data }` y lanza `HttpError` en caso de error.
- **`toast.js`** — Sistema de notificaciones (success, error, welcome, goodbye, confirm, loading, notification) usando Bootstrap Toast.
- **`ably.js`** — Inicialización del cliente Ably Realtime, publicación y suscripción a canales de chat e inbox personal.

---

## Roles de usuario

| Rol | Descripción | Shell del frontend |
|---|---|---|
| `usuario` | Comprador. Navega el marketplace, hace ofertas y negocia | `app/logged/user` |
| `productor` | Agricultor. Publica lotes excedentes y gestiona sus ventas | `app/logged/farmer` |
| `organizacion` | Similar a usuario, puede representar a una entidad | `app/logged/user` |
| `admin` | Administrador de la plataforma. Acceso a panel de control | `app/logged/admin` |

La sesión se persiste en `localStorage` con el token de usuario. El enrutador redirige automáticamente si la ruta requiere autenticación.

---

## Módulos del frontend

### Pantallas para usuarios no autenticados (`/unlogged/`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/unlogged/inicio` | `unlogged/main-content/inicio` | Landing pública de la plataforma |
| `/unlogged/login` | `unlogged/main-content/login` | Login (teléfono/email/Google) y registro |

### Pantallas del comprador (`/usuario/`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/usuario/landing-page` | `user/main-content/landing-page` | Dashboard de bienvenida del comprador |
| `/usuario/marketplace` | `user/main-content/marketplace` | Listado y búsqueda de lotes disponibles |
| `/usuario/informacion-producto` | `user/main-content/informacion-producto` | Detalle completo de un lote con fotos |
| `/usuario/catalogo-vendedores` | `user/main-content/catalogo-vendedores` | Perfil público de un productor con sus lotes |
| `/usuario/favoritos` | `user/main-content/favoritos` | Lotes guardados como favoritos |
| `/usuario/contraofertas` | `user/main-content/contraofertas` | Historial de negociaciones activas y pasadas |
| `/usuario/chats` | `user/main-content/chats` | Mensajería en tiempo real con productores |
| `/usuario/calificar-producto` | `user/main-content/calificar-producto` | Calificación y reseña tras completar una compra |
| `/usuario/perfil` | `user/main-content/perfil` | Edición del perfil del comprador |

### Pantallas del productor (`/productor/`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/productor/landing-page` | `farmer/main-content/landing-page` | Dashboard de bienvenida del productor |
| `/productor/mis-lotes` | `farmer/main-content/lotes` | Listado de lotes propios con estados |
| `/productor/publicar-lote` | `farmer/main-content/publicar-lote` | Formulario para crear un nuevo lote |
| `/productor/editar-lote` | `farmer/main-content/editar-lote` | Edición de un lote ya publicado |
| `/productor/contraofertas` | `farmer/main-content/contraofertas` | Negociaciones recibidas de compradores |
| `/productor/chats` | `farmer/main-content/chats` | Mensajería en tiempo real con compradores |
| `/productor/perfil` | `farmer/main-content/perfil` | Edición del perfil del productor |

### Pantallas del administrador (`/admin/`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin/inicio` | `admin/main-content/inicio` | Dashboard con métricas generales |
| `/admin/usuarios` | `admin/main-content/usuarios` | Listado y gestión de usuarios registrados |
| `/admin/zonas` | `admin/main-content/zonas` | Gestión de zonas operativas |
| `/admin/productos` | `admin/main-content/productos` | Catálogo de productos referenciados |
| `/admin/reportes` | `admin/main-content/reportes` | Reportes y estadísticas de la plataforma |

### Estructura de cada componente

Cada módulo vive en su propia carpeta y sigue la convención triple:

```
componente-nombre/
├── componente-nombre.html   ← Plantilla HTML del componente
├── componente-nombre.css    ← Estilos scoped del componente
└── componente-nombre.js     ← Lógica: export { init, cleanup }
```

El router carga/descarga automáticamente los tres archivos al navegar. `init(container)` se llama al montar y `cleanup()` al desmontar.

---

## API Endpoints

Todos los endpoints se encuentran en `src/api/`. Las respuestas siguen el envelope:
- Éxito: `{ "status": "ok", "data": {...} }`
- Error: `{ "status": "error", "message": "..." }`

### `auth.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?zonas=1` | — | Lista de zonas activas para el formulario de registro |
| `POST` `action: login` | `identificador`, `contrasena` | Login por teléfono o email |
| `POST` `action: login_google` | `id_token` | Login / vinculación con Google |
| `POST` `action: register` | `id_zona`, `nombre`, `rol`, `telefono`, `contrasena`, `email?`, `apellido?` | Registro de nuevo usuario |
| `POST` `action: register_google` | `id_token`, `id_zona`, `telefono`, `rol`, `apellido?` | Registro vinculado a Google |

### `marketplace.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET` | — | Todos los lotes disponibles |
| `GET ?nombre=x&categoria=N` | `nombre?`, `categoria?` | Búsqueda con filtros opcionales |
| `GET ?id=N` | `id` | Detalle completo de un lote |
| `GET ?categorias=1` | — | Lista de categorías para filtros |

### `lotes.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id_productor=N` | `id_productor` | Lotes de un productor |
| `GET ?urgentes=1` | — | Lotes próximos a vencer (≤ 3 días) |
| `POST` | FormData con campos del lote + foto | Publicar nuevo lote |
| `PATCH` | `id_lote`, `id_productor`, `estado` | Cambiar estado de un lote |
| `PUT` | FormData con campos editados | Editar lote existente |

### `negociaciones.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id_comprador=N` | — | Negociaciones activas del comprador |
| `GET ?id_productor=N` | — | Negociaciones activas del productor |
| `GET ?hilo=N` | — | Hilo de ofertas de una negociación |
| `GET ?historial_comprador=N` | — | Historial completo de compras |
| `GET ?historial_productor=N` | — | Historial completo de ventas |
| `POST` `action: iniciar` | `id_lote`, `id_comprador`, `monto`, `comentario?` | Iniciar negociación |
| `POST` `action: contraoferta` | `id_negociacion`, `id_emisor`, `monto`, `comentario?` | Enviar contraoferta |
| `PATCH` `action: aceptar` | `id_negociacion` | Aceptar la última oferta |
| `PATCH` `action: rechazar` | `id_negociacion` | Rechazar y cerrar negociación |

### `chats.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?usuario_id=N` | — | Todos los chats de un usuario |
| `GET ?chat_id=N` | — | Mensajes de un chat |
| `POST` `action: find_or_create` | `usuario_a`, `usuario_b`, `id_negociacion` | Obtener o crear sala de chat |
| `POST` | `chat_id`, `remitente_id`, `body` | Enviar un mensaje |

### `favoritos.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id_usuario=N` | — | Lotes favoritos del usuario |
| `POST` | `id_usuario`, `id_lote` | Agregar a favoritos |
| `DELETE` | `id_usuario`, `id_lote` | Quitar de favoritos |

### `perfil.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id=N` | — | Perfil completo (datos + stats + valoraciones) |
| `PUT` | FormData con campos editables + foto? | Actualizar perfil |
| `POST` `action: calificar` | `id_evaluado`, `id_evaluador`, `puntuacion`, `comentario?` | Registrar calificación |

### `entregas.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id_negociacion=N` | — | Entrega asociada a una negociación |
| `GET ?qr=codigo` | — | Verificar entrega por código QR |
| `PATCH` `action: confirmar` | `id_entrega` | Confirmar recepción |

### `catalogo.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET` | — | Catálogo completo de productos de referencia |
| `GET ?categoria=N` | — | Productos filtrados por categoría |

### `vendedores.php`

| Método | Parámetros | Descripción |
|---|---|---|
| `GET ?id=N` | — | Perfil público de un vendedor/productor |

### `usuarios.php` (admin)

| Método | Parámetros | Descripción |
|---|---|---|
| `GET` | — | Listado de todos los usuarios |
| `PATCH` | `id_usuario`, `activo` | Activar / desactivar usuario |

### `reportes.php` (admin)

| Método | Parámetros | Descripción |
|---|---|---|
| `GET` | varios filtros opcionales | Datos estadísticos agregados |

### `config.php`

| Método | Descripción |
|---|---|
| `GET` | Configuración pública (ej. `ably_api_key`) |

---

## Capa de dominio

Los dominios (`src/domain/`) contienen toda la lógica de negocio. Reciben datos ya validados desde el endpoint, orquestan modelos y devuelven resultados listos para serializar. **Nunca** ejecutan SQL directamente.

| Clase | Responsabilidad | Modelos que usa |
|---|---|---|
| `AuthDomain` | Login (teléfono/email/Google) con bcrypt; registro con validación de unicidad; listado de zonas | `UsuarioModel`, `ZonaOperativaModel` |
| `LoteDomain` | Publicar lotes (transacción: lote + trazabilidad + fotos), consultar catálogo, cambiar estado | `LoteExcedenteModel`, `EvidenciaFotograficaModel`, `HistorialTrazabilidadModel`, `CategoriaProductoModel`, `CatalogoProductoModel` |
| `MarketplaceDomain` | Listado y búsqueda de lotes disponibles, detalle con fotos, toggle de favoritos | `LoteExcedenteModel`, `CategoriaProductoModel`, `FavoritoModel` |
| `NegociacionDomain` | Iniciar negociación, enviar contraoferta, aceptar/rechazar, hilo de ofertas, historial | `NegociacionModel`, `DetalleOfertaModel` |
| `EntregaDomain` | Verificar QR, confirmar recepción, actualizar estado logístico | `EntregaLogisticaModel` |
| `PerfilDomain` | Perfil con stats y valoraciones, registrar calificación, actualizar datos editables | `UsuarioModel`, `ValoracionReputacionModel`, `ZonaOperativaModel` |
| `ChatDomain` | Buscar o crear sala de chat, enviar y recuperar mensajes | `ChatModel` |
| `ReporteDomain` | Generar agregados estadísticos para el panel de administración | `ReporteModel` |
| `UsuarioDomain` | Gestión de usuarios desde el panel de admin | `UsuarioModel` |

---

## Capa de modelos

Los modelos (`src/models/`) son la única puerta de entrada a la base de datos. Todas las clases extienden `BaseModel`, que inyecta la conexión PDO del Singleton. Sus métodos únicamente ejecutan SQL y devuelven arrays o primitivos.

| Clase | Tabla / Vista principal | Métodos destacados |
|---|---|---|
| `BaseModel` | — | Constructor que obtiene la conexión PDO del Singleton |
| `UsuarioModel` | `usuarios`, `vw_usuarios_ubicacion` | `findById`, `findByTelefono`, `findByEmail`, `findByGoogleId`, `existeTelefono`, `existeEmail`, `create`, `createWithGoogle`, `linkGoogleId`, `update`, `getStatsComprador`, `getStatsProductor` |
| `ZonaOperativaModel` | `zonas_operativas` | `findAllActivas`, `findById` |
| `LoteExcedenteModel` | `lotes_excedentes`, `v_lotes_disponibles`, `v_lotes_card` | `findAllDisponibles`, `findUrgentes`, `buscar`, `findByIdDetalle`, `findByProductor`, `create`, `edit`, `updateEstado` |
| `CatalogoProductoModel` | `catalogo_productos` | `findAll`, `findById`, `findByNombre` |
| `CategoriaProductoModel` | `categorias_productos` | `findAll`, `findById` |
| `EvidenciaFotograficaModel` | `evidencias_fotograficas` | `findByLote`, `create`, `delete` |
| `HistorialTrazabilidadModel` | `historial_trazabilidad` | `findByLote`, `create` |
| `NegociacionModel` | `negociaciones` | `findById`, `findByComprador`, `findByProductor`, `findHistorialComprador`, `findHistorialProductor`, `create`, `updateEstado` |
| `DetalleOfertaModel` | `detalle_ofertas` | `findByNegociacion`, `create` |
| `EntregaLogisticaModel` | `entregas_logisticas` | `findById`, `findByNegociacion`, `findByCodigoQR`, `create`, `updateEstado`, `registrarRecepcion` |
| `FavoritoModel` | `favoritos` | `findByUsuario`, `existe`, `agregar`, `eliminar` |
| `ValoracionReputacionModel` | `valoraciones_reputacion` | `findByEvaluado`, `getPromedio`, `create` |
| `VendedorModel` | `usuarios` + joins | Perfil público del productor con lotes y valoraciones |
| `ChatModel` | `chats`, `mensajes_chat` | `findOrCreate`, `findByUsuario`, `getMessages`, `sendMessage` |
| `ReporteModel` | vistas y agregados | Estadísticas para el panel de administración |

---

## Sistema de routing SPA

El frontend es una **Single Page Application** pura sin framework. El enrutador está en `public/assets/js/app.js`.

### Cómo funciona

1. El único HTML real es `public/index.html`, que contiene solo un `<div id="app">`.
2. Al cargar la página o al navegar, `router()` evalúa `window.location.pathname`.
3. Busca la ruta en la tabla `routes[]` y determina la **shell** (layout base) y la **página** (contenido).
4. Carga dinámicamente los archivos `.html`, `.css` y `.js` del componente vía `fetch()` e `import()`.
5. Si la shell cambia (ej. de `user` a `admin`), descarga la shell anterior y monta la nueva.
6. Si solo cambia la página dentro de la misma shell, solo recarga el contenido interior.

### Convenios de rutas

```js
{ path: '/usuario/marketplace', shell: 'app/logged/user', page: 'app/logged/user/main-content/marketplace', auth: 'public' }
{ path: '/admin/usuarios',      shell: 'app/logged/admin', page: 'app/logged/admin/main-content/usuarios',  auth: 'protected' }
```

- `auth: 'public'` — accesible sin sesión.
- `auth: 'protected'` — redirige a `/unlogged/login` si no hay token en `localStorage`.

### Navegar entre páginas

```js
import { navigate } from '../../../../assets/js/app.js';
navigate('/usuario/marketplace');
```

Nunca usar `window.location.href` directamente — perturba el historial gestionado por el router.

### Ciclo de vida de un componente

```js
// En cualquier componente .js
export async function init(container) {
  // Se ejecuta al montar el componente
}

export async function cleanup() {
  // Se ejecuta al desmontar (desuscribirse de eventos, cancelar timers, etc.)
}
```

---

## Chat en tiempo real

El chat usa **Ably Realtime** para comunicación bidireccional sin polling.

### Flujo

1. Al abrir la pantalla de chats, se llama `initAbly(userId)` que obtiene la API key del endpoint `/src/api/config.php` y crea el cliente Ably.
2. Cada conversación tiene un canal `chat:{chatId}` donde se publican mensajes con el evento `message`.
3. Cada usuario tiene un inbox personal `inbox:{userId}` para recibir notificaciones de nuevos chats incluso sin estar suscrito a ese canal específico.

```js
import { initAbly, subscribeToChat, publishMessage, subscribeToInbox } from '../../../../assets/js/ably.js';

await initAbly(userId);

// Suscribirse a un chat
const unsub = subscribeToChat(chatId, (msg) => console.log(msg.data));

// Publicar mensaje
await publishMessage(chatId, { remitente_id: userId, body: 'Hola!' });

// Desuscribir al salir
unsub();
```

Los mensajes también se persisten en MySQL via `POST /src/api/chats.php`.

---

## Autenticación

### Login con teléfono o email

1. El usuario envía `identificador` (teléfono o email) y `contrasena`.
2. `AuthDomain::login()` detecta si es email con `FILTER_VALIDATE_EMAIL`, busca el usuario y verifica la contraseña con `password_verify()` (compatible con hashes `$2b$` de Python).
3. Devuelve el objeto usuario completo. El frontend guarda el token/id en `localStorage`.

### Login con Google

1. Google Identity Services devuelve un `id_token` al frontend.
2. El backend llama a `https://oauth2.googleapis.com/tokeninfo?id_token=...` para verificarlo.
3. Si el `google_id` ya existe en la BD, inicia sesión. Si existe el email, vincula la cuenta. Si no existe ninguno, requiere registro.

### Logout

Simplemente se elimina el token de `localStorage` y se navega a `/unlogged/login`.

---

## Estándares de nomenclatura

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Carpeta y archivos de componente | `kebab-case` | `publicar-lote/publicar-lote.js` |
| Modelo PHP | `PascalCase` + `Model` | `LoteExcedenteModel.php` |
| Dominio PHP | `PascalCase` + `Domain` | `NegociacionDomain.php` |
| Endpoint PHP | `kebab-case`, plural donde aplica | `negociaciones.php` |
| Servicio JS | `kebab-case` archivo, `PascalCase` export | `negociaciones.js` → `export const NegociacionService` |

### Verbos por capa

| Operación | Modelo | Dominio |
|---|---|---|
| Obtener todos | `findAll()` | `getAll()` |
| Obtener por ID | `findById(int $id)` | `getById(int $id)` |
| Filtrar por campo | `findByEmail()` | `getByEmail()` |
| Crear | `create(...)` | `create(...)` |
| Actualizar | `update(int $id, ...)` | `update(int $id, ...)` |
| Cambiar estado | `updateEstado(...)` | `cambiarEstado(...)` |

### Base de datos

- Tablas: `snake_case` en plural → `lotes_excedentes`, `detalle_ofertas`
- Columnas: `snake_case` → `fecha_cosecha`, `id_productor`
- PKs: `id_{entidad}` → `id_lote`, `id_usuario`
- FKs: misma convención → `id_productor` referencia a `usuarios.id_usuario`

---

## Reglas que no se negocian

- `config/config.php` **nunca** se commitea. Está en `.gitignore`.
- **El SQL vive únicamente en `models/`.** Jamás en dominios, endpoints o el frontend.
- **La lógica de negocio vive únicamente en `domain/`.** Jamás en modelos ni endpoints.
- **Los componentes JS nunca llaman a `fetch()` directamente.** Siempre a través de `services/*.js` que usan `Http.*`.
- **Todas las respuestas HTTP** pasan por `json_ok()` o `json_error()` de `Response.php`. Nunca `echo` directo.
- **Nunca se usa `navigate()` de `app.js` mezclado con `window.location`.** El router es el único responsable de la navegación.
- **Los componentes deben exportar `cleanup()`** si se suscriben a eventos o canales de Ably, para liberar recursos al desmontar.

---

## Cómo añadir un módulo nuevo

Sigue estos cinco pasos en orden. El módulo `favoritos` puede servir de referencia.

### 1. Modelo — `src/models/MiEntidadModel.php`

```php
<?php
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/BaseModel.php';

class MiEntidadModel extends BaseModel
{
    public function findAll(): array
    {
        return $this->db->query("SELECT * FROM mi_tabla ORDER BY id DESC")->fetchAll();
    }

    public function create(string $nombre): int
    {
        $stmt = $this->db->prepare("INSERT INTO mi_tabla (nombre) VALUES (?)");
        $stmt->execute([$nombre]);
        return (int) $this->db->lastInsertId();
    }
}
```

### 2. Dominio — `src/domain/MiEntidadDomain.php`

```php
<?php
require_once __DIR__ . '/../models/MiEntidadModel.php';

class MiEntidadDomain
{
    private MiEntidadModel $model;

    public function __construct()
    {
        $this->model = new MiEntidadModel();
    }

    public function getAll(): array
    {
        return $this->model->findAll();
    }

    public function create(string $nombre): array
    {
        $id = $this->model->create(trim($nombre));
        return ['success' => true, 'id' => $id];
    }
}
```

### 3. Endpoint — `src/api/mi-entidad.php`

```php
<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Router.php';
require_once __DIR__ . '/../domain/MiEntidadDomain.php';

$domain = new MiEntidadDomain();

match (Router::method()) {
    'GET'  => json_ok($domain->getAll()),
    'POST' => crearEntidad($domain),
    default => json_error('Método no permitido.', 405),
};

function crearEntidad(MiEntidadDomain $domain): void
{
    $body = Router::body();
    Router::requireFields(['nombre'], $body);
    $result = $domain->create($body['nombre']);
    json_ok($result, 201);
}
```

### 4. Servicio JS — `public/assets/js/services/mi-entidad.js`

```js
import { Http } from '../http.js';

export const MiEntidadService = {
    getAll()        { return Http.get('mi-entidad.php'); },
    create(nombre)  { return Http.post('mi-entidad.php', { nombre }); },
};
```

### 5. Componente — `public/components/app/logged/user/main-content/mi-modulo/`

```
mi-modulo/
├── mi-modulo.html
├── mi-modulo.css
└── mi-modulo.js
```

```js
// mi-modulo.js
import { MiEntidadService } from '../../../../assets/js/services/mi-entidad.js';
import { toastError } from '../../../../assets/js/toast.js';

export async function init(container) {
    try {
        const items = await MiEntidadService.getAll();
        container.querySelector('#lista').innerHTML =
            items.map(i => `<li>${i.nombre}</li>`).join('');
    } catch (e) {
        toastError(e.message);
    }
}

export function cleanup() {
    // Limpiar suscripciones, timers, etc.
}
```

Finalmente, registra la ruta en `public/assets/js/app.js`:

```js
{ path: '/usuario/mi-modulo', shell: 'app/logged/user', page: 'app/logged/user/main-content/mi-modulo', auth: 'public' },
```

---

## Documentación extendida

La documentación detallada por pantalla, guías de queries SQL y referencia de endpoints está disponible en la carpeta `docs/`:

- [Guía de endpoints](docs/guia-equipo-endpoints.html)
- [Guía de pantallas](docs/guia-equipo-pantallas.html)
- [Guía de queries](docs/guia-equipo-querys.html)

---

*Última actualización: Junio 2026*
