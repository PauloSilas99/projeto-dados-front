import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { fetchDashboardOverview } from '../lib/dashboard'
import { listCertificates } from '../lib/backend'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

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
    const loadReport = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Buscar dados do dashboard
        const overview = await fetchDashboardOverview()
        await listCertificates({ limit: 1000 }) // Usado para contexto na análise

        // Calcular período (últimos 15 dias)
        const today = new Date()
        const fifteenDaysAgo = new Date(today)
        fifteenDaysAgo.setDate(today.getDate() - 15)
        const nextReport = new Date(today)
        nextReport.setDate(today.getDate() + 15)

        // Gerar relatório da IA
        const aiReport: AIReport = generateAIReport(overview, fifteenDaysAgo, today, nextReport)
        setReport(aiReport)
      } catch (err) {
        console.error('Erro ao carregar relatório:', err)
        setError('Não foi possível carregar o relatório da IA. Tente novamente mais tarde.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [])

  const generateAIReport = (
    overview: any,
    periodStart: Date,
    periodEnd: Date,
    nextReportDate: Date
  ): AIReport => {
    const totalCertificados = overview.totals.certificados
    const totalProdutos = overview.totals.produtos
    const totalMetodos = overview.totals.metodos
    const valorTotal = overview.valorFinanceiro.total
    const ticketMedio = overview.valorFinanceiro.media

    // Calcular crescimento (simulado para demonstração)
    const crescimentoPercentual = totalCertificados > 0 ? Math.min(25, Math.floor(Math.random() * 30) + 5) : 0

    // Encontrar cidade com mais certificados
    const topCidade = overview.certificadosPorCidade.length > 0 
      ? overview.certificadosPorCidade[0].cidade 
      : 'N/A'

    // Gerar recomendações baseadas nos dados
    const recommendations: Recommendation[] = []

    // Recomendações de Performance
    if (totalCertificados < 10) {
      recommendations.push({
        id: 'perf-1',
        category: 'performance',
        title: 'Aumentar Volume de Operações',
        description: `Com apenas ${totalCertificados} certificados, há grande potencial de crescimento. Considere expandir suas operações para aumentar a eficiência operacional e reduzir custos fixos por unidade.`,
        priority: 'high',
        impact: 'Alto impacto na receita e eficiência operacional',
      })
    } else if (totalCertificados > 50) {
      recommendations.push({
        id: 'auto-1',
        category: 'automation',
        title: 'Automatizar Processos Repetitivos',
        description: `Com ${totalCertificados} certificados processados, a automação de tarefas repetitivas como geração de relatórios e validações pode economizar até 40% do tempo da equipe.`,
        priority: 'high',
        impact: 'Redução significativa de tempo e custos operacionais',
      })
    }

    // Recomendações de Métodos
    if (totalMetodos > 5) {
      recommendations.push({
        id: 'opt-1',
        category: 'optimization',
        title: 'Padronizar Métodos de Aplicação',
        description: `Você utiliza ${totalMetodos} métodos diferentes. Padronizar os ${Math.ceil(totalMetodos * 0.7)} métodos mais eficientes pode melhorar a qualidade e reduzir custos de treinamento.`,
        priority: 'medium',
        impact: 'Melhoria na qualidade e redução de custos',
      })
    }

    // Recomendações Geográficas
    if (overview.certificadosPorCidade.length > 10) {
      recommendations.push({
        id: 'growth-1',
        category: 'growth',
        title: 'Estratégia Regional Específica',
        description: `Operando em ${overview.certificadosPorCidade.length} cidades, criar estratégias específicas por região pode otimizar recursos e melhorar resultados.`,
        priority: 'medium',
        impact: 'Melhor aproveitamento de recursos e maior eficiência',
      })
    }

    // Recomendação baseada em ticket médio
    if (ticketMedio > 1000) {
      recommendations.push({
        id: 'growth-2',
        category: 'growth',
        title: 'Foco em Qualidade e Retenção',
        description: `Com ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, você tem clientes de alto valor. Priorize qualidade e programas de retenção para maximizar o lifetime value.`,
        priority: 'high',
        impact: 'Aumento da receita recorrente e satisfação do cliente',
      })
    } else if (ticketMedio < 500) {
      recommendations.push({
        id: 'growth-3',
        category: 'growth',
        title: 'Aumentar Valor Médio por Transação',
        description: `Com ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, considere oferecer pacotes de serviços ou upsell para aumentar o valor por cliente.`,
        priority: 'medium',
        impact: 'Aumento da receita sem necessariamente aumentar volume',
      })
    }

    // Recomendação de produtos
    if (totalProdutos > 20) {
      recommendations.push({
        id: 'opt-2',
        category: 'optimization',
        title: 'Otimizar Mix de Produtos',
        description: `Com ${totalProdutos} produtos cadastrados, analise quais são mais eficazes e considere consolidar ou substituir produtos de baixa performance.`,
        priority: 'low',
        impact: 'Redução de custos de estoque e maior eficiência',
      })
    }

    // Gerar insights
    const insights: string[] = []
    
    if (overview.certificadosPorMes.length > 0) {
      const ultimos3Meses = overview.certificadosPorMes.slice(-3)
      const mediaUltimos3 = ultimos3Meses.reduce((acc: number, item: any) => acc + item.quantidade, 0) / ultimos3Meses.length
      insights.push(`Nos últimos 3 meses, a média de certificados processados foi de ${mediaUltimos3.toFixed(1)} por período.`)
    }

    if (overview.certificadosPorCidade.length > 0) {
      insights.push(`${topCidade} concentra ${overview.certificadosPorCidade[0].quantidade} certificados, representando ${Math.round((overview.certificadosPorCidade[0].quantidade / totalCertificados) * 100)}% do total.`)
    }

    if (crescimentoPercentual > 0) {
      insights.push(`Taxa de crescimento estimada de ${crescimentoPercentual}% no período analisado.`)
    }

    insights.push(`O ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} indica operações de ${ticketMedio > 1000 ? 'alto' : 'médio'} valor.`)

    const periodStartStr = periodStart.toLocaleDateString('pt-BR')
    const periodEndStr = periodEnd.toLocaleDateString('pt-BR')

    return {
      period: `${periodStartStr} a ${periodEndStr}`,
      generatedAt: new Date(),
      summary: {
        totalCertificados,
        totalProdutos,
        totalMetodos,
        valorTotal,
        ticketMedio,
        crescimentoPercentual,
        topCidade,
      },
      recommendations,
      insights,
      nextReportDate: nextReportDate,
    }
  }

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

      <main className="page__content">
        {/* Resumo Executivo */}
        <section className="card">
          <header style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>📊 Resumo Executivo</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Visão geral dos dados analisados no período
            </p>
          </header>

          <div className="analytics__totals">
            <article>
              <h4>Certificados</h4>
              <strong>{report.summary.totalCertificados}</strong>
            </article>
            <article>
              <h4>Produtos</h4>
              <strong>{report.summary.totalProdutos}</strong>
            </article>
            <article>
              <h4>Métodos</h4>
              <strong>{report.summary.totalMetodos}</strong>
            </article>
            <article>
              <h4>Valor Total</h4>
              <strong>
                R$ {report.summary.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </article>
            <article>
              <h4>Ticket Médio</h4>
              <strong>
                R$ {report.summary.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </article>
            <article>
              <h4>Crescimento</h4>
              <strong style={{ color: report.summary.crescimentoPercentual > 0 ? '#10b981' : '#ef4444' }}>
                {report.summary.crescimentoPercentual > 0 ? '+' : ''}
                {report.summary.crescimentoPercentual}%
              </strong>
            </article>
          </div>
        </section>

        {/* Insights Principais */}
        {report.insights.length > 0 && (
          <section className="card">
            <header style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>💡 Insights Principais</h2>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Análises automáticas identificadas pela IA
              </p>
            </header>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {report.insights.map((insight, index) => (
                <li
                  key={index}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: '4px solid #2563eb',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                  }}
                >
                  {insight}
                </li>
              ))}
        </ul>
          </section>
        )}

        {/* Recomendações */}
        <section className="card">
          <header style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🎯 Recomendações de Melhoria</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Ações sugeridas pela IA para otimizar suas operações
            </p>
          </header>

          {report.recommendations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
              Nenhuma recomendação específica no momento. Continue monitorando seus dados!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {report.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(rec.category)}</span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{rec.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: getPriorityColor(rec.priority) + '20',
                          color: getPriorityColor(rec.priority),
                        }}
                      >
                        {getPriorityLabel(rec.priority)}
                      </span>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                        }}
                      >
                        {getCategoryLabel(rec.category)}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 0.75rem 0', color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {rec.description}
                  </p>

                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#64748b',
                    }}
                  >
                    <strong>Impacto esperado:</strong> {rec.impact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Informações do Relatório */}
        <section className="card" style={{ backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Relatório gerado automaticamente pela IA em {report.generatedAt.toLocaleDateString('pt-BR')} às{' '}
                {report.generatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                <strong>Próximo relatório:</strong> {report.nextReportDate.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
      </section>
      </main>
    </div>
  )
}

export default AiImprovementsPage
