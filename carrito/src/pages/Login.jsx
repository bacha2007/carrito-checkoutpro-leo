import { useState } from "react";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.username) {
      setUser(data.username);
      localStorage.setItem("user", data.username);
      alert("Login correcto");
    } else {
      alert("Error de login");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Usuario"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Contraseña"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}