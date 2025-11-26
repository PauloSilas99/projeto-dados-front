import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
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

type ChartVariant = 'column' | 'bar'

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

function ChartSection({ title, description, data, variant = 'column', height = 260, actionButton }: ChartSectionProps) {
  const layout = variant === 'bar' ? 'vertical' : 'horizontal'
  const barColor = variant === 'bar' ? 'var(--chart-secondary, #7c3aed)' : 'var(--chart-primary, #2563eb)'

  return (
    <section className={`chart-card ${variant === 'bar' ? 'chart-card--bar' : ''}`}>
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
  const navigate = useNavigate()
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  const [idBusca, setIdBusca] = useState('')
  const [bairroFiltro, setBairroFiltro] = useState('')
  const [cidadeFiltro, setCidadeFiltro] = useState('')
  const [minValorFiltro, setMinValorFiltro] = useState('')
  const [maxValorFiltro, setMaxValorFiltro] = useState('')
  const [certificadosLista, setCertificadosLista] = useState<any[]>([])
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
    const controller = new AbortController()
    setLoadingCertificado(true)
    setCertificadoError(null)

    const byId = idBusca.trim()

    const fetcher = byId
      ? fetchDashboardCertificadoById(byId, controller.signal)
      : Promise.reject(new Error('Informe o ID do certificado.'))

    fetcher
      .then((payload) => {
        setCertificadoData(payload)
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

  const handleBuscarLista = () => {
    const controller = new AbortController()
    setCertificadoError(null)
    listCertificates(
      {
        id: idBusca.trim() || undefined,
        bairro: bairroFiltro.trim() || undefined,
        cidade: cidadeFiltro.trim() || undefined,
        minValor: minValorFiltro ? Number(minValorFiltro) : undefined,
        maxValor: maxValorFiltro ? Number(maxValorFiltro) : undefined,
        limit: 100,
        offset: 0,
      },
      controller.signal,
    )
      .then((rows) => setCertificadosLista(rows))
      .catch((err: Error) => setCertificadoError(err.message || 'Falha ao listar certificados'))
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
        actionButton: {
          label: 'Ver no Mapa',
          onClick: () => navigate('/heatmap'),
        },
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
          <div>
            <Link to="/ia">
              <button className="actions__secondary" type="button">
                Ir para Recomendações de IA
              </button>
            </Link>
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
              actionButton={chart.actionButton}
            />
          ))}
      </section>

      <section className="analytics__certificado">
        <header className="certificado-header">
          <div>
            <h2>Investigar certificado específico</h2>
            <p>Busque por ID e aplique filtros por bairro, cidade e faixa de valor.</p>
          </div>
          
          <div className="certificado-search">
            <input
              type="text"
              value={idBusca}
              onChange={(event) => setIdBusca(event.target.value)}
              placeholder="ID do certificado (principal)"
            />
            <button type="button" onClick={handleBuscarCertificado} disabled={loadingCertificado}>
              {loadingCertificado ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="option-grid__item">
              <label className="option-group__label">Bairro</label>
              <input
                type="text"
                value={bairroFiltro}
                onChange={(e) => setBairroFiltro(e.target.value)}
                placeholder="Ex: Centro"
                className="option-group__input"
              />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Cidade</label>
              <input
                type="text"
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
                placeholder="Ex: Imperatriz-MA"
                className="option-group__input"
              />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Valor mínimo</label>
              <input
                type="number"
                step="0.01"
                value={minValorFiltro}
                onChange={(e) => setMinValorFiltro(e.target.value)}
                placeholder="Ex: 100"
                className="option-group__input"
              />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Valor máximo</label>
              <input
                type="number"
                step="0.01"
                value={maxValorFiltro}
                onChange={(e) => setMaxValorFiltro(e.target.value)}
                placeholder="Ex: 500"
                className="option-group__input"
              />
            </div>
          </div>
          
          <div className="actions">
            <button className="actions__secondary" type="button" onClick={handleBuscarLista}>
              Aplicar filtros na lista
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

            {certificadosLista.length > 0 && (
              <section className="analytics__grid">
                {certificadosLista.map((row) => (
                  <div key={String(row.certificado?.id || row.urls?.detalhes)} className="chart-card">
                    <header>
                      <h3>{String(row.certificado?.razao_social || 'Certificado')}</h3>
                      <p>ID: {String(row.certificado?.id || '')}</p>
                    </header>
                    <div>
                      <p>
                        Bairro: {String(row.certificado?.bairro || '-')}; Cidade: {String(row.certificado?.cidade || '-')}
                      </p>
                      <div className="download-links" style={{ marginTop: 6 }}>
                        {row.urls?.pdf && (
                          <a href={row.urls.pdf} className="download-link" download>
                            Baixar PDF
                          </a>
                        )}
                        {row.urls?.planilha && (
                          <a href={row.urls.planilha} className="download-link" download>
                            Baixar planilha
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
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
      </section>
    </div>
  )
}

export default PdfAnalyticsPage


