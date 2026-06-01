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
    return {
        data
    }
}