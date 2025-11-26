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
  // Verificar se a resposta HTTP foi bem-sucedida
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    let errorMessage = `Erro ${response.status} ao consultar o dashboard`
    try {
      const parsed = JSON.parse(text)
      if (parsed?.message) {
        errorMessage = parsed.message
      } else if (parsed?.detail) {
        errorMessage = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail)
      }
    } catch {
      if (text) {
        errorMessage = text
      }
    }
    throw new Error(errorMessage)
  }

  const text = await response.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(text || 'Resposta inválida do servidor')
  }

  // Verificar se a resposta já está no formato direto (sem envelope)
  // Isso acontece quando o backend retorna os dados diretamente
  if (parsed && typeof parsed === 'object' && !('sucesso' in parsed) && !('message' in parsed)) {
    // Parece ser um formato direto, retornar como está
    return parsed as T
  }

  // Verificar se está no formato envelope com sucesso
  if ((parsed as any)?.sucesso === true && (parsed as any)?.data !== undefined) {
    return (parsed as any).data as T
  }

  // Se sucesso é false ou não há data, tratar como erro
  const msg = (parsed as any)?.message || 'Erro ao processar dados do servidor'
  const detalhes = (parsed as any)?.erro?.detalhes
  const erroMsg = (parsed as any)?.erro?.message
  
  // Construir mensagem de erro mais informativa
  let errorMessage = msg
  if (erroMsg && erroMsg !== msg) {
    errorMessage = `${msg}: ${erroMsg}`
  }
  if (detalhes) {
    const detalhesStr = typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes)
    errorMessage = `${errorMessage}${detalhesStr ? ` - ${detalhesStr}` : ''}`
  }

  throw new Error(errorMessage)
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


