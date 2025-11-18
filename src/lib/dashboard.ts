const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000'

export type OverviewTotals = {
  certificados: number
  produtos: number
  metodos: number
}

export type ChartEntry = {
  [key: string]: string | number
  quantidade: number
}

export type OverviewResponse = {
  totals: OverviewTotals
  certificadosPorMes: Array<{ mes: string; quantidade: number }>
  certificadosPorCidade: Array<{ cidade: string; quantidade: number }>
  certificadosPorPraga: Array<{ praga: string; quantidade: number }>
  classesQuimicas: Array<{ classe: string; quantidade: number }>
  metodosAplicacao: Array<{ metodo: string; quantidade: number }>
  valorFinanceiro: {
    total: number
    media: number
  }
}

export type CertificadoAnalytics = {
  certificado: Record<string, unknown>
  produtos: Record<string, unknown>[]
  metodos: Record<string, unknown>[]
  distribuicaoProdutos: Array<{ classe: string; quantidade: number }>
  distribuicaoMetodos: Array<{ metodo: string; quantidade: number }>
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Erro ${response.status} ao consultar o dashboard`)
  }
  return response.json() as Promise<T>
}

export async function fetchDashboardOverview(signal?: AbortSignal): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE}/dashboard/overview`, { signal })
  return handleResponse<OverviewResponse>(response)
}

export async function fetchDashboardCertificado(
  numero: string,
  signal?: AbortSignal,
): Promise<CertificadoAnalytics> {
  const encoded = encodeURIComponent(numero.trim())
  const response = await fetch(`${API_BASE}/dashboard/certificado?numero=${encoded}`, { signal })
  return handleResponse<CertificadoAnalytics>(response)
}


