import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { useTheme } from '../contexts/ThemeContext'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LabelFormatter } from 'recharts/types/component/Label'
import {
  fetchDashboardCertificadoById,
  fetchDashboardOverview,
  type CertificadoAnalytics,
  type OverviewResponse,
} from '../lib/dashboard'
import { listCertificates } from '../lib/backend'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

const isAbortError = (error: unknown): error is DOMException =>
  error instanceof DOMException && error.name === 'AbortError'

const labelValueFormatter: LabelFormatter = (label) => {
  if (typeof label === 'number') {
    return label.toLocaleString('pt-BR')
  }
  if (typeof label === 'string') {
    return label
  }
  return ''
}

type ChartVariant = 'column' | 'bar' | 'pie' | 'donut' | 'area'

type ChartSectionProps = {
  title: string
  description?: string
  data: Array<{ label: string; value: number }>
  variant?: ChartVariant
  height?: number
  actionButton?: {
    label: string
    onClick: () => void
  }
}

/**
 * Paleta de cores harmoniosa baseada na Lei da Similaridade de Gestalt
 * Cores agrupadas por temperatura (frias → quentes) para facilitar distinção
 */
const CHART_COLORS = [
  '#2563eb', // Azul primário (frio)
  '#0891b2', // Ciano (frio)
  '#059669', // Verde (neutro)
  '#14b8a6', // Teal (neutro-frio)
  '#7c3aed', // Roxo (neutro)
  '#6366f1', // Índigo (frio)
  '#ea580c', // Laranja (quente)
  '#ca8a04', // Amarelo (quente)
  '#db2777', // Rosa (quente)
  '#dc2626', // Vermelho (quente - usado com moderação)
]

/**
 * Componente de gráfico seguindo as Leis de Gestalt:
 * - Proximidade: Elementos relacionados são agrupados visualmente
 * - Similaridade: Cores e formas consistentes para dados do mesmo tipo
 * - Continuidade: Gráficos de área/linha para dados temporais
 * - Fechamento: Donut com total central para percepção do todo
 */
function ChartSection({ title, description, data, variant = 'column', height = 260, actionButton }: ChartSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // Ordenar dados para barras horizontais (Lei da Similaridade - ranking visual)
  const sortedData = variant === 'bar' 
    ? [...data].sort((a, b) => b.value - a.value)
    : data

  // Calcular total para donut (Lei do Fechamento)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Cores adaptativas para tema claro/escuro
  const textColor = isDark ? '#e5e7eb' : '#0f172a'
  const subTextColor = isDark ? '#9ca3af' : '#64748b'
  const areaColor = isDark ? '#3b82f6' : '#2563eb'

  const getChartClass = () => {
    if (variant === 'bar') return 'chart-card chart-card--bar'
    if (variant === 'pie' || variant === 'donut') return 'chart-card chart-card--pie'
    if (variant === 'area') return 'chart-card chart-card--area'
    return 'chart-card'
  }

  return (
    <section className={getChartClass()}>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          {actionButton && (
            <button
              type="button"
              onClick={actionButton.onClick}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
            >
              {actionButton.label}
            </button>
          )}
        </div>
      </header>

      {data.length === 0 ? (
        <p className="chart-card__empty">Sem dados suficientes até o momento.</p>
      ) : variant === 'area' ? (
        /* Lei da Continuidade: Gráfico de área para dados temporais/sequenciais */
        <div className="chart-card__chart" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={isDark ? 0.5 : 0.4} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d2d2d' : '#e2e8f0'} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: subTextColor }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#2d2d2d' : '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: subTextColor }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={areaColor}
                strokeWidth={3}
                fill="url(#areaGradient)"
                dot={{ fill: areaColor, strokeWidth: 2, r: 4, stroke: isDark ? '#111' : '#fff' }}
                activeDot={{ r: 6, stroke: isDark ? '#111' : '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : variant === 'donut' ? (
        /* Lei do Fechamento: Donut com total central para percepção do todo */
        <div className="chart-card__chart" style={{ height, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((item) => ({ name: item.label, value: item.value }))}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => (percent && percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : '')}
                outerRadius={Math.min(100, height ? height * 0.30 : 100)}
                innerRadius={Math.min(60, height ? height * 0.18 : 60)}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={4}
                stroke={isDark ? '#111111' : '#ffffff'}
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label || ''}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={50}
                formatter={(value) => value || ''}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{
                  fontSize: '0.8rem',
                  color: subTextColor,
                  paddingTop: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centro do donut com total (Lei do Fechamento) */}
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: textColor }}>
              {total.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '2px' }}>
              Total
            </div>
          </div>
        </div>
      ) : variant === 'pie' ? (
        /* Gráfico de pizza tradicional para proporções simples */
        <div className="chart-card__chart" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((item) => ({ name: item.label, value: item.value }))}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => (percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')}
                outerRadius={Math.min(100, height ? height * 0.30 : 100)}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                stroke={isDark ? '#111111' : '#ffffff'}
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label || ''}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={50}
                formatter={(value) => value || ''}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{
                  fontSize: '0.8rem',
                  color: subTextColor,
                  paddingTop: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : variant === 'bar' ? (
        /* Lei da Similaridade: Barras horizontais ordenadas para rankings */
        <div className="chart-card__chart" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 8, right: 40, bottom: 8, left: 8 }}
              barCategoryGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#2d2d2d' : '#e2e8f0'} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: subTextColor }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#2d2d2d' : '#e2e8f0' }}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: isDark ? '#d1d5db' : '#475569' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label}
                cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)' }}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
              <Bar
                dataKey="value"
                fill="#7c3aed"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              >
                {sortedData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    opacity={1 - (index * 0.06)} /* Gradiente visual para ranking */
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={labelValueFormatter}
                  fill={isDark ? '#d1d5db' : '#475569'}
                  fontSize={11}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Gráfico de colunas para comparações categóricas */
        <div className="chart-card__chart" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 16, right: 8, bottom: 8, left: 0 }}
              barCategoryGap={16}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d2d2d' : '#e2e8f0'} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: subTextColor }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#2d2d2d' : '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: subTextColor }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label}
                cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)' }}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
              <Bar
                dataKey="value"
                fill={areaColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={labelValueFormatter}
                  fill={isDark ? '#d1d5db' : '#475569'}
                  fontSize={11}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

type ActiveTab = 'graficos' | 'investigacao' | 'mapa'

function PdfAnalyticsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ActiveTab>('graficos')
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  const [idBusca, setIdBusca] = useState('')
  const [certificadosDisponiveis, setCertificadosDisponiveis] = useState<any[]>([])
  const [loadingCertificadosLista, setLoadingCertificadosLista] = useState(false)
  const [certificadoData, setCertificadoData] = useState<CertificadoAnalytics | null>(null)
  const [certificadoError, setCertificadoError] = useState<string | null>(null)
  const [loadingCertificado, setLoadingCertificado] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    setLoadingOverview(true)
    setOverviewError(null)
    fetchDashboardOverview(controller.signal)
      .then((payload) => {
        if (!isMounted) {
          return
        }
        setOverview(payload)
      })
      .catch((error: Error) => {
        if (!isMounted || isAbortError(error)) {
          return
        }
        setOverviewError(error.message || 'Não foi possível carregar o overview.')
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setLoadingOverview(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const handleBuscarCertificado = (certificadoId?: string) => {
    const controller = new AbortController()
    setLoadingCertificado(true)
    setCertificadoError(null)

    const byId = (certificadoId || idBusca).trim()

    const fetcher = byId
      ? fetchDashboardCertificadoById(byId, controller.signal)
      : Promise.reject(new Error('Informe o ID do certificado.'))

    fetcher
      .then((payload) => {
        setCertificadoData(payload)
        // Atualizar o campo de busca se foi passado um ID
        if (certificadoId) {
          setIdBusca(certificadoId)
        }
      })
      .catch((error: Error) => {
        const anyErr = error as any
        if (anyErr?.isConflict && Array.isArray(anyErr.candidatos) && anyErr.candidatos.length > 0) {
          setCertificadoError(
            'Há mais de um certificado com este número. Selecione pelo ID na lista abaixo.',
          )
          setCertificadoData({
            certificado: { aviso: 'Selecione um ID abaixo para carregar os gráficos.' },
            produtos: [],
            metodos: [],
            distribuicaoProdutos: [],
            distribuicaoMetodos: [],
          })
            ; (window as any).__certificadoCandidatos = anyErr.candidatos
          return
        }
        if (isAbortError(error)) {
          return
        }
        setCertificadoError(error.message || 'Não foi possível carregar o certificado.')
        setCertificadoData(null)
      })
      .finally(() => setLoadingCertificado(false))
  }

  const handleSelecionarCertificado = (certificadoId: string) => {
    handleBuscarCertificado(certificadoId)
  }

  // Carregar lista de certificados quando a aba de investigação for aberta
  useEffect(() => {
    if (activeTab !== 'investigacao') {
      return
    }

    const controller = new AbortController()
    let isMounted = true

    setLoadingCertificadosLista(true)
    setCertificadoError(null)

    listCertificates(
      {
        limit: 100,
        offset: 0,
      },
      controller.signal,
    )
      .then((rows) => {
        if (!isMounted) {
          return
        }
        // Garantir que temos um array válido
        if (Array.isArray(rows) && rows.length > 0) {
          setCertificadosDisponiveis(rows)
        } else {
          setCertificadosDisponiveis([])
        }
      })
      .catch((err: Error) => {
        if (!isMounted || isAbortError(err)) {
          return
        }
        console.error('Erro ao carregar certificados:', err)
        setCertificadoError(err.message || 'Falha ao carregar lista de certificados')
        setCertificadosDisponiveis([])
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setLoadingCertificadosLista(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [activeTab])

  const resumoFinanceiro = useMemo(() => {
    if (!overview) {
      return null
    }
    return [
      { label: 'Total movimentado', value: overview.valorFinanceiro.total },
      { label: 'Ticket médio', value: overview.valorFinanceiro.media },
    ]
  }, [overview])

  const overviewCharts = useMemo(() => {
    if (!overview) {
      return []
    }

    return [
      {
        // Lei da Continuidade: Área para dados temporais sequenciais
        title: 'Evolução mensal de certificados',
        description: 'Tendência e progressão ao longo do tempo.',
        data: overview.certificadosPorMes.map((item) => ({
          label: item.mes,
          value: item.quantidade,
        })),
        variant: 'area' as ChartVariant,
        height: 280,
      },
      {
        // Lei da Similaridade: Barras ordenadas para ranking geográfico
        title: 'Distribuição por cidade',
        description: 'Ranking das cidades com mais operações.',
        data: overview.certificadosPorCidade.map((item) => ({
          label: item.cidade,
          value: item.quantidade,
        })),
        variant: 'bar' as ChartVariant,
        height: 320,
        actionButton: {
          label: 'Ver no Mapa',
          onClick: () => navigate('/heatmap'),
        },
      },
      {
        // Lei da Similaridade: Barras ordenadas para ranking de pragas
        title: 'Pragas mais tratadas',
        description: 'Ranking das demandas mais recorrentes.',
        data: overview.certificadosPorPraga.map((item) => ({
          label: item.praga,
          value: item.quantidade,
        })),
        variant: 'bar' as ChartVariant,
        height: 320,
      },
      {
        // Lei do Fechamento: Donut com total central para proporção do todo
        title: 'Classes químicas',
        description: 'Proporção dos produtos por categoria.',
        data: overview.classesQuimicas.map((item) => ({
          label: item.classe,
          value: item.quantidade,
        })),
        variant: 'donut' as ChartVariant,
        height: 340,
      },
      {
        // Lei da Proximidade: Barras horizontais para comparação de métodos
        title: 'Métodos de aplicação',
        description: 'Frequência de uso de cada técnica.',
        data: overview.metodosAplicacao.map((item) => ({
          label: item.metodo,
          value: item.quantidade,
        })),
        variant: 'bar' as ChartVariant,
        height: 280,
      },
    ]
  }, [overview, navigate])

  return (
    <div className="analytics-page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="analytics__header">
        <div className="analytics__header-content">
        <div>
            <h2>Dados Estatísticos</h2>
            <p>
              Consulte o panorama geral dos certificados emitidos e investigue indicadores específicos puxando um número de
              certificado.
            </p>
          </div>
          <div className="analytics__header-actions analytics__tabs">
            <button
              className={`analytics__tab ${activeTab === 'graficos' ? 'analytics__tab--active' : ''}`}
              type="button"
              onClick={() => setActiveTab('graficos')}
            >
              Gráficos
            </button>
            <button
              className={`analytics__tab ${activeTab === 'investigacao' ? 'analytics__tab--active' : ''}`}
              type="button"
              onClick={() => setActiveTab('investigacao')}
            >
              Investigação
            </button>
            {/* <button
              className={`analytics__tab ${activeTab === 'mapa' ? 'analytics__tab--active' : ''}`}
              type="button"
              onClick={() => setActiveTab('mapa')}
            >
              Mapa
            </button> */}
            <button
              className="analytics__tab"
              type="button"
              onClick={() => navigate('/ia')}
            >
              Recomendações de IA
            </button>
          </div>
        </div>
        <div className="analytics__totals">
          {loadingOverview && <span>Carregando totais...</span>}
          {!loadingOverview && overview && (
            <Fragment>
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
            </Fragment>
          )}
        </div>
      </header>

      {overviewError && <p className="feedback feedback--error">{overviewError}</p>}

      {resumoFinanceiro && activeTab === 'graficos' && (
        <section className="analytics__finance">
          {resumoFinanceiro.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>
                {item.value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 2,
                })}
              </strong>
            </article>
          ))}
        </section>
      )}

      {/* Seção de Gráficos */}
      {activeTab === 'graficos' && (
        <section className="analytics__grid">
          {loadingOverview &&
            !overview &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="chart-card chart-card--skeleton">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-bar" />
                <div className="skeleton-bar" />
              </div>
            ))}

          {!loadingOverview &&
            overviewCharts.map((chart) => (
              <ChartSection
                key={chart.title}
                title={chart.title}
                description={chart.description}
                data={chart.data}
                variant={chart.variant}
                height={chart.height}
                actionButton={chart.actionButton}
              />
            ))}
        </section>
      )}

      {/* Seção de Investigação */}
      {activeTab === 'investigacao' && (
        <section className="analytics__certificado">
          <div className="investigacao-container">
            <header className="investigacao-header">
              <div>
                <h2>Investigar Certificado</h2>
                <p>Selecione um certificado da lista abaixo ou busque manualmente por ID.</p>
              </div>
            </header>

            <div className="investigacao-search">
              <div className="investigacao-search-main">
                <div className="search-input-wrapper">
                  <label htmlFor="certificado-id">ID do Certificado</label>
                  <input
                    id="certificado-id"
                    type="text"
                    value={idBusca}
                    onChange={(event) => setIdBusca(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && idBusca.trim()) {
                        handleBuscarCertificado()
                      }
                    }}
                    placeholder="Digite o ID do certificado"
                    className="investigacao-input"
                  />
                </div>
                <button
                  type="button"
                  className="investigacao-btn-primary"
                  onClick={() => handleBuscarCertificado()}
                  disabled={loadingCertificado || !idBusca.trim()}
                >
                  {loadingCertificado ? (
                    <>
                      <span className="spinner"></span>
                      Buscando...
                    </>
                  ) : (
                    'Buscar Certificado'
                  )}
                </button>
              </div>
            </div>

            <div className="certificados-lista">
              <div className="certificados-lista-header">
                <h3>Certificados Disponíveis</h3>
                {loadingCertificadosLista && <span className="loading-text">Carregando...</span>}
              </div>
              
              {loadingCertificadosLista ? (
                <div className="certificados-lista-loading">
                  <p>Carregando lista de certificados...</p>
                </div>
              ) : certificadosDisponiveis.length === 0 ? (
                <div className="certificados-lista-empty">
                  <p>Nenhum certificado encontrado.</p>
                </div>
              ) : (
                <div className="certificados-lista-grid">
                  {certificadosDisponiveis.map((row, index) => {
                    // Garantir que temos um certificado válido
                    const certificado = row?.certificado || row || {}
                    
                    // Extrair ID - tentar múltiplas chaves possíveis
                    const certificadoId = String(
                      certificado.id || 
                      certificado.certificado_id || 
                      certificado.certificadoId ||
                      index
                    )
                    
                    // Extrair razão social - tentar múltiplas chaves possíveis
                    const razaoSocial = String(
                      certificado.razao_social || 
                      certificado.razaoSocial || 
                      certificado.nome ||
                      certificado.empresa ||
                      certificado.cliente ||
                      'Sem nome'
                    )
                    
                    // Extrair cidade
                    const cidade = String(
                      certificado.cidade || 
                      certificado.municipio ||
                      'Cidade não informada'
                    )
                    
                    // Extrair bairro
                    const bairro = String(
                      certificado.bairro || 
                      'Bairro não informado'
                    )
                    
                    // Extrair número do certificado se disponível
                    const numeroCertificado = certificado.numero || certificado.numero_certificado || certificado.numeroCertificado
                    
                    return (
                      <button
                        key={`${certificadoId}-${index}`}
                        type="button"
                        className={`certificado-item ${idBusca === certificadoId ? 'certificado-item--selected' : ''}`}
                        onClick={() => handleSelecionarCertificado(certificadoId)}
                      >
                        <div className="certificado-item-header">
                          <span className="certificado-item-id">ID: {certificadoId}</span>
                          {numeroCertificado && (
                            <span className="certificado-item-numero">Nº: {String(numeroCertificado)}</span>
                          )}
                        </div>
                        <div className="certificado-item-body">
                          <h4>{razaoSocial}</h4>
                          <p>{bairro}, {cidade}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {certificadoError && (
              <div className="investigacao-error">
                <p>{certificadoError}</p>
              </div>
            )}

            {certificadoData && (
            <div className="certificado-panels">
              <article className="certificado-details">
                <h3>Dados principais</h3>
                <dl>
                  {Object.entries(certificadoData.certificado).map(([key, value]) => (
                    <Fragment key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </Fragment>
                  ))}
                </dl>
              </article>

              {(window as any).__certificadoCandidatos && Array.isArray((window as any).__certificadoCandidatos) && (
                <article className="certificado-details">
                  <h3>Candidatos (IDs para seleção)</h3>
                  <ul>
                    {((window as any).__certificadoCandidatos as Array<any>).map((c: any) => (
                      <li key={String(c.id)}>
                        <button
                          type="button"
                          onClick={() => {
                            setIdBusca(String(c.id))
                              ; (window as any).__certificadoCandidatos = null
                            handleBuscarCertificado()
                          }}
                        >
                          ID: {String(c.id)} — Nº: {String(c.numero)} — CNPJ: {String(c.cnpj)} — Execução: {String(c.data_execucao)}
                        </button>
                      </li>
                    ))}
        </ul>
                </article>
              )}


              <ChartSection
                title="Produtos por classe química"
                variant="bar"
                height={320}
                data={certificadoData.distribuicaoProdutos.map((item) => ({
                  label: item.classe,
                  value: item.quantidade,
                }))}
              />

              <ChartSection
                title="Métodos utilizados"
                data={certificadoData.distribuicaoMetodos.map((item) => ({
                  label: item.metodo,
                  value: item.quantidade,
                }))}
              />
            </div>
            )}
          </div>
        </section>
      )}

      {/* Seção de Mapa */}
      {activeTab === 'mapa' && (
        <section className="analytics__mapa">
          <div className="chart-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Mapa de Calor - Distribuição Geográfica</h3>
            <p style={{ marginBottom: '2rem', color: '#64748b' }}>
              Visualize a distribuição geográfica dos certificados em um mapa interativo.
            </p>
            <button
              className="actions__primary"
              type="button"
              onClick={() => navigate('/heatmap')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Abrir Mapa Interativo
            </button>
          </div>
      </section>
      )}

    </div>
  )
}

export default PdfAnalyticsPage


