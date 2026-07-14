import axios from "axios"

export default function useBackendAPI() {

    const sendToBackend = async (cart, user) => {
        // Validaciones
        if (!cart || cart.length === 0) {
            alert("🛒 El carrito está vacío. Agregá productos antes de comprar.");
            return;
        }
        if (!user) {
            alert("👤 No hay usuario logueado. Iniciá sesión primero.");
            return;
        }

        const parseCart = cart.map(product => ({
            id: product.id,
            title: product.title,
            unit_price: product.price,
            quantity: product.cantidad
        }));

        console.log("📦 Enviando al backend:", { items: parseCart, user });

        try {
            const res = await axios.post("http://localhost:8000/carrito", {
                items: parseCart,
                user: user
            });

            console.log("✅ Respuesta del backend:", res);

            if (res.data && res.data.error) {
                alert(`❌ Error del backend: ${res.data.error}\nDetalle: ${res.data.detalle || 'Sin detalles'}`);
                console.error("Error del backend:", res.data);
                return;
            }

            const urlPago = res.data.sandbox_init_point;
            console.log("🔗 URL de redirección:", urlPago);

            if (urlPago) {
                window.location.href = urlPago;
            } else {
                alert("⚠️ No se recibió URL de pago. Revisá la consola.");
                console.error("Atención: El backend no devolvió sandbox_init_point", res.data);
            }

        } catch (error) {
            console.error("❌ Error en la petición:", error);
            alert("🚨 Error de conexión con el servidor.\nAsegurate de que el backend esté corriendo en http://localhost:8000");
        }
    }

    return {
        sendToBackend
    }
}