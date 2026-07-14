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
  const [refreshHistorial, setRefreshHistorial] = useState(0)
  const [loading, setLoading] = useState(false)  // 🔥 Para el estado del botón

  useEffect(() => {
    const path = window.location.pathname

    if (path === '/pago-exitoso') {
      setEstadoPago('exitoso')
      setRefreshHistorial(prev => prev + 1)  // Refresca historial
      window.history.replaceState(null, '', '/')
      setTimeout(() => {
        window.location.href = '/'
      }, 5000)
    } else if (path === '/pago-fallido') {
      setEstadoPago('error')
      window.history.replaceState(null, '', '/')
      setTimeout(() => {
        window.location.href = '/'
      }, 5000)
    } else if (path === '/pago-pendiente') {
      setEstadoPago('warning')
      window.history.replaceState(null, '', '/')
      setTimeout(() => {
        window.location.href = '/'
      }, 5000)
    }
  }, [])

  const productosFiltrados = data?.filter(product =>
    product.title.toLowerCase().includes(busqueda.toLowerCase())
  )

  // 🔥 Función para manejar la compra con loading
  const handleConfirmarCompra = async () => {
    setLoading(true)
    try {
      await sendToBackend(cart, user)
    } catch (error) {
      console.error("Error en confirmar compra:", error)
    } finally {
      setLoading(false)  // Siempre se desactiva, incluso si hay error
    }
  }

  return (
    <div className="app-container">

      {!user ? (
        <div className="login-wrapper">
          <h1>Iniciar sesión</h1>
          <Login setUser={setUser} />
          <Register />
        </div>
      ) : (
        <>
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

          {estadoPago === 'exitoso' && (
            <div className="alert success" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '60px' }}>✅</div>
              <h2 style={{ margin: '10px 0 5px' }}>¡Pago aprobado!</h2>
              <p>Gracias por tu compra. Serás redirigido en 5 segundos...</p>
            </div>
          )}
          {estadoPago === 'error' && (
            <div className="alert error" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '60px' }}>❌</div>
              <h2 style={{ margin: '10px 0 5px' }}>Hubo un problema con tu pago</h2>
              <p>Serás redirigido en 5 segundos...</p>
            </div>
          )}
          {estadoPago === 'warning' && (
            <div className="alert warning" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '60px' }}>⏳</div>
              <h2 style={{ margin: '10px 0 5px' }}>Pago pendiente</h2>
              <p>Serás redirigido en 5 segundos...</p>
            </div>
          )}

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
                    <button onClick={() => addToCart(product)}>Agregar</button>
                  </div>
                </article>
              ))}
            </div>
          </main>

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
              onClick={handleConfirmarCompra}
              disabled={cart.length === 0 || loading}
            >
              {loading ? "Procesando..." : "Confirmar compra"}
            </button>
          </aside>

          <section className="history-section">
            <h2>Historial de pedidos</h2>
            <Historial key={refreshHistorial} user={user} />
          </section>
        </>
      )}
    </div>
  )
}

export default App