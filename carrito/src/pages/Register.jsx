import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const res = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    alert(data.msg || data.error);
  };

  return (
    <div>
      <h2>Registro</h2>

      <input
        placeholder="Usuario"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Contraseña"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Crear cuenta</button>
    </div>
  );
}