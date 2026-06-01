import { useEffect, useMemo, useState } from "react";

export default function useCart() {

    const [cart, setCart] = useState(() => {
        const cartSaved = localStorage.getItem("cartItems");
        return cartSaved ? JSON.parse(cartSaved) : []
    })

    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(cart))
    }, [cart])

    const addToCart = (product) => {

        setCart(prevCart => {
            const matchProduct = prevCart.find(element => element.id === product.id)
            if (matchProduct) {
                return prevCart.map(element => element.id === product.id ? { ...element, cantidad: element.cantidad + 1 } : element)
            }
            return [...prevCart, { ...product, cantidad: 1 }]
        })
    }

    const removeFromCart = (product) => {
        setCart(prevCart => prevCart.filter(element => element.id !== product.id))
    }

    const reduceQuantity = (product) => {
        setCart(prevCart => prevCart.map(element => element.id === product.id ? { ...product, cantidad: product.cantidad - 1 >= 0 ? product.cantidad - 1 : 0 } : element))
    }

    const increaseQuantity = (product) => {
        setCart(prevCart => prevCart.map(element => element.id === product.id ? { ...product, cantidad: product.cantidad + 1 } : element))
    }

    const totalCart = useMemo(() => {
        return Math.round(cart.reduce((total, item) => total + (item.price * item.cantidad), 0))
    }, [cart])

    return {
        cart, addToCart, removeFromCart, reduceQuantity, totalCart, increaseQuantity
    }

}
