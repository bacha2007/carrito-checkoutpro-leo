import { useState } from 'react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.msg === 'Usuario creado') {
        setMensaje('✅ Usuario registrado exitosamente');
        setUsername('');
        setPassword('');
      } else {
        setMensaje(data.error || 'Error al registrar usuario');
      }
    } catch (err) {
      setMensaje('Error de conexión con el servidor');
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <h3>Registro</h3>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {mensaje && <p className="msg">{mensaje}</p>}
      <button type="submit">Crear cuenta</button>
    </form>
  );
}