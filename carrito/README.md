# React + Vite: Carrito de compras con pago integrado

En este repositorio se encuentra una aplicación en React que consume la API pública de DummyJSON para obtener un catálogo de productos. Permite agregar productos a un carrito, modificar cantidades, eliminar items y calcular el total. El carrito persiste automáticamente en localStorage. Al confirmar la compra, los datos se envían a un backend en FastAPI que genera un link de pago de Mercado Pago y redirige al usuario al checkout. La lógica de estado, efectos y comunicación con el backend está encapsulada en custom hooks para mantener el componente principal limpio y modular.

```
carrito/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png               
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── hooks/
│   │   ├── useFetch.jsx           # Custom hook: fetch de productos desde DummyJSON
│   │   ├── useCarrito.jsx         # Custom hook: lógica completa del carrito
│   │   ├── useBackendAPI.jsx      # Custom hook: envío del carrito al backend
│   │   
│   ├── App.jsx                    # Componente raíz: importa hooks y orquesta el render
│   ├── App.css                    # Estilos de la app (grid de productos, carrito lateral)
│   ├── index.css                  # Estilos globales (tema oscuro, variables CSS)
│   └── main.jsx                   # Punto de entrada: monta App en #root
├── index.html                     # HTML base con <div id="root">
├── package.json                   # Dependencias: react, axios, @mercadopago/sdk-react
├── vite.config.js                 # Configuración de Vite con plugin de React
└── eslint.config.js               # Reglas de linting
```

En _hooks_ encontramos la lógica de la aplicación encapsulada en tres custom hooks: `useFetch` (obtención de datos), `useCarrito` (gestión del carrito con persistencia) y `useBackendAPI` (comunicación con el backend para el pago).

# Instalación y ejecución

Para instalar las dependencias del proyecto y levantar el entorno de desarrollo:

```bash
npm install
npm run dev
```

Para generar el build de producción:

```bash
npm run build
npm run preview
```

# Aclaraciones sobre las APIs

## DummyJSON — Catálogo de productos

La aplicación consume el endpoint `https://dummyjson.com/products`. Este endpoint es público, no requiere autenticación y devuelve un JSON con un array de productos. Cada producto incluye campos como `id`, `title`, `price`, `images` (array de URLs), `description`, entre otros.

El campo `images` es un array; en App.jsx se usa solo la primera imagen:

```jsx
<img src={product.images?.[0]} alt={product.title} />
```

El operador `?.` (optional chaining) evita que la app explote si `images` viene vacío o `undefined`.

## Backend propio — Procesamiento de pago

La app envía el carrito a `http://localhost:8000/carrito` mediante un POST con axios. El backend crea una preferencia en Mercado Pago y devuelve una URL de pago. La app redirige al usuario a esa URL para completar la transacción.

# Custom hooks: toda la lógica fuera de App.jsx

Cuando la lógica de estado, efectos y eventos empieza a crecer, App.jsx se vuelve difícil de leer y mantener. Los custom hooks encapsulan esa lógica en funciones separadas. Cada hook es una función de JavaScript que utiliza hooks de React (`useState`, `useEffect`, `useMemo`) y retorna un objeto con los datos y funciones que necesita el componente.

En App.jsx, en lugar de tener múltiples estados y funciones desperdigadas, simplemente se llama a los hooks y se desestructura lo que retornan:

```jsx
const { cart, addToCart, removeFromCart, reduceQuantity, totalCart, increaseQuantity } = useCart()
const { data } = useFetch()
const { sendToBackend } = useBackendAPI()
```

## useFetch.jsx — Obtención de productos

Este hook se encarga de una sola cosa: traer los productos desde DummyJSON cuando el componente se monta.

```jsx
import { useEffect, useState } from "react"
import axios from "axios"

export default function useFetch() {
    const [data, setData] = useState([])

    useEffect(() => {
        async function getData() {
            try {
                const response = await axios.get("https://dummyjson.com/products")
                setData(response.data.products)
            } catch (error) {
                console.log(error)
            }
        }
        getData()
    }, [])

    return { data }
}
```

### **¿Por qué axios y no fetch nativo?**

Ambos funcionan, pero axios ofrece varias ventajas:
- **Transformación automática**: convierte la respuesta a JSON sin llamar a `.json()`.
- **Manejo de errores más claro**: en fetch, un `404` o `500` no lanza una excepción; hay que verificar `response.ok` manualmente. Con axios, los errores HTTP caen directamente en el `catch`.
- **Sintaxis más concisa**: `response.data` en lugar de dos pasos (`await response.json()`).

En este proyecto se usa axios de forma consistente tanto en `useFetch` como en `useBackendAPI`.

### **¿Por qué el useEffect tiene array vacío `[]`?**

El segundo argumento de `useEffect` es el array de dependencias. Cuando está vacío, el efecto se ejecuta una sola vez: cuando el componente se monta por primera vez. Es perfecto para un fetch inicial de datos que no necesita repetirse.

## useCarrito.jsx — El corazón de la aplicación

Este hook concentra toda la lógica de gestión del carrito: agregar productos, eliminar, modificar cantidades, calcular el total y persistir en localStorage.

```jsx
import { useEffect, useMemo, useState } from "react"

export default function useCart() {
    const [cart, setCart] = useState(() => {
        const cartSaved = localStorage.getItem("cartItems")
        return cartSaved ? JSON.parse(cartSaved) : []
    })

    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(cart))
    }, [cart])

    const addToCart = (product) => {
        setCart(prevCart => {
            const matchProduct = prevCart.find(element => element.id === product.id)
            if (matchProduct) {
                return prevCart.map(element =>
                    element.id === product.id
                        ? { ...element, cantidad: element.cantidad + 1 }
                        : element
                )
            }
            return [...prevCart, { ...product, cantidad: 1 }]
        })
    }

    const removeFromCart = (product) => {
        setCart(prevCart => prevCart.filter(element => element.id !== product.id))
    }

    const reduceQuantity = (product) => {
        setCart(prevCart =>
            prevCart.map(element =>
                element.id === product.id
                    ? { ...product, cantidad: product.cantidad - 1 >= 0 ? product.cantidad - 1 : 0 }
                    : element
            )
        )
    }

    const increaseQuantity = (product) => {
        setCart(prevCart =>
            prevCart.map(element =>
                element.id === product.id
                    ? { ...product, cantidad: product.cantidad + 1 }
                    : element
            )
        )
    }

    const totalCart = useMemo(() => {
        return Math.round(
            cart.reduce((total, item) => total + item.price * item.cantidad, 0)
        )
    }, [cart])

    return {
        cart, addToCart, removeFromCart,
        reduceQuantity, totalCart, increaseQuantity
    }
}
```

### **Estados del hook**

| Estado | Tipo | Valor inicial | Qué almacena |
|---|---|---|---|
| `cart` | array | `[]` (o lo que haya en localStorage) | Productos en el carrito con su `cantidad` |

### **Persistencia con localStorage**

```jsx
const [cart, setCart] = useState(() => {
    const cartSaved = localStorage.getItem("cartItems")
    return cartSaved ? JSON.parse(cartSaved) : []
})
```

Se usa una **función inicializadora** como argumento de `useState`. Esta función se ejecuta una sola vez, cuando el componente se monta, y su valor de retorno se usa como estado inicial. Aquí lee `localStorage` y, si existe un carrito guardado, lo usa como punto de partida. Si no existe, empieza con un array vacío.

```jsx
useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cart))
}, [cart])
```

Cada vez que `cart` cambia, se ejecuta este efecto y se guarda el array convertido a JSON en `localStorage` bajo la clave `"cartItems"`. Esto garantiza que el carrito sobreviva a recargas de página.

**Limitación**: si el usuario abre la app en dos pestañas y modifica el carrito en una, la otra no se entera. Para eso haría falta escuchar el evento `storage` del navegador, que está marcado como funcionalidad pendiente.

### **addToCart — Agregar productos**

```jsx
const addToCart = (product) => {
    setCart(prevCart => {
        const matchProduct = prevCart.find(element => element.id === product.id)
        if (matchProduct) {
            return prevCart.map(element =>
                element.id === product.id
                    ? { ...element, cantidad: element.cantidad + 1 }
                    : element
            )
        }
        return [...prevCart, { ...product, cantidad: 1 }]
    })
}
```

`setCart` recibe una **función** en lugar de un valor directo. Esto es importante porque el nuevo estado depende del estado anterior (`prevCart`). Si usáramos `setCart(cart => ...)`, siempre tomaríamos el valor más actualizado de `cart`, evitando bugs con renders concurrentes.

La función hace una de dos cosas:

- **Si el producto ya está en el carrito**: busca el producto por `id` y le incrementa `cantidad` en 1, dejando el resto igual.
- **Si el producto NO está en el carrito**: crea un nuevo array con el spread del anterior y agrega el producto con `cantidad: 1`.

### **removeFromCart — Eliminar productos**

```jsx
const removeFromCart = (product) => {
    setCart(prevCart => prevCart.filter(element => element.id !== product.id))
}
```

`filter` devuelve un nuevo array con todos los elementos cuyo `id` sea diferente del `id` del producto recibido. Es decir, elimina el producto del carrito por completo.

### **reduceQuantity e increaseQuantity — Modificar cantidades**

```jsx
const reduceQuantity = (product) => {
    setCart(prevCart =>
        prevCart.map(element =>
            element.id === product.id
                ? { ...product, cantidad: product.cantidad - 1 >= 0 ? product.cantidad - 1 : 0 }
                : element
        )
    )
}

const increaseQuantity = (product) => {
    setCart(prevCart =>
        prevCart.map(element =>
            element.id === product.id
                ? { ...product, cantidad: product.cantidad + 1 }
                : element
        )
    )
}
```

Ambas recorren el array con `map` y modifican solo el elemento que coincide con el `id` del producto recibido.

**reduceQuantity** tiene un control de piso: si `cantidad - 1` da negativo, asigna `0`. Esto evita cantidades negativas, aunque en la práctica el botón `-` no debería llegar a ese punto si se combina con un `removeFromCart` cuando la cantidad llega a 0 (funcionalidad que se podría agregar).

### **totalCart — Cálculo del total con useMemo**

```jsx
const totalCart = useMemo(() => {
    return Math.round(
        cart.reduce((total, item) => total + item.price * item.cantidad, 0)
    )
}, [cart])
```

`useMemo` memoriza el resultado de una función costosa y solo la recalcula cuando cambian sus dependencias (en este caso, `cart`). Sin `useMemo`, el total se recalcularía en cada render, incluso si el carrito no ha cambiado.

`cart.reduce()` itera sobre todos los items del carrito y acumula la suma de `price * cantidad` de cada uno. `Math.round` redondea el resultado para evitar decimales largos.

## useBackendAPI.jsx — Comunicación con el backend

Este hook maneja el envío del carrito al backend de FastAPI para generar el link de pago de Mercado Pago.

```jsx
import axios from "axios"

export default function useBackendAPI() {
    const sendToBackend = async (cart, user) => {
        const parseCart = cart.map(product => ({
            id: product.id,
            title: product.title,
            unit_price: product.price,
            quantity: product.cantidad
        }))

        try {
            const res = await axios.post("http://localhost:8000/carrito", {
                items: parseCart,
                user: user
            })

            const urlPago = res.data.sandbox_init_point

            if (urlPago) {
                window.location.href = urlPago
            } else {
                console.error("El backend no devolvió sandbox_init_point", res.data)
            }
        } catch (error) {
            console.error("Error en la petición:", error)
        }
    }

    return { sendToBackend }
}
```

### **Transformación de datos**

El frontend trabaja con productos que tienen una propiedad `price` y una propiedad `cantidad`. El backend espera `unit_price` y `quantity`. El hook transforma el array con `map` para adaptar el formato:

```jsx
const parseCart = cart.map(product => ({
    id: product.id,
    title: product.title,
    unit_price: product.price,
    quantity: product.cantidad
}))
```

### **Envío y redirección**

`axios.post` envía los datos al backend. La respuesta contiene `sandbox_init_point`, una URL de Mercado Pago en entorno de pruebas. Si la URL existe, el navegador redirige al usuario allí con `window.location.href = urlPago`.

Si el backend no devuelve la URL (por ejemplo, si el token de MP es inválido), se muestra un error en consola en lugar de redirigir a una URL vacía.

**¿Por qué `sandbox_init_point` y no `init_point`?**
- `init_point`: URL de pago en producción.
- `sandbox_init_point`: URL de pago en entorno de pruebas (sandbox). Como esta app está en desarrollo, se usa el sandbox para probar sin dinero real.

# Cómo viajan los datos: paso de props

App.jsx es el dueño de todos los estados del proyecto. Obtiene datos y funciones a través de los hooks y luego los distribuye al JSX directamente (no hay componentes hijos con props adicionales, salvo el caso de que se decidiera extraer Character, ProductCard o CartItem como componentes separados).

```
App.jsx
  │
  ├── useFetch() → retorna:
  │     └── data  ──────────→ se mapea en <article className="product-card">
  │
  ├── useCart() → retorna:
  │     ├── cart             ──→ se mapea en <div className="cart-items">
  │     ├── addToCart        ──→ onClick del botón "Agregar" de cada producto
  │     ├── removeFromCart   ──→ onClick del botón "✕" de cada item del carrito
  │     ├── reduceQuantity   ──→ onClick del botón "-" de cada item del carrito
  │     ├── increaseQuantity ──→ onClick del botón "+" de cada item del carrito
  │     └── totalCart        ──→ se renderiza en <div className="cart-total">
  │
  ├── useBackendAPI() → retorna:
  │     └── sendToBackend   ──→ onClick del botón "Confirmar"
  │
  └── Estado local (ninguno, toda la lógica está en hooks)
```

# Preguntas posibles

### ¿Por qué `useState(() => { ... })` con función inicializadora y no `useState(JSON.parse(localStorage.getItem(...)))` directamente?

Si se pasara una expresión como `JSON.parse(localStorage.getItem("cartItems"))`, esa expresión se ejecutaría **en cada render**, no solo en el montaje inicial. Aunque React solo usa el valor del primer render para el estado inicial, la operación de leer y parsear localStorage se seguiría ejecutando innecesariamente. Al usar una función, esa función se ejecuta una sola vez.

### ¿Por qué `setCart(prevCart => ...)` en lugar de `setCart(...)` directamente?

Cuando el nuevo estado depende del anterior, hay que usar la forma funcional de `setState`. Si en lugar de eso se escribiera `setCart(cart.map(...))`, se estaría tomando el valor de `cart` del closure actual, que podría estar desactualizado si hay múltiples actualizaciones en batch (como en React 18+ con concurrent rendering). La forma funcional garantiza que siempre se trabaje con el estado más reciente.

### ¿Por qué `useMemo` para `totalCart`?

`useMemo` evita recalcular el total en cada render. Sin `useMemo`, cada vez que App se renderiza (por cualquier motivo, aunque el carrito no haya cambiado), JavaScript recorrería todo el array del carrito sumando precios. Con `useMemo`, el cálculo solo se ejecuta cuando `cart` cambia, y el resto de las veces devuelve el valor memorizado.

### ¿Por qué `onClick={() => addToCart(product)}` y no `onClick={addToCart(product)}`?

Si se escribiera `onClick={addToCart(product)}`, la función se ejecutaría **en el momento del renderizado**, no cuando el usuario hace clic. El valor de retorno de `addToCart(product)` (que es `undefined`, porque `addToCart` no retorna nada) se asignaría a `onClick`. Al envolverla en una arrow function, se pasa una referencia a una función que se ejecutará solo cuando ocurra el evento `onClick`, y en ese momento se ejecuta `addToCart` con el `product` correcto.

### ¿Por qué axios lanza error automáticamente en HTTP 4xx/5xx y fetch no?

Fetch considera que cualquier respuesta del servidor (incluso 404 o 500) es una respuesta exitosa en términos de promesa. Solo lanza error si hay un problema de red. Con axios, cualquier código HTTP fuera del rango 2xx lanza una excepción que cae directamente en el `catch`. Esto simplifica el manejo de errores.

### ¿Por qué se usa `map` en `reduceQuantity` en lugar de `filter`?

`map` modifica un elemento específico y mantiene el resto igual, conservando la longitud del array. Si usáramos `filter` para reducir cantidad, cuando la cantidad llega a 0 el producto desaparecería del carrito. Con `map`, el producto permanece con cantidad 0 (aunque visualmente podría mejorarse ocultándolo o eliminándolo automáticamente al llegar a 0).

### ¿Qué diferencia hay entre `init_point` y `sandbox_init_point`?

Ambos son URLs de checkout de Mercado Pago. `init_point` redirige al entorno de producción (dinero real). `sandbox_init_point` redirige al entorno de pruebas (sandbox), donde se pueden simular pagos con tarjetas de prueba sin costo. Durante el desarrollo se usa `sandbox_init_point`.

# Funcionalidades de la app

- [x] Visualizar productos en tarjetas con imagen, título y precio.
- [x] Agregar productos al carrito (crea entrada con `cantidad: 1`).
- [x] Incrementar cantidad de un producto en el carrito.
- [x] Decrementar cantidad de un producto en el carrito (con piso en 0).
- [x] Eliminar productos del carrito por completo.
- [x] Cálculo automático del total con `useMemo`.
- [x] Persistencia del carrito en localStorage (recuperación al recargar).
- [x] Sincronización localStorage ↔ estado de React con `useEffect`.
- [x] Enviar carrito al backend para generar link de pago.
- [x] Redirección al checkout de Mercado Pago (sandbox).
- [x] Transformación de datos al formato del backend antes de enviar.
- [x] Manejo de errores en fetch, envío y parseo de localStorage.
- [ ] Sincronización del carrito entre pestañas (`storage` event).
- [ ] Eliminar producto automáticamente al llegar a cantidad 0.
- [ ] Filtros y búsqueda de productos.
- [ ] Componentes hijos extraídos (ProductCard, CartItem) para mejor separación.
- [ ] Integración del Wallet de Mercado Pago embebido (MercadoButton.jsx).
- [ ] Indicator de carga mientras se obtienen productos de DummyJSON.
