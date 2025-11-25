import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import '../App.css'
import { fetchDashboardOverview, type OverviewResponse } from '../lib/dashboard'
import { listCertificates } from '../lib/backend'
import { useToast } from '../contexts/ToastContext'

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
  const { addToast } = useToast()
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [recent, setRecent] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  // State for collapsible list visibility
  const [isListVisible, setIsListVisible] = useState(true)

  const actionCards = useMemo(
    () => [
      {
        title: 'Certificado Manual',
        description: 'Cadastre certificados preenchendo um formulário completo com todos os dados necessários.',
        route: '/formulario-manual',
        status: 'Disponível agora',
      },
      {
        title: 'Certificado Automático',
        description: 'Automatize a geração de certificados e relatórios com o fluxo já disponível.',
        route: '/excel-pdf',
        status: 'Disponível agora',
      },
      {
        title: 'Dados Estatísticos',
        description: 'Explore os PDFs produzidos em gráficos e indicadores.',
        route: '/dados-pdfs',
        status: 'Protótipo em desenvolvimento',
      },
      // {
      //   title: 'Administração',
      //   description: 'Acesse a central de ferramentas administrativas.',
      //   route: '/admin',
      //   status: 'Ferramentas administrativas',
      // },
      {
        title: 'Mapa de Calor',
        description: 'Visualize a distribuição geográfica dos certificados por cidade.',
        route: '/heatmap',
        status: 'Disponível agora',
      }
    ],
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    setLoadingOverview(true)
    fetchDashboardOverview(controller.signal)
      .then(setOverview)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          addToast(e.message, 'error')
        }
      })
      .finally(() => setLoadingOverview(false))

    // Fetch only 5 items as requested
    listCertificates({ limit: 5, offset: 0 }, controller.signal)
      .then(setRecent)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          addToast(e.message, 'error')
        }
      })
      .finally(() => setLoadingRecent(false))
    return () => controller.abort()
  }, [addToast])

  return (
    <div className="dashboard">
      <AppHeader companyName={company.name} showWelcome />

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

      <section className="analytics__totals">
        {loadingOverview && <span>Carregando totais...</span>}
        {!loadingOverview && overview && (
          <>
            <article>
              <h4>Certificados</h4>
              <strong>{overview.totals.certificados}</strong>
            </article>
            <article>
              <h4>Produtos</h4>
              <strong>{overview.totals.produtos}</strong>
            </article>
            <article>
              <h4>Métodos</h4>
              <strong>{overview.totals.metodos}</strong>
            </article>
          </>
        )}
      </section>

      <section className="analytics__grid">
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Últimos certificados</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Visualize rapidamente os registros mais recentes.</p>
            </div>
            {recent.length > 0 && (
              <button
                onClick={() => setIsListVisible(!isListVisible)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem'
                }}
              >
                {isListVisible ? (
                  <>Minimizar <span style={{ fontSize: '0.8rem' }}>▲</span></>
                ) : (
                  <>Ver últimos 5 <span style={{ fontSize: '0.8rem' }}>▼</span></>
                )}
              </button>
            )}
          </header>

          {isListVisible && (
            <>
              {loadingRecent && <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Carregando últimos certificados...</p>}
              {!loadingRecent && recent.length === 0 && <p className="chart-card__empty">Sem certificados cadastrados.</p>}
              {!loadingRecent && recent.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recent.map((row) => (
                    <li key={String(row.certificado?.id || row.urls?.detalhes)} style={{
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{String(row.certificado?.razao_social || 'Certificado sem nome')}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>ID: {String(row.certificado?.id || '?')}</span>
                          <span>{String(row.certificado?.cidade || 'Cidade não inf.')}</span>
                        </div>
                      </div>
                      <div className="download-links" style={{ margin: 0, gap: '0.5rem' }}>
                        {row.urls?.detalhes && (
                          <button
                            type="button"
                            onClick={() => navigate('/dados-pdfs')}
                            style={{
                              background: 'transparent',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            Ver dados
                          </button>
                        )}
                        {row.urls?.pdf && (
                          <a href={row.urls.pdf} className="download-link" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#15803d' }} download>
                            PDF
                          </a>
                        )}
                        {row.urls?.planilha && (
                          <a href={row.urls.planilha} className="download-link" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#2563eb' }} download>
                            Planilha
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  )
}

export default DashboardPage

