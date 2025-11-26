import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simula um pequeno delay para melhor UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    const success = login(username, password)

    if (success) {
      navigate('/dashboard')
    } else {
      setError('Usuário ou senha incorretos')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* Coluna Esquerda - Welcome Section */}
        <div className="login-welcome">
          <div className="login-welcome__content">
            <h1>Projeto Big Data</h1>
            <p>Organize seus certificados e eleve o desempenho da sua empresa com nosso sistema inteligente baseado em dados.</p>
            {/* <button
              type="button"
              className="login-welcome__button"
              onClick={() => {
                // Scroll para o formulário em mobile ou foco no primeiro input
                document.querySelector<HTMLInputElement>('#username')?.focus()
              }}
            >
              ENTRAR
            </button> */}
          </div>
        </div>

        {/* Coluna Direita - Login Form */}
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Fazer Login</h2>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="login-field">
              <div className="login-field__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                  <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuário"
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className="login-field">
              <div className="login-field__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 7.5V5C15 2.24 12.76 0 10 0C7.24 0 5 2.24 5 5V7.5C3.62 7.5 2.5 8.62 2.5 10V16.5C2.5 17.88 3.62 19 5 19H15C16.38 19 17.5 17.88 17.5 16.5V10C17.5 8.62 16.38 7.5 15 7.5ZM10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14ZM13 7.5H7V5C7 3.35 8.35 2 10 2C11.65 2 13 3.35 13 5V7.5Z" fill="currentColor"/>
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>

          <div className="login-footer">
            <p>Use: <strong>Empresa Teste</strong> / <strong>teste123</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

