import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

type CompanyProfile = {
  name: string
  cnpj: string
  segment: string
  contactEmail: string
  lastSync: string
  operations: number
}

type DashboardProps = {
  company: CompanyProfile
}

function DashboardPage({ company }: DashboardProps) {
  const navigate = useNavigate()

  const actionCards = useMemo(
    () => [
      {
        title: 'Preencher formulário manual',
        description: 'Cadastre certificados preenchendo um formulário completo com todos os dados necessários.',
        route: '/formulario-manual',
        status: 'Disponível agora',
      },
      {
        title: 'Transformar Excel em PDF',
        description: 'Automatize a geração de certificados e relatórios com o fluxo já disponível.',
        route: '/excel-pdf',
        status: 'Disponível agora',
      },
      {
        title: 'Visualizar dados consolidados',
        description: 'Explore os PDFs produzidos em gráficos e indicadores.',
        route: '/dados-pdfs',
        status: 'Protótipo em desenvolvimento',
      }
      // {
      //   title: 'Melhorias com IA',
      //   description: 'Receba insights e recomendações automáticas para otimizar processos internos.',
      //   route: '/melhorias-ia',
      //   status: 'Em planejamento',
      // },
    ],
    [],
  )

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Bem-vindo(a) de volta</p>
          <h1>{company.name}</h1>
          <p>Centralize suas operações e avance para as próximas etapas de análise e automação.</p>
        </div>
        {/* <div className="dashboard__hero-badge">
          <span>Última sincronização</span>
          <strong>{company.lastSync}</strong>
        </div> */}
      </section>

      <section className="dashboard__company-card">
        <header>
          <div>
            <p className="dashboard__company-label">Empresa logada</p>
            <h2>{company.name}</h2>
          </div>
          <div className="dashboard__stats">
            <div>
              <span>Segmento</span>
              <strong>{company.segment}</strong>
            </div>
            <div>
              <span>Operações acompanhadas</span>
              <strong>{company.operations}</strong>
            </div>
          </div>
        </header>
        <ul className="dashboard__info-list">
          <li>
            <span>CNPJ</span>
            <strong>{company.cnpj}</strong>
          </li>
          <li>
            <span>Contato</span>
            <strong>{company.contactEmail}</strong>
          </li>
        </ul>
      </section>

      <section className="dashboard__actions">
        {actionCards.map((card) => (
          <button
            key={card.route}
            type="button"
            className="dashboard__action-card"
            onClick={() => navigate(card.route)}
          >
            <div>
              {/* <p className="dashboard__action-status">{card.status}</p> */}
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <span className="dashboard__action-cta">Acessar →</span>
          </button>
        ))}
      </section>
    </div>
  )
}

export default DashboardPage

