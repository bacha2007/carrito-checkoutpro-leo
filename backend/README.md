# FastAPI: Backend de carrito con Mercado Pago

API REST construida con FastAPI que recibe los datos del carrito desde el frontend de React, crea una preferencia de pago en Mercado Pago y devuelve la URL de checkout para redirigir al usuario.

```
backend/
├── env/                    # Entorno virtual de Python
├── __pycache__/            # Caché de Python (generado automáticamente)
├── .env                    # Variables de entorno (TOKEN_DESARROLLO) — NO subir a git
├── .gitignore              # Ignora .env
└── main.py                 # Aplicación FastAPI (modelos, CORS, endpoints)
```

# Instalación y ejecución

## 1. Crear y activar el entorno virtual

```bash
cd backend
python -m venv env
source env/bin/activate        # Linux/macOS
# .\env\Scripts\activate       # Windows
```

## 2. Instalar dependencias

```bash
pip install "fastapi[standard]" mercadopago python-dotenv
```

El proyecto usa las siguientes dependencias:

| Paquete | Propósito |
|---|---|
| `fastapi` | Framework web para construir la API |
| `uvicorn` | Servidor ASGI para ejecutar FastAPI |
| `mercadopago` | SDK oficial de Mercado Pago para Python |
| `python-dotenv` | Carga variables de entorno desde `.env` |
| `pydantic` | Validación de datos con modelos tipados (incluido con FastAPI) |

## 3. Configurar el token de Mercado Pago

Crear un archivo `.env` en la raíz de `backend/` con el token de desarrollador:

```bash
TOKEN_DESARROLLO=TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

Puedes obtener este token desde el dashboard de Mercado Pago para desarrolladores, en la sección "Credentials" → "Access Token".

## 4. Ejecutar el servidor

```bash
fastapi dev main.py
```
El servidor queda disponible en `http://localhost:8000`.

### Endpoints de verificación

```bash
# Endpoint raíz (GET)
curl http://localhost:8000/
# Respuesta: "andando"

# Endpoint del carrito (POST)
curl -X POST http://localhost:8000/carrito \
  -H "Content-Type: application/json" \
  -d '{"items": [{"id": 1, "title": "Producto", "unit_price": 100, "quantity": 2}], "user": "test"}'
```

# Documentación automática

FastAPI genera documentación interactiva automáticamente:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Ambas permiten probar los endpoints directamente desde el navegador.

# Variables de entorno

```python
load_dotenv()
MERCADOPAGO_TOKEN = os.getenv("TOKEN_DESARROLLO")
sdk = mercadopago.SDK(MERCADOPAGO_TOKEN)
```

`load_dotenv()` busca un archivo `.env` en el directorio de trabajo y carga sus variables en `os.environ`. Luego `os.getenv("TOKEN_DESARROLLO")` lee el token.

**¿Por qué separar el token en un archivo `.env` y no escribirlo directamente en el código?**

El token es información sensible. Si se escribe directamente en `main.py` y el código se sube a un repositorio público (como GitHub), cualquiera podría usarlo para hacer transacciones fraudulentas. Al separarlo en `.env` y agregar `.env` al `.gitignore`, el token nunca se sube al repositorio.

```bash
# .gitignore
.env
```

Cada desarrollador crea su propio `.env` local con sus credenciales.

# Modelos Pydantic: validación de datos de entrada

```python
from pydantic import BaseModel
from typing import List, Union

class ItemCarrito(BaseModel):
    id: Union[int, str]
    title: str
    unit_price: float
    quantity: int

class Carrito(BaseModel):
    items: List[ItemCarrito]
    user: str
```

Pydantic es la biblioteca de validación que usa FastAPI. Define **modelos** que describen la estructura que debe tener el JSON que recibe la API.

### **ItemCarrito**

Representa un producto individual dentro del carrito:

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `id` | `int \| str` | `1` o `"abc"` | Identificador del producto |
| `title` | `str` | `"iPhone 9"` | Nombre del producto |
| `unit_price` | `float` | `549.99` | Precio unitario |
| `quantity` | `int` | `2` | Cantidad de unidades |

`Union[int, str]` permite que el `id` sea número o texto, cubriendo APIs que usan IDs numéricos y APIs que usan UUIDs o slugs.

### **Carrito**

Representa el carrito completo:

| Campo | Tipo | Descripción |
|---|---|---|
| `items` | `List[ItemCarrito]` | Lista de productos en el carrito |
| `user` | `str` | Identificador del usuario |

Cuando el frontend envía un `POST /carrito`, FastAPI valida automáticamente que el cuerpo JSON cumpla con la estructura de `Carrito`. Si falta un campo obligatorio o el tipo no coincide, devuelve un error `422 Unprocessable Entity` con una descripción clara del problema, sin necesidad de escribir validaciones manuales.

# CORS: permitir peticiones desde el frontend

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:5173",
    "https://tusitio.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**¿Qué es CORS y por qué hace falta?**

CORS (Cross-Origin Resource Sharing) es una política de seguridad de los navegadores que impide que un sitio web haga peticiones a un dominio diferente del que lo sirvió. El frontend corre en `http://localhost:5173` y el backend en `http://localhost:8000`. Sin CORS, el navegador bloquearía las peticiones del frontend al backend.

`add_middleware(CORSMiddleware, ...)` configura el backend para que incluya los encabezados HTTP necesarios (`Access-Control-Allow-Origin`, etc.) que le indican al navegador que las peticiones desde esos orígenes están permitidas.

### **Parámetros de CORS**

| Parámetro | Valor | Qué hace |
|---|---|---|
| `allow_origins` | lista de URLs | Especifica qué dominios pueden hacer peticiones |
| `allow_credentials` | `True` | Permite enviar cookies y encabezados de autenticación |
| `allow_methods` | `["*"]` | Permite todos los métodos HTTP (GET, POST, PUT, DELETE...) |
| `allow_headers` | `["*"]` | Permite todos los encabezados HTTP personalizados |

En producción, `allow_origins` debe limitarse al dominio real del frontend en lugar de usar `["*"]`, por seguridad.

# Endpoint POST /carrito — El corazón del backend

```python
@app.post("/carrito")
def post_carrito(carrito: Carrito):
    preference_data = {
        "items": [
            {
                "title": item.title,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in carrito.items
        ]
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    return {
        "id": preference["id"],
        "init_point": preference["init_point"],
        "sandbox_init_point": preference["sandbox_init_point"]
    }
```

Este endpoint recibe un `POST` con un JSON que representa el carrito y devuelve la información necesaria para redirigir al usuario a la página de pago de Mercado Pago. Todos estos aspectos se pueden ampliar dentro de la documentación de mercadopago developers en la sección de Checkout Pro

### **Paso 1: Recibir y validar el carrito**

```python
def post_carrito(carrito: Carrito):
```

FastAPI usa el tipado de Python para saber que el cuerpo de la petición debe ser un `Carrito`. Automáticamente:
1. Lee el JSON del cuerpo de la petición.
2. Valida que coincida con el modelo `Carrito` (tipos correctos, campos obligatorios presentes).
3. Si es válido, lo convierte en un objeto `Carrito` y lo pasa a la función.
4. Si no es válido, devuelve un `422 Unprocessable Entity` con los errores de validación.

### **Paso 2: Construir la preferencia de pago**

```python
preference_data = {
    "items": [
        {
            "title": item.title,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in carrito.items
    ]
}
```

Se construye un diccionario con la estructura que espera la API de Mercado Pago. La **comprensión de listas** (list comprehension) recorre todos los items del carrito y transforma cada `ItemCarrito` de Pydantic a un diccionario simple.

**¿Por qué se transforman los datos y no se pasan los modelos Pydantic directamente?** Porque el SDK de Mercado Pago espera diccionarios nativos de Python, no objetos Pydantic. La comprensión de listas convierte cada `ItemCarrito` a `dict`.

### **Paso 3: Crear la preferencia en Mercado Pago**

```python
preference_response = sdk.preference().create(preference_data)
preference = preference_response["response"]
```

`sdk.preference()` obtiene el objeto de preferencias del SDK de Mercado Pago. `.create(preference_data)` envía una petición a la API de Mercado Pago con los items y devuelve una respuesta que contiene, entre otras cosas:

| Campo | Descripción |
|---|---|
| `preference["id"]` | ID único de la preferencia creada |
| `preference["init_point"]` | URL de checkout para producción |
| `preference["sandbox_init_point"]` | URL de checkout para entorno de pruebas |

### **Paso 4: Devolver la respuesta al frontend**

```python
return {
    "id": preference["id"],
    "init_point": preference["init_point"],
    "sandbox_init_point": preference["sandbox_init_point"]
}
```

FastAPI convierte automáticamente este diccionario a JSON y lo devuelve con el código HTTP `200 OK`. El frontend recibe estos datos y redirige al usuario a `sandbox_init_point` para completar el pago.

## Ejemplo de petición y respuesta

```bash
# Petición
curl -X POST http://localhost:8000/carrito \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": 1, "title": "iPhone 9", "unit_price": 549.99, "quantity": 2},
      {"id": 2, "title": "Samsung Universe 9", "unit_price": 1249.99, "quantity": 1}
    ],
    "user": "LeoTest"
  }'
```

```json
// Respuesta
{
  "id": "123456789-abcdef",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?..."
}
```

# Flujo completo de datos

```
Frontend (React)                     Backend (FastAPI)                 Mercado Pago
localhost:5173                       localhost:8000                    api.mercadopago.com
       │                                   │                                │
       │   POST /carrito                   │                                │
       │   { items: [...], user: "x" }     │                                │
       │──────────────────────────────────→│                                │
       │                                   │                                │
       │                                   │   Valida datos con Pydantic    │
       │                                   │       (Carrito, ItemCarrito)   │
       │                                   │                                │
       │                                   │   SDK preference().create()    │
       │                                   │──────────────────────────────→│
       │                                   │                                │
       │                                   │   ←── { id, init_point,       │
       │                                   │         sandbox_init_point }   │
       │                                   │                                │
       │   ←── { id, init_point,           │                                │
       │         sandbox_init_point }      │                                │
       │                                   │                                │
       │   Redirige a sandbox_init_point   │                                │
       │──────────────────────────────────────────────────────────────────→│
       │                                   │                                │
       │                                   │          Usuario paga          │
       │                                   │        en checkout de MP       │
```

# Preguntas posibles

### ¿Qué es una preferencia de pago en Mercado Pago?

Una **preference** (preferencia) es un recurso que se crea en los servidores de Mercado Pago y contiene toda la información necesaria para procesar un pago: productos, precios, cantidades, URLs de retorno, etc. Al crear una preferencia, Mercado Pago devuelve una URL de checkout a la que se redirige al comprador.

### ¿Qué diferencia hay entre `init_point` y `sandbox_init_point`?

- **`init_point`**: URL del checkout en **producción**. Las transacciones son reales y mueven dinero de verdad.
- **`sandbox_init_point`**: URL del checkout en **sandbox** (entorno de pruebas). Se pueden simular pagos con tarjetas de prueba sin costo. Durante el desarrollo y las pruebas se usa `sandbox_init_point`.

Mercado Pago devuelve ambos siempre. El backend los expone y el frontend decide a cuál redirigir.

### ¿Por qué se usan modelos Pydantic en lugar de validar manualmente?

Si no existieran los modelos, habría que escribir algo como:

```python
@app.post("/carrito")
def post_carrito(data: dict):
    if "items" not in data or not isinstance(data["items"], list):
        return {"error": "items es obligatorio"}
    for item in data["items"]:
        if "title" not in item or "unit_price" not in item:
            return {"error": "campos incompletos"}
    # ... más validaciones ...
```

Con Pydantic, esa validación se declara una vez en el modelo y FastAPI la aplica automáticamente en cada petición, devolviendo errores claros sin escribir ni una línea de validación manual.

### ¿Por qué se usa `Union[int, str]` para el `id` de `ItemCarrito`?

Las APIs de productos pueden usar IDs numéricos (como DummyJSON: `"id": 1`) o alfanuméricos (como MongoDB: `"id": "abc123"`). `Union[int, str]` permite ambos casos. Pydantic validará que el valor sea `int` o `str`; si es cualquier otro tipo (como `float` o `list`), devolverá un error.

### ¿Qué pasa si el SDK de Mercado Pago falla?

Si el token es inválido, la API de Mercado Pago está caída o hay un error de red, `sdk.preference().create(preference_data)` lanzará una excepción. En este proyecto no hay un manejador de excepciones específico, por lo que FastAPI devolvería un error `500 Internal Server Error`. Para producción habría que agregar un `try/except` que devuelva un mensaje de error amigable.

### ¿Qué hace `load_dotenv()` exactamente?

Busca un archivo llamado `.env` en el directorio actual y lee cada línea con formato `CLAVE=VALOR`. Cada variable queda disponible a través de `os.getenv("CLAVE")`. Sin `load_dotenv()`, `os.getenv("TOKEN_DESARROLLO")` devolvería `None` porque las variables del archivo `.env` no se cargan automáticamente en el entorno del proceso.

# Funcionalidades del backend

- [x] Endpoint GET `/` para verificar que el servidor está activo.
- [x] Modelo Pydantic `ItemCarrito` con validación de tipos.
- [x] Modelo Pydantic `Carrito` con lista de items y usuario.
- [x] Validación automática de datos de entrada (devuelve 422 si falta algo).
- [x] Configuración de CORS para permitir peticiones del frontend (`localhost:5173`).
- [x] Lectura del token de Mercado Pago desde variable de entorno (`.env`).
- [x] Creación de preferencia de pago en Mercado Pago vía SDK.
- [x] Devolución de `id`, `init_point` y `sandbox_init_point` al frontend.
- [x] Documentación interactiva con Swagger UI (`/docs`) y ReDoc (`/redoc`).
- [ ] Manejo de errores con `try/except` en la creación de preferencia.
- [ ] Logging de solicitudes y respuestas.
- [ ] Endpoint para recibir notificaciones de pago (webhook).
- [ ] Autenticación del frontend hacia el backend.
- [ ] Base de datos para persistir pedidos.
