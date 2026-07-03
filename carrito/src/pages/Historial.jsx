import { useEffect, useState } from "react";

export default function Historial({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const getOrders = async () => {
      const res = await fetch(
        `http://localhost:8000/orders/${user}`
      );
      const data = await res.json();
      setOrders(data.orders);
    };

    if (user) getOrders();
  }, [user]);

  return (
    <div>

      {orders.length === 0 && <p>No hay pedidos</p>}

      {orders.map((o) => (
        <div key={o.id}>
          <p>Total: ${o.total}</p>
          <p>Estado: {o.status}</p>
          <p>Pago: {o.payment_id}</p>
        </div>
      ))}
    </div>
  );
}