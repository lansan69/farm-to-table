# 📐 Arquitectura del Proyecto — Estándar Clean Architecture + MVC

> Este documento es la guía de referencia para todos los colaboradores del proyecto. Define cómo está organizado el sistema, qué hace cada parte, cómo fluye la información y cómo incorporar nuevas funcionalidades siguiendo los estándares acordados.

---

## 1. 🧠 Estándar Arquitectónico: Clean Architecture + MVC

El proyecto combina dos patrones complementarios:

### Clean Architecture
Propuesta por Robert C. Martin ("Uncle Bob"), este patrón organiza el código en **capas concéntricas** donde las capas internas no conocen a las externas. La regla fundamental es:

> **Las dependencias solo apuntan hacia adentro.** El dominio nunca sabe que existe una base de datos o una interfaz de usuario.

| Capa | Responsabilidad |
|---|---|
| **Presentación** | Lo que el usuario ve e interactúa (HTML, CSS, JS) |
| **AJAX / Servicios** | Comunicación entre el frontend y el backend |
| **Dominio** | Reglas de negocio, validaciones, orquestación |
| **Datos** | Acceso a la base de datos, queries |

### MVC (Model-View-Controller)
Complementa la Clean Architecture dando roles claros a los archivos:

| Rol | En este proyecto |
|---|---|
| **Model** | `src/models/*.php` — solo queries SQL |
| **View** | `public/components/` — HTML + CSS + JS del componente |
| **Controller** | `app.js` en el frontend + `src/api/*.php` en el backend |

### ¿Por qué los dos juntos?
MVC organiza *qué archivo hace qué*. Clean Architecture define *hacia dónde pueden apuntar las dependencias*. Juntos garantizan que el código sea fácil de mantener, testear y escalar sin convertirse en un monolito caótico.

---

## 2. 🗺️ Arquitectura General

> El siguiente diagrama muestra cómo se conectan las capas del sistema de extremo a extremo.

![Diagrama de Arquitectura](PEGAR_IMAGEN_AQUI)

### Descripción de capas

**Presentation (Capa de Presentación)**
Los componentes visuales viven aquí. Cada componente es una carpeta independiente con su propio HTML, CSS y JS. El archivo `app.js` actúa como router de componentes: decide cuál montar en pantalla según la navegación.

**AJAX (Capa de Comunicación)**
Los archivos `services/*.js` son los únicos que hablan con el backend. Usan `http.js` como wrapper compartido de `fetch()`, que inyecta automáticamente el token de autenticación en cada petición. Ningún componente llama directamente al backend.

**Domain (Capa de Dominio)**
Los archivos `domain/*.php` contienen toda la lógica de negocio: validaciones, reglas, orquestación entre modelos. El `router.php` mapea cada endpoint AJAX a la función de dominio correspondiente.

**Data (Capa de Datos)**
Los archivos `models/*.php` solo contienen queries SQL. `Database.php` provee una única conexión PDO compartida (Singleton). `config.php` contiene credenciales y variables de entorno, nunca se sube al repositorio.

---

## 3. 🔄 Flujo de Trabajo (Workflow)

El flujo de una petición completa sigue este camino:

````
[Usuario interactúa] 
    → [Componente JS detecta el evento]
    → [service.js llama a http.js con fetch()]
    → [HTTP request llega a public/index.php]
    → [Router.php identifica el endpoint]
    → [domain/*.php ejecuta la lógica de negocio]
    → [model/*.php ejecuta la query en MySQL/MariaDB]
    → [Response.php devuelve JSON]
    → [service.js recibe el JSON]
    → [Componente JS actualiza el DOM]
````

### Reglas de flujo que NUNCA se deben romper

- ❌ Un componente JS **nunca** hace `fetch()` directo — siempre usa un `service.js`
- ❌ Un `model.php` **nunca** contiene lógica de negocio — solo SQL
- ❌ Un `api/*.php` **nunca** tiene lógica compleja — solo llama al dominio
- ❌ El dominio **nunca** conoce de HTML, rutas o sesiones HTTP directamente
- ✅ Todo flujo va: Componente → Service → API → Domain → Model → DB

---

## 4. 📁 Estructura de Carpetas

````
/project-root
│
├── public/                      ← Única carpeta expuesta al servidor web
│   ├── index.php                ← Punto de entrada único (todas las peticiones pasan aquí)
│   ├── assets/
│   │   ├── css/global.css       ← Estilos globales compartidos
│   │   └── js/
│   │       ├── app.js           ← Router de componentes frontend
│   │       └── http.js          ← Wrapper de fetch() con token de auth
│   └── components/
│       ├── product-list/
│       │   ├── product-list.html
│       │   ├── product-list.css
│       │   └── product-list.js
│       └── farmer-profile/
│           ├── farmer-profile.html
│           ├── farmer-profile.css
│           └── farmer-profile.js
│
├── src/                         ← Nunca expuesta al servidor web
│   ├── core/
│   │   ├── Database.php         ← Singleton PDO (una sola conexión siempre)
│   │   ├── Router.php           ← Mapea /api/X a una función de dominio
│   │   └── Response.php         ← Helpers: json_response(), error_response()
│   │
│   ├── models/                  ← Capa de datos: SOLO queries, cero lógica
│   │   ├── ProductModel.php
│   │   ├── FarmerModel.php
│   │   └── OrderModel.php
│   │
│   ├── domain/                  ← Lógica de negocio: valida, decide, orquesta
│   │   ├── ProductService.php
│   │   ├── FarmerService.php
│   │   └── OrderService.php
│   │
│   └── api/                     ← Handlers AJAX: wrappers delgados únicamente
│       ├── products.php
│       ├── farmers.php
│       └── orders.php
│
├── config/
│   ├── config.php               ← Credenciales y flags de entorno (NO se sube al repo)
│   └── config.example.php       ← Plantilla segura para nuevos desarrolladores
│
└── .htaccess                    ← Redirige todo el tráfico a public/index.php
````

---

## 5. 📂 Descripción de Carpetas

### `public/`
Es la **única carpeta visible desde el navegador**. Todo lo que esté fuera de aquí es inaccesible por HTTP. Contiene el punto de entrada (`index.php`), los assets globales y los componentes frontend.

### `public/components/`
Cada componente es una **carpeta autocontenida** con tres archivos que comparten el mismo nombre en `kebab-case`: `.html` para la estructura, `.css` para los estilos locales, `.js` para el comportamiento. Un componente no debe importar estilos ni lógica de otro componente directamente.

### `public/assets/js/`
- **`app.js`**: El router del frontend. Escucha cambios de navegación y monta/desmonta componentes en el DOM.
- **`http.js`**: El único lugar donde vive `fetch()`. Agrega el token JWT automáticamente a cada petición.

### `src/core/`
Infraestructura compartida que no pertenece a ningún dominio de negocio específico.
- **`Database.php`**: Garantiza una sola conexión PDO activa durante toda la petición (patrón Singleton).
- **`Router.php`**: Lee la URL de la petición y la mapea al handler correcto en `src/api/`.
- **`Response.php`**: Estandariza todas las respuestas JSON del sistema.

### `src/models/`
La **capa de datos pura**. Cada archivo corresponde a una entidad de la base de datos. Solo contiene métodos con queries SQL. No valida, no decide, no orquesta. Si necesita datos de otra tabla, llama a otro modelo.

### `src/domain/`
El **corazón del sistema**. Aquí vive toda la lógica de negocio: validaciones de entrada, reglas de negocio, orquestación de múltiples modelos. Es la capa más importante y la más protegida. No sabe nada de HTTP ni de HTML.

### `src/api/`
Los **handlers HTTP**. Son archivos delgados cuya única responsabilidad es recibir la petición, extraer los parámetros y pasarlos al servicio de dominio correspondiente. No contienen lógica de negocio.

### `config/`
- **`config.php`**: Credenciales reales. **Nunca se sube al repositorio** (está en `.gitignore`).
- **`config.example.php`**: Plantilla vacía con las variables que hay que definir. Sí se sube al repo para que nuevos colaboradores sepan qué configurar.

---

## 6. 🧩 Ejemplo Completo: Módulo de Usuarios

A continuación se muestra cómo implementar desde cero el módulo de `users` (crear usuario y listar todos los usuarios), siguiendo todos los estándares del proyecto.

### Paso 1 — Modelo: `src/models/UserModel.php`

Solo SQL, sin lógica.

```php
<?php

class UserModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function findAll(): array {
        $stmt = $this->db->query("SELECT id, name, email, created_at FROM users");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(string $name, string $email, string $passwordHash): int {
        $stmt = $this->db->prepare(
            "INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)"
        );
        $stmt->execute([
            ':name'          => $name,
            ':email'         => $email,
            ':password_hash' => $passwordHash,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
```

### Paso 2 — Dominio: `src/domain/UserService.php`

Lógica de negocio y validaciones.

```php
<?php

class UserService {
    private UserModel $userModel;

    public function __construct() {
        $this->userModel = new UserModel();
    }

    public function getAllUsers(): array {
        return $this->userModel->findAll();
    }

    public function createUser(array $data): array {
        // Validación de campos requeridos
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            throw new InvalidArgumentException('Nombre, email y contraseña son requeridos.');
        }

        // Validación de formato de email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('El formato del email no es válido.');
        }

        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
        $newUserId    = $this->userModel->create($data['name'], $data['email'], $passwordHash);

        return ['id' => $newUserId, 'name' => $data['name'], 'email' => $data['email']];
    }
}
```

### Paso 3 — API Handler: `src/api/users.php`

Wrapper delgado. Solo recibe y pasa.

```php
<?php

require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../domain/UserService.php';

$userService = new UserService();
$method      = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $users = $userService->getAllUsers();
        json_response($users);
    }

    if ($method === 'POST') {
        $body    = json_decode(file_get_contents('php://input'), true);
        $newUser = $userService->createUser($body);
        json_response($newUser, 201);
    }
} catch (InvalidArgumentException $e) {
    error_response($e->getMessage(), 400);
} catch (Exception $e) {
    error_response('Error interno del servidor.', 500);
}
```

### Paso 4 — Registrar la ruta en `Router.php`

```php
// Dentro del mapa de rutas:
'/api/users' => __DIR__ . '/../api/users.php',
```

### Paso 5 — Service JS: `public/assets/js/services/userService.js`

Toda comunicación con el backend desde el frontend.

```javascript
import { http } from '../http.js';

const BASE_URL = '/api/users';

export const userService = {
    async getAllUsers() {
        return http.get(BASE_URL);
    },

    async createUser(userData) {
        return http.post(BASE_URL, userData);
    },
};
```

### Paso 6 — Componente: `public/components/user-list/`

**`user-list.html`**
```html
<section class="user-list">
    <h2>Usuarios registrados</h2>
    <ul id="userListContainer"></ul>
</section>
```

**`user-list.js`**
```javascript
import { userService } from '../../assets/js/services/userService.js';

async function renderUserList() {
    const userListContainer = document.getElementById('userListContainer');
    const userList          = await userService.getAllUsers();

    userListContainer.innerHTML = userList
        .map(user => `<li>${user.name} — ${user.email}</li>`)
        .join('');
}

renderUserList();
```

---

## 7. 🏷️ Estándares de Nombres

Seguir estos estándares es **obligatorio** para mantener la consistencia del proyecto. Cualquier PR que no los respete será rechazado en revisión.

### Carpetas

| Estándar | Ejemplo |
|---|---|
| `kebab-case` siempre | `product-list/`, `farmer-profile/`, `user-orders/` |

### Archivos

| Capa | Estándar | Ejemplo |
|---|---|---|
| Clases PHP (`src/`) | `PascalCase.php` | `UserService.php`, `ProductModel.php` |
| Endpoints API (`api/`) | `kebab-case.php` | `users.php`, `farmer-orders.php` |
| Config | `kebab-case.php` | `config.php`, `config.example.php` |
| Módulos JS | `camelCase.js` | `app.js`, `http.js`, `userService.js` |
| Componentes frontend | `kebab-case` (igual que la carpeta) | `user-list.js`, `user-list.html` |
| CSS | `kebab-case.css` | `global.css`, `user-list.css` |

### Variables y símbolos por lenguaje

#### PHP

| Tipo | Estándar | Ejemplo |
|---|---|---|
| Clases | `PascalCase` | `class UserService {}` |
| Métodos | `camelCase` | `public function getAllUsers()` |
| Variables locales | `camelCase` | `$userList`, `$passwordHash` |
| Constantes / env flags | `SCREAMING_SNAKE_CASE` | `DB_HOST`, `MAX_FILE_SIZE` |
| Propiedades de clase | `camelCase` | `private PDO $dbConnection` |

> ⚠️ **Nunca** uses notación húngara (`$strName`, `$arrUsers`). Agrega ruido sin valor.

#### JavaScript

| Tipo | Estándar | Ejemplo |
|---|---|---|
| Variables e instancias | `camelCase` | `const currentUser`, `let isLoading` |
| Clases y constructores | `PascalCase` | `class ComponentRouter {}` |
| Constantes verdaderas | `SCREAMING_SNAKE_CASE` | `const API_BASE_URL = '/api'` |
| Variables de módulo privadas | `_camelCase` | `let _cachedUsers = null` |
| Referencias al DOM | `camelCase` + sufijo del tipo | `const userListContainer`, `const submitBtn` |

### Resumen rápido (para tener siempre a mano)

````
Carpetas          →  kebab-case
Clases PHP        →  PascalCase.php       (coincide con el nombre de la clase)
Endpoints PHP     →  kebab-case.php       (trátalo como un segmento de URL)
Módulos JS        →  camelCase.js
Componentes       →  kebab-case           (carpeta y los 3 archivos llevan el mismo nombre)
CSS               →  kebab-case.css

Variables PHP     →  camelCase
Métodos PHP       →  camelCase
Clases PHP        →  PascalCase
Constantes PHP    →  SCREAMING_SNAKE_CASE

Variables JS      →  camelCase
Clases JS         →  PascalCase
Constantes JS     →  SCREAMING_SNAKE_CASE
Referencias DOM   →  camelCase + sufijo   (ej: submitBtn, modalEl, userListContainer)
JS módulo-priv    →  _camelCase
````

---

> 📌 **Nota para nuevos colaboradores:** Antes de crear cualquier archivo, verifica en qué capa estás trabajando y consulta la tabla de estándares correspondiente. Cuando tengas dudas, pregunta antes de hacer un PR — es más fácil corregir una decisión de nombre antes de que se propague por el código.