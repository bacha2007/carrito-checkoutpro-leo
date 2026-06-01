import axios from "axios"

export default function useBackendAPI() {

    const sendToBackend = async (cart, user) => {
        const parseCart = cart.map(product => ({ id: product.id, title: product.title, unit_price: product.price, quantity: product.cantidad }))
        try {
            console.log("Enviando al backend...");

            const res = await axios.post("http://localhost:8000/carrito", {
                items: parseCart,
                user: user
            });

            // 2. Imprimimos exactamente qué nos devolvió Axios
            console.log("Respuesta completa de Axios:", res);

            // 3. Verificamos la ruta de los datos
            const urlPago = res.data.sandbox_init_point;
            console.log("URL de redirección:", urlPago);

            // 4. Solo redirigimos si la URL existe de verdad
            if (urlPago) {
                window.location.href = urlPago;
            } else {
                console.error("Atención: El backend no devolvió el sandbox_init_point", res.data);
            }

        } catch (error) {
            console.error("Error en la petición:", error);
        }
    }

    return {
        sendToBackend
    }

}