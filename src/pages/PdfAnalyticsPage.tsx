import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LabelFormatter } from 'recharts/types/component/Label'
import {
  fetchDashboardCertificado,
  fetchDashboardOverview,
  type CertificadoAnalytics,
  type OverviewResponse,
} from '../lib/dashboard'
import '../App.css'

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

type ChartVariant = 'column' | 'bar'

type ChartSectionProps = {
  title: string
  description?: string
  data: Array<{ label: string; value: number }>
  variant?: ChartVariant
  height?: number
}

function ChartSection({ title, description, data, variant = 'column', height = 260 }: ChartSectionProps) {
  const layout = variant === 'bar' ? 'vertical' : 'horizontal'
  const barColor = variant === 'bar' ? 'var(--chart-secondary, #7c3aed)' : 'var(--chart-primary, #2563eb)'

  return (
    <section className={`chart-card ${variant === 'bar' ? 'chart-card--bar' : ''}`}>
      <header>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </header>

      {data.length === 0 ? (
        <p className="chart-card__empty">Sem dados suficientes até o momento.</p>
      ) : (
        <div className="chart-card__chart" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={layout}
              margin={{ top: 8, right: 8, bottom: 8, left: layout === 'vertical' ? 12 : 0 }}
              barCategoryGap={variant === 'column' ? 12 : 18}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={variant === 'column'} horizontal={variant === 'bar'} />
              {variant === 'column' ? (
                <>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={130}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                </>
              )}
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
                labelFormatter={(label: string) => label}
                cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: 'var(--chart-tooltip-bg, rgba(15, 23, 42, 0.92))',
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="value"
                fill={barColor}
                radius={
                  variant === 'column'
                    ? [8, 8, 0, 0]
                    : [0, 8, 8, 0]
                }
                maxBarSize={variant === 'column' ? 48 : 32}
              >
                <LabelList
                  dataKey="value"
                  position={variant === 'column' ? 'top' : 'right'}
                  formatter={labelValueFormatter}
                  fill="#0f172a"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function PdfAnalyticsPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  const [numeroBusca, setNumeroBusca] = useState('')
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

  const handleBuscarCertificado = () => {
    if (!numeroBusca.trim()) {
      setCertificadoError('Informe o número do certificado para consultar.')
      setCertificadoData(null)
      return
    }

    const controller = new AbortController()
    setLoadingCertificado(true)
    setCertificadoError(null)
    fetchDashboardCertificado(numeroBusca, controller.signal)
      .then((payload) => {
        setCertificadoData(payload)
      })
      .catch((error: Error) => {
        if (isAbortError(error)) {
          return
        }
        setCertificadoError(error.message || 'Não foi possível carregar o certificado.')
        setCertificadoData(null)
      })
      .finally(() => setLoadingCertificado(false))
  }

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
        title: 'Certificados por mês',
        description: 'Volume consolidado para os últimos períodos.',
        data: overview.certificadosPorMes.map((item) => ({
          label: item.mes,
          value: item.quantidade,
        })),
        variant: 'column' as ChartVariant,
        height: 280,
      },
      {
        title: 'Distribuição por cidade',
        description: 'Mostra onde suas operações estão concentradas.',
        data: overview.certificadosPorCidade.map((item) => ({
          label: item.cidade,
          value: item.quantidade,
        })),
        variant: 'bar' as ChartVariant,
        height: 320,
      },
      {
        title: 'Pragas mais tratadas',
        description: 'Identifique demandas recorrentes.',
        data: overview.certificadosPorPraga.map((item) => ({
          label: item.praga,
          value: item.quantidade,
        })),
        variant: 'bar' as ChartVariant,
        height: 320,
      },
      {
        title: 'Classes químicas',
        description: 'Entenda a variedade de produtos utilizados.',
        data: overview.classesQuimicas.map((item) => ({
          label: item.classe,
          value: item.quantidade,
        })),
        variant: 'column' as ChartVariant,
      },
      {
        title: 'Métodos de aplicação',
        description: 'Veja como os times executam as atividades.',
        data: overview.metodosAplicacao.map((item) => ({
          label: item.metodo,
          value: item.quantidade,
        })),
        variant: 'column' as ChartVariant,
      },
    ]
  }, [overview])

  return (
    <div className="analytics-page">
      <header className="analytics__header">
        <div>
          <p className="subpage-nav">
            <Link to="/">← Voltar para o dashboard</Link>
          </p>
          <h1>Dados consolidados dos PDFs</h1>
          <p>
            Consulte o panorama geral dos certificados emitidos e investigue indicadores específicos puxando um número de
            certificado.
          </p>
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

      {resumoFinanceiro && (
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
            />
          ))}
      </section>

      <section className="analytics__certificado">
        <header>
          <div>
            <h2>Investigar certificado específico</h2>
            <p>Use o número completo do certificado para gerar gráficos personalizados.</p>
          </div>
          <div className="certificado-search">
            <input
              type="text"
              value={numeroBusca}
              onChange={(event) => setNumeroBusca(event.target.value)}
              placeholder="Ex: SCS-2024/0001"
            />
            <button type="button" onClick={handleBuscarCertificado} disabled={loadingCertificado}>
              {loadingCertificado ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </header>

        {certificadoError && <p className="feedback feedback--error">{certificadoError}</p>}

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
      </section>
    </div>
  )
}

export default PdfAnalyticsPage


