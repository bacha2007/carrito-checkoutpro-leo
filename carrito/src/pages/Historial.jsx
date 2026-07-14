import { useEffect, useState } from "react";

export default function Historial({ user }) {
  const [orders, setOrders] = useState([]);

  const getOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8000/orders/${user}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error al obtener historial:", error);
    }
  };

  useEffect(() => {
    getOrders();
  }, [user]);

  const handleDelete = async (orderId) => {
    if (!window.confirm("¿Eliminar este pedido del historial?")) return;
    try {
      const res = await fetch(`http://localhost:8000/orders/${orderId}?username=${user}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders(orders.filter((o) => o.id !== orderId));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Error al eliminar el pedido");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div>
      {orders.length === 0 && <p>No hay pedidos confirmados</p>}
      {orders.map((o) => (
        <div key={o.id} style={{ position: "relative", marginBottom: "12px" }}>
          <p><strong>Total:</strong> ${o.total}</p>
          <p><strong>Estado:</strong> {o.status}</p>
          <p><strong>Pago:</strong> {o.payment_id}</p>
          <button
            onClick={() => handleDelete(o.id)}
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              border: "none",
              borderRadius: "40px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              marginTop: "6px",
            }}
            onMouseEnter={(e) => e.target.style.background = "#fecaca"}
            onMouseLeave={(e) => e.target.style.background = "#fee2e2"}
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}