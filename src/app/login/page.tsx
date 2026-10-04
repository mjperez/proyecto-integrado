import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif' }}>
      <h1>Iniciar Sesión</h1>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        
        <label htmlFor="password">Contraseña:</label>
        <input id="password" name="password" type="password" required />
        
        <button type="submit" formAction={login}>Ingresar</button>
        <button type="submit" formAction={signup}>Registrarse</button>
      </form>
    </div>
  )
}