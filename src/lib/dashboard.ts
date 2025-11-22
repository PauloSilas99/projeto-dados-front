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

type ApiEnvelope<T> = { message: string; data: T; sucesso: boolean } | { message: string; erro?: any; sucesso: boolean }

async function readEnvelope<T>(response: Response): Promise<T> {
  const text = await response.text()
  let parsed: ApiEnvelope<T>
  try {
    parsed = JSON.parse(text) as ApiEnvelope<T>
  } catch {
    throw new Error(text || `Erro ${response.status} ao consultar o dashboard`)
  }
  if ((parsed as any)?.sucesso === true && (parsed as any)?.data !== undefined) {
    return (parsed as any).data as T
  }
  const msg = (parsed as any)?.message || `Erro ${response.status}`
  const detalhes = (parsed as any)?.erro?.detalhes
  throw new Error(detalhes ? `${msg} - ${typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes)}` : msg)
}

export async function fetchDashboardOverview(signal?: AbortSignal): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE}/dashboard/overview`, { signal })
  return readEnvelope<OverviewResponse>(response)
}

 

export async function fetchDashboardCertificadoById(
  id: string,
  signal?: AbortSignal,
): Promise<CertificadoAnalytics> {
  const encoded = encodeURIComponent(id.trim())
  const response = await fetch(`${API_BASE}/dashboard/certificado?id=${encoded}`, { signal })
  return readEnvelope<CertificadoAnalytics>(response)
}


