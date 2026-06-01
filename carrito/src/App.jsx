import useCart from './hooks/useCarrito'
import useFetch from './hooks/useFetch'
import useBackendAPI from './hooks/useBackendAPI'
import './App.css'

function App() {
  const { cart, addToCart, removeFromCart, reduceQuantity, totalCart, increaseQuantity } = useCart()
  const { data } = useFetch()
  const { sendToBackend } = useBackendAPI()

  return (
    <div className="app-container">
      <main className="product-list">
        <h1 className="title">Productos</h1>
        <div className="product-grid">
          {data?.map(product => (
            <article key={product.id} className="product-card">
              <img
                src={product.images?.[0]}
                alt={product.title}
                className="product-img"
              />
              <div className="product-body">
                <h2 className="product-title">{product.title}</h2>
                <p className="product-price">${product.price}</p>
                <button className="btn-add" onClick={() => addToCart(product)}>
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <aside className="cart-sidebar">
        <h2 className="cart-title">Carrito</h2>
        {cart.length === 0 ? (
          <p className="cart-empty">El carrito está vacío</p>
        ) : (
          <div className="cart-items">
            {cart.map(product => (
              <div key={product.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{product.title}</span>
                  <span className="cart-item-qty">x{product.cantidad}</span>
                </div>
                <div className="cart-item-actions">
                  <span className="cart-item-price">
                    ${(product.price * product.cantidad).toFixed(2)}
                  </span>
                  <button className="btn-qty" onClick={() => reduceQuantity(product)}>-</button>
                  <button className="btn-qty" onClick={() => increaseQuantity(product)}>+</button>
                  <button className="btn-remove" onClick={() => removeFromCart(product)}>✕</button>
                </div>
              </div>
            ))}
            <div className="cart-divider" />
            <div className="cart-total">
              <span>Total</span>
              <span className="cart-total-amount">${totalCart}</span>
            </div>
          </div>
        )}
        <button className='btn-add' onClick={() => sendToBackend(cart, "LeoTest")}>Confirmar</button>
      </aside>
    </div>
  )
}

export default App
