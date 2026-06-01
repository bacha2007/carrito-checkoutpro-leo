from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union
# SDK de Mercado Pago
import mercadopago
import os
from dotenv import load_dotenv

# 2. Cargar el archivo .env a la memoria
load_dotenv()

# 3. Leer el token (asegurate de que el nombre coincida exacto con tu .env)
MERCADOPAGO_TOKEN = os.getenv("TOKEN_DESARROLLO")

# Agrega credenciales
sdk = mercadopago.SDK(MERCADOPAGO_TOKEN)

class ItemCarrito(BaseModel):
    id: Union[int, str]
    title: str
    unit_price: float
    quantity: int

class Carrito(BaseModel):
    items: List[ItemCarrito]
    user: str

app = FastAPI()
origins = [
    "http://tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:5173",
    "https://tusitio.com" # Reemplaza con tu dominio real
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permite solicitudes de estos dominios
    allow_credentials=True,      # Permite cookies y encabezados de autenticación
    allow_methods=["*"],         # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Permite todos los encabezados HTTP
)

@app.get("/")
def root():
    return "andando"


@app.post("/carrito")
def post_carrito(carrito: Carrito):

    preference_data = {
    "items": [
        {
            "title": item.title,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in carrito.items
        ]
    }
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    return {
        "id": preference["id"],
        "init_point": preference["init_point"],
        "sandbox_init_point": preference["sandbox_init_point"]
    }