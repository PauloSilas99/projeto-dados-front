import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import '../App.css'

const COMPANY_NAME = 'ServeImuni'

function AdminHomePage() {
  const navigate = useNavigate()

  const tools = useMemo(
    () => [
      {
        title: 'Gerenciamento de Cache',
        description: 'Limpe caches do cliente e do servidor e consulte o status atual.',
        route: '/admin/cache',
        cta: 'Acessar →',
      },
      {
        title: 'Gerenciamento de PDFs',
        description: 'Visualize, baixe ou exclua todos os arquivos PDF gerados pelo sistema.',
        route: '/admin/pdfs',
        cta: 'Acessar →',
      },
    ],
    [],
  )

  return (
    <div className="analytics-page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="analytics__header">
        <div>
          <h1>Administração</h1>
          <p>Central de ferramentas administrativas do sistema.</p>
        </div>
      </header>

      <section className="analytics__grid">
        {tools.map((tool) => (
          <button
            key={tool.route}
            type="button"
            className="dashboard__action-card"
            onClick={() => navigate(tool.route)}
          >
            <div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
            <span className="dashboard__action-cta">{tool.cta}</span>
          </button>
        ))}
      </section>
    </div>
  )
}

export default AdminHomePage