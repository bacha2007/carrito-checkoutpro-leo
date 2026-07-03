import { useState, useEffect } from 'react'
import useCart from './hooks/useCarrito'
import useFetch from './hooks/useFetch'
import useBackendAPI from './hooks/useBackendAPI'
import './App.css'

import Historial from './pages/Historial'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const { cart, addToCart, removeFromCart, reduceQuantity, totalCart, increaseQuantity } = useCart()
  const { data } = useFetch()
  const { sendToBackend } = useBackendAPI()

  const [busqueda, setBusqueda] = useState("")
  const [estadoPago, setEstadoPago] = useState(null)

  const [user, setUser] = useState(localStorage.getItem("user"))

  useEffect(() => {
    const path = window.location.pathname

    if (path === '/pago-exitoso') {
      setEstadoPago('exitoso')
      window.history.replaceState(null, '', '/')
    } else if (path === '/pago-fallido') {
      setEstadoPago('error')
      window.history.replaceState(null, '', '/')
    } else if (path === '/pago-pendiente') {
      setEstadoPago('warning')
      window.history.replaceState(null, '', '/')
    }
  }, [])

  const productosFiltrados = data?.filter(product =>
    product.title.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="app-container">

      {/* ================= LOGIN / REGISTER ================= */}
      {!user ? (
        <div className="login-wrapper">
          <h1>Iniciar sesión</h1>

          <Login setUser={setUser} />
          <Register />
        </div>
      ) : (
        <>
          {/* ================= HEADER ================= */}
          <header className="app-header">
            <h2>Bienvenido {user}</h2>

            <button
              className="btn-secondary"
              onClick={() => {
                localStorage.removeItem("user")
                setUser(null)
              }}
            >
              Cerrar sesión
            </button>
          </header>

          {/* ================= ALERTA PAGO ================= */}
          {estadoPago === 'exitoso' && (
            <div className="alert success">¡Pago aprobado! Gracias por tu compra.</div>
          )}

          {estadoPago === 'error' && (
            <div className="alert error">Hubo un problema con tu pago.</div>
          )}

          {estadoPago === 'warning' && (
            <div className="alert warning">Pago pendiente.</div>
          )}

          {/* ================= PRODUCTOS ================= */}
          <main className="product-list">
            <h1 className="title">Productos</h1>

            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <div className="product-grid">
              {productosFiltrados?.map(product => (
                <article key={product.id} className="product-card">
                  <img src={product.images?.[0]} alt={product.title} />

                  <div className="product-body">
                    <h2>{product.title}</h2>
                    <p>${product.price}</p>

                    <button onClick={() => addToCart(product)}>
                      Agregar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* ================= CARRITO ================= */}
          <aside className="cart-sidebar">
            <h2>Carrito</h2>

            {cart.length === 0 ? (
              <p>Carrito vacío</p>
            ) : (
              cart.map(product => (
                <div key={product.id} className="cart-item">
                  <div className="cart-item-info">
                    <p>{product.title}</p>
                    <small>x{product.cantidad}</small>
                  </div>

                  <div className="cart-item-actions">
                    <button className="btn-qty" onClick={() => reduceQuantity(product)}>-</button>
                    <button className="btn-qty" onClick={() => increaseQuantity(product)}>+</button>
                    <button className="btn-remove" onClick={() => removeFromCart(product)}>✕</button>
                  </div>
                </div>
              ))
            )}

            <div className="cart-total">
              <span>Total:</span>
              <span>${totalCart}</span>
            </div>

            <button
              onClick={() => sendToBackend(cart, user)}
              disabled={cart.length === 0}
            >
              Confirmar compra
            </button>
          </aside>

          {/* ================= HISTORIAL ================= */}
          <section className="history-section">
            <h2>Historial de pedidos</h2>
            <Historial user={user} />
          </section>
        </>
      )}
    </div>
  )
}

export default App