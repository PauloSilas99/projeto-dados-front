import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import '../App.css'

type AppHeaderProps = {
  companyName: string
  showWelcome?: boolean
}

export default function AppHeader({ companyName, showWelcome = false }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()
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
        <button
          type="button"
          className="app-header__theme-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
        >
          {theme === 'light' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3V1M10 19V17M17 10H19M1 10H3M15.657 15.657L16.97 16.97M3.03 3.03L4.343 4.343M15.657 4.343L16.97 3.03M3.03 16.97L4.343 15.657M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.293 13.293C16.3782 14.2078 15.278 14.8481 14.095 15.1629C12.912 15.4777 11.6842 15.4589 10.5161 15.1087C9.34805 14.7584 8.28124 14.0864 7.43257 13.1671C6.5839 12.2478 5.98559 11.1154 5.69588 9.89343C5.40618 8.67146 5.43414 7.40026 5.77747 6.19246C6.1208 4.98466 6.76818 3.88279 7.66039 2.99988C8.5526 2.11698 9.66003 1.48528 10.8712 1.16773C12.0823 0.850189 13.355 0.857891 14.562 1.18988C15.769 1.52186 16.869 2.16891 17.773 3.06388C18.677 3.95885 19.354 5.07034 19.738 6.28988C19.904 6.90688 19.999 7.54588 20 8.18988C20 8.83388 19.905 9.47288 19.738 10.0899C19.571 10.7069 19.333 11.3019 19.031 11.8619C18.729 12.4219 18.365 12.9419 17.949 13.4099L17.293 13.293Z"
              />
            </svg>
          )}
        </button>
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

