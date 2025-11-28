import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { fetchDashboardOverview } from '../lib/dashboard'
import { listCertificates } from '../lib/backend'
import { generateAIReportWithGemini } from '../lib/gemini'
import '../App.css'

const COMPANY_NAME = 'SERVE IMUNI'

type Recommendation = {
  id: string
  category: 'performance' | 'automation' | 'growth' | 'optimization'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

type AIReport = {
  period: string
  generatedAt: Date
  summary: {
    totalCertificados: number
    totalProdutos: number
    totalMetodos: number
    valorTotal: number
    ticketMedio: number
    crescimentoPercentual: number
    topCidade: string
  }
  recommendations: Recommendation[]
  insights: string[]
  nextReportDate: Date
}

function AiImprovementsPage() {
  const navigate = useNavigate()
  const [report, setReport] = useState<AIReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const loadReport = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Buscar dados do dashboard
        const overview = await fetchDashboardOverview(controller.signal)
        await listCertificates({ limit: 1000 }, controller.signal) // Usado para contexto na análise

        if (!isMounted) return

        // Calcular período (últimos 15 dias)
        const today = new Date()
        const fifteenDaysAgo = new Date(today)
        fifteenDaysAgo.setDate(today.getDate() - 15)
        const nextReport = new Date(today)
        nextReport.setDate(today.getDate() + 15)

        // Gerar relatório da IA usando Gemini
        const geminiResponse = await generateAIReportWithGemini(
          overview,
          fifteenDaysAgo,
          today,
          controller.signal
        )

        if (!isMounted) return

        // Converter resposta do Gemini para o formato AIReport
        const aiReport: AIReport = {
          period: geminiResponse.period,
          generatedAt: new Date(),
          summary: geminiResponse.summary,
          recommendations: geminiResponse.recommendations,
          insights: geminiResponse.insights,
          nextReportDate: nextReport,
        }

        setReport(aiReport)
      } catch (err) {
        if (!isMounted) return
        
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        
        console.error('Erro ao carregar relatório:', err)
        setError(
          err instanceof Error
            ? `Não foi possível carregar o relatório da IA: ${err.message}`
            : 'Não foi possível carregar o relatório da IA. Tente novamente mais tarde.'
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadReport()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      case 'low':
        return 'Baixa'
      default:
        return priority
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return '⚡'
      case 'automation':
        return '🤖'
      case 'growth':
        return '📈'
      case 'optimization':
        return '🎯'
      default:
        return '💡'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'performance':
        return 'Performance'
      case 'automation':
        return 'Automação'
      case 'growth':
        return 'Crescimento'
      case 'optimization':
        return 'Otimização'
      default:
        return category
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <AppHeader companyName={COMPANY_NAME} />
        <header className="page__header">
          <div>
            <h1>Recomendações de IA</h1>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dados-pdfs')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Voltar para Dados Estatísticos
            </button>
          </div>
        </header>
        <main className="page__content">
          <div className="card">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem',
                }}
              />
              <p style={{ color: '#64748b', fontSize: '1rem' }}>Gerando relatório de IA...</p>
            </div>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <AppHeader companyName={COMPANY_NAME} />
        <header className="page__header">
          <div>
            <h1>Recomendações de IA</h1>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dados-pdfs')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Voltar para Dados Estatísticos
            </button>
          </div>
        </header>
        <main className="page__content">
          <div className="card">
            <div className="feedback feedback--error" style={{ textAlign: 'center' }}>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!report) {
    return null
  }

  return (
    <div className="page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="page__header">
        <div>
          <h1>Recomendações de IA</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Relatório gerado automaticamente • Período: {report.period} • Próximo relatório: {report.nextReportDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/dados-pdfs')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Voltar para Dados Estatísticos
          </button>
        </div>
      </header>

      <main className="page__content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Resumo Executivo */}
        <section 
          className="card" 
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <header style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
              📊 Resumo Executivo
            </h2>
            <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '1rem' }}>
              Visão geral dos dados analisados no período
            </p>
          </header>

          <div 
            className="analytics__totals" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificados</h4>
              <strong style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{report.summary.totalCertificados}</strong>
            </article>
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produtos</h4>
              <strong style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{report.summary.totalProdutos}</strong>
            </article>
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Métodos</h4>
              <strong style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{report.summary.totalMetodos}</strong>
            </article>
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Total</h4>
              <strong style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                R$ {report.summary.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </article>
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Médio</h4>
              <strong style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                R$ {report.summary.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </article>
            <article style={{ 
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crescimento</h4>
              <strong style={{ 
                fontSize: '1.75rem', 
                fontWeight: 700, 
                color: report.summary.crescimentoPercentual > 0 ? '#10b981' : '#ef4444',
                display: 'block',
              }}>
                {report.summary.crescimentoPercentual > 0 ? '+' : ''}
                {report.summary.crescimentoPercentual}%
              </strong>
            </article>
          </div>
        </section>

        {/* Insights Principais */}
        {report.insights.length > 0 && (
          <section 
            className="card"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              border: '2px solid #bfdbfe',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
          >
            <header style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #bfdbfe' }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
                💡 Insights Principais
              </h2>
              <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '1rem' }}>
                Análises automáticas identificadas pela IA
              </p>
            </header>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {report.insights.map((insight, index) => (
                <li
                  key={index}
                  style={{
                    padding: '1.5rem 1.75rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderLeft: '5px solid #2563eb',
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    lineHeight: '1.7',
                    color: '#1e293b',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.08)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.15)'
                    e.currentTarget.style.borderLeftWidth = '6px'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.08)'
                    e.currentTarget.style.borderLeftWidth = '5px'
                  }}
                >
                  <span style={{ 
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginRight: '0.75rem',
                    verticalAlign: 'middle',
                  }}>
                    {index + 1}
                  </span>
                  {insight}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recomendações */}
        <section 
          className="card"
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
            border: '2px solid #fcd34d',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <header style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #fcd34d' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
              🎯 Recomendações de Melhoria
            </h2>
            <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '1rem' }}>
              Ações sugeridas pela IA para otimizar suas operações
            </p>
          </header>

          {report.recommendations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #e2e8f0',
            }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                Nenhuma recomendação específica no momento. Continue monitorando seus dados!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {report.recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '2rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: `2px solid ${getPriorityColor(rec.priority)}40`,
                    borderLeft: `6px solid ${getPriorityColor(rec.priority)}`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 16px ${getPriorityColor(rec.priority)}30`
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderLeftWidth = '8px'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderLeftWidth = '6px'
                  }}
                >
                  {/* Badge de número */}
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '1.5rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getPriorityColor(rec.priority)} 0%, ${getPriorityColor(rec.priority)}dd 100%)`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}>
                    {index + 1}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    paddingTop: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <span style={{ 
                        fontSize: '2rem',
                        display: 'inline-block',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}>
                        {getCategoryIcon(rec.category)}
                      </span>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.25rem', 
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: '1.4',
                      }}>
                        {rec.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          backgroundColor: getPriorityColor(rec.priority) + '20',
                          color: getPriorityColor(rec.priority),
                          border: `1px solid ${getPriorityColor(rec.priority)}40`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {getPriorityLabel(rec.priority)}
                      </span>
                      <span
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          border: '1px solid #c7d2fe',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {getCategoryLabel(rec.category)}
                      </span>
                    </div>
                  </div>

                  <p style={{ 
                    margin: '0 0 1.25rem 0', 
                    color: '#475569', 
                    lineHeight: '1.8', 
                    fontSize: '1.05rem',
                    paddingLeft: '2.75rem',
                  }}>
                    {rec.description}
                  </p>

                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      marginLeft: '2.75rem',
                    }}
                  >
                    <strong style={{ 
                      color: '#0f172a',
                      display: 'block',
                      marginBottom: '0.25rem',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Impacto Esperado:
                    </strong>
                    <span style={{ color: '#64748b' }}>{rec.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Informações do Relatório */}
        <section 
          className="card" 
          style={{ 
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1.5rem',
            padding: '1rem 0',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Gerado em:</span>{' '}
                {report.generatedAt.toLocaleDateString('pt-BR')} às{' '}
                {report.generatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div style={{ 
              padding: '0.75rem 1.25rem',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                <strong style={{ color: '#0f172a' }}>Próximo relatório:</strong>{' '}
                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                  {report.nextReportDate.toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AiImprovementsPage
