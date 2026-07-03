from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union
import mercadopago
import os
from dotenv import load_dotenv
from db import get_connection

# Cargar variables de entorno

load_dotenv()

MERCADOPAGO_TOKEN = os.getenv("MERCADOPAGO_TOKEN")

sdk = mercadopago.SDK(MERCADOPAGO_TOKEN)

# Modelos

class ItemCarrito(BaseModel):
    id: Union[int, str]
    title: str
    unit_price: float
    quantity: int


class Carrito(BaseModel):
    items: List[ItemCarrito]
    user: str

# FastAPI

app = FastAPI()

# ACA EMPIEZA EL BLOQUE B
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        total REAL,
        status TEXT,
        payment_id TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ACA TERMINA EL BLOQUE B

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"mensaje": "Backend funcionando"}

# Checkout Pro

@app.post("/carrito")
def post_carrito(carrito: Carrito):

    preference_data = {
        "items": [
            {
                "title": item.title,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "currency_id": "ARS"
            }
            for item in carrito.items
        ],
        "metadata": {
            "user": carrito.user
        }
    }

    try:
        preference_response = sdk.preference().create(preference_data)

        if "response" not in preference_response:
            return {
                "error": "No se pudo crear la preferencia de pago.",
                "detalle": preference_response
            }

        preference = preference_response["response"]

        if "id" not in preference:
            return preference

        return {
            "id": preference["id"],
            "init_point": preference.get("init_point"),
            "sandbox_init_point": preference.get("sandbox_init_point")
        }

    except Exception as e:
        return {
            "error": "Ocurrió un error al comunicarse con Mercado Pago.",
            "detalle": str(e)
        }

# Webhook

@app.post("/webhook")
async def recibir_webhook(request: Request, background_tasks: BackgroundTasks):

    params = request.query_params

    topic = params.get("topic") or params.get("type")
    id_recurso = params.get("id") or params.get("data.id")

    if topic == "payment" and id_recurso:
        background_tasks.add_task(procesar_pago, id_recurso)

    return {"status": "recibido"}


def procesar_pago(payment_id: str):

    try:
        payment_info = sdk.payment().get(payment_id)
        payment_data = payment_info["response"]

        status_pago = payment_data["status"]
        metadata = payment_data.get("metadata", {})
        usuario = metadata.get("user")
        total = payment_data.get("transaction_amount")

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO orders (username, total, status, payment_id)
            VALUES (?, ?, ?, ?)
        """, (usuario, total, status_pago, payment_id))

        conn.commit()
        conn.close()

    except Exception as e:
        print("Error webhook:", e)
        
class User(BaseModel):
    username: str
    password: str
    
@app.post("/register")
def register(user: User):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (user.username, user.password)
        )
        conn.commit()
        return {"msg": "Usuario creado"}
    except:
        return {"error": "Usuario ya existe"}
    finally:
        conn.close()
        
@app.post("/login")
def login(user: User):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (user.username, user.password)
    )

    found = cursor.fetchone()
    conn.close()

    if found:
        return {"msg": "Login correcto", "username": user.username}

    return {"error": "Credenciales inválidas"}

@app.get("/orders/{username}")
def get_orders(username: str):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM orders WHERE username=?",
        (username,)
    )

    orders = cursor.fetchall()
    conn.close()

    return {"orders": [dict(o) for o in orders]}