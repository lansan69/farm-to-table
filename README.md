# 🌾 Marketplace de Agricultores

Stack vanilla — PHP · JS · HTML · CSS — sin frameworks. Arquitectura en capas basada en Clean Architecture y MVC.

---

## Requisitos

- PHP 8.1+
- MySQL 8.0+ o MariaDB 10.6+
- Servidor web con soporte para `.htaccess` (Apache) o configuración equivalente en Nginx

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/farmer-marketplace.git
cd farmer-marketplace

# 2. Configurar credenciales
cp config/config.example.php config/config.php
# Editar config/config.php con tus datos de base de datos

# 3. Importar la base de datos
mysql -u root -p farmer_db < database/schema.sql

# 4. Apuntar el servidor web a /public como document root
```

> `config/config.php` nunca se sube al repositorio. Está en `.gitignore`.

---

## Estructura del proyecto

```
/
├── public/                          ← Única carpeta expuesta al navegador
│   ├── index.php                    ← Punto de entrada único
│   ├── assets/
│   │   ├── css/global.css
│   │   └── js/
│   │       ├── app.js               ← Enrutador de componentes
│   │       ├── http.js              ← Wrapper compartido de fetch()
│   │       └── services/            ← Un archivo JS por entidad
│   └── components/                  ← Un directorio por componente visual
│       └── [nombre]/
│           ├── [nombre].html
│           ├── [nombre].css
│           └── [nombre].js
│
├── src/                             ← Nunca expuesta al navegador
│   ├── core/
│   │   ├── Database.php             ← Singleton PDO
│   │   ├── Router.php               ← Mapa de rutas API
│   │   └── Response.php             ← json_ok() / json_error()
│   ├── models/                      ← Capa de datos — solo SQL
│   ├── domain/                      ← Capa de lógica de negocio
│   └── api/                         ← Endpoints HTTP
│
├── config/
│   ├── config.php                   ← Credenciales (no commitear)
│   └── config.example.php           ← Plantilla para nuevos devs
│
└── .htaccess                        ← Redirige todo a public/
```

---

## Arquitectura

El proyecto separa el código en cinco capas. **El flujo es estrictamente unidireccional** — nunca se salta una capa.

```
Componente JS  →  services/*.js  →  api/*.php  →  domain/*.php  →  models/*.php  →  MySQL
      ↑                                                                                 │
      └─────────────────────────── JSON response ─────────────────────────────────────┘
```

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Presentación | `public/components/` | Renderizar la UI. Solo HTML, CSS y JS |
| AJAX | `public/assets/js/services/` | Llamadas `fetch()` al backend |
| API | `src/api/` | Recibir, validar y delegar la solicitud |
| Dominio | `src/domain/` | Toda la lógica de negocio |
| Datos | `src/models/` | Queries SQL con PDO |

---

## Modelos y Dominio

### Cómo funcionan las capas

Los **modelos** (`src/models/`) son la única puerta de entrada a la base de datos. Cada clase extiende `BaseModel`, que inyecta una conexión PDO compartida (singleton). Sus métodos solo ejecutan SQL y devuelven arrays o primitivos — ninguna lógica de negocio.

Los **dominios** (`src/domain/`) orquestan uno o más modelos para implementar una operación de negocio completa. Reciben datos ya validados desde el endpoint, toman decisiones, y devuelven resultados listos para serializar. Nunca hablan con la base de datos directamente.

```
api/*.php  →  domain/*.php  →  models/*.php  →  PDO
```

---

### Modelos disponibles

| Clase | Tabla / Vista | Métodos principales |
|---|---|---|
| `UsuarioModel` | `usuarios` / `vw_usuarios_ubicacion` | `findById`, `findByTelefono`, `findByEmail`, `existeTelefono`, `existeEmail`, `create`, `update`, `getStatsComprador`, `getStatsProductor` |
| `ZonaOperativaModel` | `zonas_operativas` | `findAllActivas`, `findById` |
| `LoteExcedenteModel` | `lotes_excedentes` | `findAllDisponibles`, `findUrgentes`, `buscar`, `findByIdDetalle`, `findByProductor`, `create`, `updateEstado` |
| `CatalogoProductoModel` | `catalogo_productos` | `findAll`, `findById`, `findByNombre` |
| `CategoriaProductoModel` | `categorias_productos` | `findAll`, `findById` |
| `EvidenciaFotograficaModel` | `evidencias_fotograficas` | `findByLote`, `create`, `delete` |
| `HistorialTrazabilidadModel` | `historial_trazabilidad` | `findByLote`, `create` |
| `NegociacionModel` | `negociaciones` | `findById`, `findByComprador`, `findByProductor`, `findHistorialComprador`, `findHistorialProductor`, `create`, `updateEstado` |
| `DetalleOfertaModel` | `detalle_ofertas` | `findByNegociacion`, `create` |
| `EntregaLogisticaModel` | `entregas_logisticas` | `findById`, `findByNegociacion`, `findByCodigoQR`, `create`, `updateEstado`, `registrarRecepcion` |
| `FavoritoModel` | `favoritos` | `findByUsuario`, `existe`, `agregar`, `eliminar` |
| `ValoracionReputacionModel` | `valoraciones_reputacion` | `findByEvaluado`, `getPromedio`, `create` |

---

### Dominios disponibles

| Clase | Responsabilidad | Modelos que usa |
|---|---|---|
| `AuthDomain` | Login por teléfono o email con `password_verify`; registro con validación de unicidad de teléfono y email; listado de zonas para el formulario | `UsuarioModel`, `ZonaOperativaModel` |
| `LoteDomain` | Publicar lotes (transacción: lote + trazabilidad + fotos), consultar catálogo y categorías, cambiar estado, detalle con fotos aplanadas | `LoteExcedenteModel`, `EvidenciaFotograficaModel`, `HistorialTrazabilidadModel`, `CategoriaProductoModel`, `CatalogoProductoModel` |
| `MarketplaceDomain` | Listado y búsqueda de lotes disponibles, detalle de lote con fotos, favoritos con toggle | `LoteExcedenteModel`, `CategoriaProductoModel`, `FavoritoModel` |
| `NegociacionDomain` | Iniciar negociación, enviar contraoferta, aceptar / rechazar, historial de hilo de ofertas | `NegociacionModel`, `DetalleOfertaModel` |
| `EntregaDomain` | Verificar QR, confirmar recepción, actualizar estado logístico | `EntregaLogisticaModel` |
| `PerfilDomain` | Perfil de comprador y productor (stats + valoraciones), registrar calificación, actualizar datos editables | `UsuarioModel`, `ValoracionReputacionModel`, `ZonaOperativaModel` |

---

### Uso desde un endpoint

```php
<?php
// src/api/negociacion.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../domain/NegociacionDomain.php';

$domain = new NegociacionDomain();

// Iniciar negociación (POST)
$body = json_decode(file_get_contents('php://input'), true);
$result = $domain->iniciarNegociacion(
    idLote:      (int)   $body['id_lote'],
    idComprador: (int)   $body['id_comprador'],
    monto:       (float) $body['monto'],
    comentario:          $body['comentario'] ?? null
);

$result['success'] ? json_ok($result) : json_error($result['message']);
```

> El endpoint solo valida que los campos requeridos lleguen y delega toda la lógica al dominio. El dominio llama a los modelos. Los modelos ejecutan el SQL.

---

## Añadir un módulo nuevo

Sigue estos cinco pasos en orden. Usa `users` como referencia.

**1. Componente** — `public/components/[nombre]/[nombre].js`
```js
import { MiServicio } from '../../assets/js/services/mi-entidad.js';

async function init(container) {
    const data = await MiServicio.getAll();
    container.innerHTML = `<ul>${data.map(i => `<li>${i.name}</li>`).join('')}</ul>`;
}
export { init };
```

**2. Servicio JS** — `public/assets/js/services/mi-entidad.js`
```js
import { Http } from '../http.js';

export const MiServicio = {
    getAll()            { return Http.get('mi-entidad'); },
    create(payload)     { return Http.post('mi-entidad/create', payload); }
};
```

**3. Endpoint** — `src/api/mi-entidad.php`
```php
<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../domain/MiServicio.php';

$service = new MiServicio();
json_ok($service->getAll());
```

**4. Dominio** — `src/domain/MiServicio.php`
```php
<?php
require_once __DIR__ . '/../models/MiModelo.php';

class MiServicio {
    private MiModelo $model;
    public function __construct() { $this->model = new MiModelo(); }

    public function getAll(): array {
        return $this->model->findAll();
    }
}
```

**5. Modelo** — `src/models/MiModelo.php`
```php
<?php
require_once __DIR__ . '/../core/Database.php';

class MiModelo {
    private PDO $db;
    public function __construct() { $this->db = Database::get(); }

    public function findAll(): array {
        return $this->db->query("SELECT * FROM mi_tabla WHERE deleted_at IS NULL")->fetchAll();
    }
}
```

---

## Estándares de nomenclatura

### Archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente (carpeta + archivos) | `kebab-case` | `farmer-profile/farmer-profile.js` |
| Modelo PHP | `PascalCase` + `Model` | `FarmerModel.php` |
| Servicio PHP | `PascalCase` + `Service` | `FarmerService.php` |
| Endpoint PHP | `kebab-case`, plural | `farmers.php` |
| Servicio JS | `kebab-case` archivo, `PascalCase` export | `farmers.js` → `export const FarmerService` |

### Verbos por capa

| Operación | Modelo | Dominio |
|---|---|---|
| Obtener todos | `findAll()` | `getAll()` |
| Obtener por ID | `findById(int $id)` | `getById(int $id)` |
| Filtrar | `findByEmail()` | `getByEmail()` |
| Crear | `insert(...)` | `create(...)` |
| Actualizar | `update(int $id, ...)` | `update(int $id, ...)` |
| Eliminar | `softDelete(int $id)` | `delete(int $id)` |

### Base de datos

- Tablas: `snake_case` en plural → `farmer_products`
- Columnas: `snake_case` → `created_at`, `deleted_at`
- PKs: siempre `id`
- FKs: `{tabla_singular}_id` → `farmer_id`

---

## Reglas que no se negocian

- `config/config.php` **nunca** se commitea.
- El SQL vive **solo** en `models/`. Nunca en servicios ni endpoints.
- La lógica de negocio vive **solo** en `domain/`. Nunca en modelos ni endpoints.
- Los componentes JS **nunca** llaman a `fetch()` directamente — siempre a través de `services/`.
- Todas las respuestas HTTP pasan por `json_ok()` o `json_error()` de `Response.php`.

---

## Documentación extendida

La documentación completa de arquitectura, ejemplos por capa y guía de onboarding está disponible en Notion.

---

*Última actualización: Abril 2026*