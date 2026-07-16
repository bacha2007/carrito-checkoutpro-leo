# Carrito — Checkout Pro (Mercado Pago)

Aplicación de carrito de compras que integra un frontend en React (Vite) con un backend en FastAPI para procesar pagos mediante Mercado Pago (modo sandbox para desarrollo). Incluye gestión de carrito, registro/login simple de usuarios e historial de pedidos.

## Componentes del proyecto

| Carpeta      | Tecnología      | Rol                                                              |
|--------------|-----------------|-------------------------------------------------------------------|
| `carrito/`   | React + Vite    | Frontend: UI, hooks y llamadas al backend                        |
| `backend/`   | FastAPI (Python)| API: crea preferencias de pago, maneja usuarios y pedidos        |

## Dependencias principales

- **Frontend:** `react`, `react-dom`, `vite`, `@mercadopago/sdk-react`, `axios`
- **Backend:** `fastapi`, `uvicorn`, `python-dotenv`, `mercadopago`

## Requisitos

- Node.js (para levantar el frontend con Vite)
- Python 3 (para el backend con FastAPI)
- pip

## Variables de entorno

El backend necesita `MERCADOPAGO_TOKEN` para inicializar el SDK. Crear un archivo `backend/.env` con la siguiente línea (usar token sandbox durante pruebas):

```
MERCADOPAGO_TOKEN=TU_TOKEN_DE_MERCADOPAGO
```

## Cómo levantar el proyecto

### 1. Backend

```bash
cd backend
# Asegurarse de usar el python correcto (ej: /usr/bin/python3)
python3 -m pip install --user fastapi uvicorn python-dotenv mercadopago
/usr/bin/python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
# API disponible en http://127.0.0.1:8000/
```

### 2. Frontend

En otra terminal:

```bash
cd carrito
npm install
npm run dev
# Frontend disponible en http://localhost:5173/
```

### 3. Probar el flujo completo

1. Abrir `http://localhost:5173`
2. Agregar productos al carrito
3. Ajustar cantidades si corresponde
4. Confirmar el pedido
5. El frontend envía el carrito al backend (`POST /carrito`)
6. El backend crea una preferencia en Mercado Pago y devuelve `id`, `init_point` y `sandbox_init_point`
7. El navegador redirige al checkout de Mercado Pago (sandbox)

## Endpoints relevantes (backend)

| Método | Endpoint               | Descripción                                  |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/`                     | Salud básica de la API                        |
| POST   | `/carrito`               | Crea preferencia de pago en Mercado Pago      |
| POST   | `/register`              | Crea un usuario                               |
| POST   | `/login`                 | Login simple                                  |
| GET    | `/orders/{username}`     | Historial de pedidos aprobados del usuario    |

## Base de datos

El backend usa `tienda.db` (en `backend/`) para persistir usuarios y pedidos.

## Colaboración

Se recomienda que cada colaborador trabaje en su propia rama y abra Pull Requests hacia `master` para fusionar sus cambios.
