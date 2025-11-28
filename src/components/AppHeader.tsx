import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import '../App.css'

type AppHeaderProps = {
  companyName: string
  showWelcome?: boolean
}

export default function AppHeader({ companyName, showWelcome = false }: AppHeaderProps) {
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboard = location.pathname === '/dashboard'

  return (
    <section className="dashboard__hero">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {showWelcome && <p className="dashboard__eyebrow">Bem-vindo(a) de volta</p>}
          <h1>{companyName}</h1>
          {showWelcome && (
            <p>Centralize seus certificados e avance para as próximas etapas de análise e automação.</p>
          )}
        </div>
      </div>
      <div className="app-header__actions">
        {!isDashboard && (
          <Link to="/dashboard" className="app-header__home-btn" title="Voltar para o dashboard">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2L3 7V17H8V12H12V17H17V7L10 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Home</span>
          </Link>
        )}
        {/* Botão de tema removido temporariamente */}
        <button
          type="button"
          className="app-header__user-btn"
          onClick={() => navigate('/perfil')}
          title="Acessar perfil do usuário"
          aria-label="Acessar perfil do usuário"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
              fill="currentColor"
            />
            <path
              d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </section>
  )
}
