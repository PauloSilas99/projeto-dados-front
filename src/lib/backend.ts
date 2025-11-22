const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_BASE_URL

function resolveBackendUrl(pathOrUrl: string | undefined | null): string | null {
  if (!pathOrUrl) {
    return null
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${API_BASE_URL}${normalizedPath}`
}

export interface UploadExcelResponse {
  certificado?: Record<string, unknown>
  produtos?: unknown
  metodos?: unknown
  arquivos?: Record<string, unknown>
  urls?: Record<string, string>
  [key: string]: unknown
}

export interface UploadExcelResult {
  data: UploadExcelResponse
  downloadUrls: {
    pdf: string | null
    planilha: string | null
  }
  certificadoNumero: string | null
  certificadoId?: string | null
}

export interface UploadExcelItemResult {
  fileName: string
  ok: boolean
  result?: UploadExcelResult
  error?: string
}

export interface CertificateFilters {
  id?: string
  bairro?: string
  cidade?: string
  minValor?: number
  maxValor?: number
  limit?: number
  offset?: number
}

export interface CertificateListItem {
  certificado: Record<string, unknown>
  urls: Record<string, string>
  arquivos: Record<string, unknown>
}

function extractCertificateNumber(certificado: Record<string, unknown> | undefined): string | null {
  if (!certificado) {
    return null
  }

  const possibleKeys = [
    'numero_certificado',
    'numeroCertificado',
    'numero',
    'numero_cert',
    'numeroCert',
    'certificado',
  ]

  for (const key of possibleKeys) {
    const value = certificado[key as keyof typeof certificado]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
    if (typeof value === 'number') {
      return String(value)
    }
  }

  return null
}

function extractCertificateId(certificado: Record<string, unknown> | undefined): string | null {
  if (!certificado) {
    return null
  }
  const value = certificado['id' as keyof typeof certificado]
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return null
}

function pickString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function pickFromRecord(record: Record<string, unknown> | undefined, key: string): string | null {
  if (!record || typeof record !== 'object') {
    return null
  }

  const value = record[key]
  return typeof value === 'string' ? value : null
}

function ensureEncodedCertificatePath(url: string | null, certificateNumber: string | null): string | null {
  if (!url || !certificateNumber) {
    return url
  }

  const encodedNumber = encodeURIComponent(certificateNumber)

  if (url.includes(`/certificados/${certificateNumber}`)) {
    return url.replace(`/certificados/${certificateNumber}`, `/certificados/${encodedNumber}`)
  }

  if (url.includes(`certificados%2F${encodedNumber}`)) {
    return url
  }

  return url
}

export async function uploadExcelFile(file: File): Promise<UploadExcelResult> {
  const formData = new FormData()
  formData.append('arquivo', file)

  const response = await fetch(`${API_BASE_URL}/certificados/upload-excel`, {
    method: 'POST',
    body: formData,
  })

  const text = await response.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(text || `Erro ${response.status} no backend`)
  }

  if (parsed?.sucesso === false) {
    throw new Error(parsed.message || 'Erro desconhecido no servidor')
  }

  if (!parsed?.data) {
    throw new Error('Resposta inválida do servidor: dados ausentes')
  }
  const data = parsed.data as UploadExcelResponse

  const certificadoNumero = extractCertificateNumber(data.certificado)
  const certificadoId = extractCertificateId(data.certificado)

  const arquivos = data.arquivos
  const arquivosUrls =
    arquivos && typeof arquivos === 'object' && !Array.isArray(arquivos)
      ? ((arquivos as { urls?: unknown }).urls as Record<string, unknown> | undefined)
      : undefined

  const pdfUrlFromResponse = pickString(
    pickFromRecord(arquivosUrls, 'pdf'),
    pickFromRecord(arquivosUrls, 'certificadoPdf'),
    data.urls?.pdf,
    data.urls?.certificadoPdf,
  )

  const planilhaUrlFromResponse = pickString(
    pickFromRecord(arquivosUrls, 'planilha'),
    pickFromRecord(arquivosUrls, 'planilhaConsolidada'),
    data.urls?.planilha,
    data.urls?.planilhaConsolidada,
  )

  const pdfDownloadUrl =
    resolveBackendUrl(pdfUrlFromResponse) ??
    (certificadoId
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoId)}/pdf`)
      : certificadoNumero
        ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/pdf`)
        : null)

  const planilhaDownloadUrl =
    resolveBackendUrl(planilhaUrlFromResponse) ??
    (certificadoId
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoId)}/planilha`)
      : certificadoNumero
        ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/planilha`)
        : null)

  return {
    data,
    downloadUrls: {
      pdf: ensureEncodedCertificatePath(pdfDownloadUrl, certificadoNumero),
      planilha: ensureEncodedCertificatePath(planilhaDownloadUrl, certificadoNumero),
    },
    certificadoNumero,
    certificadoId,
  }
}

export async function uploadMultipleExcelFiles(files: File[]): Promise<UploadExcelItemResult[]> {
  const tasks = files.map(async (f) => {
    try {
      const r = await uploadExcelFile(f)
      return { fileName: f.name, ok: true, result: r } as UploadExcelItemResult
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao enviar o arquivo'
      return { fileName: f.name, ok: false, error: msg } as UploadExcelItemResult
    }
  })
  return Promise.all(tasks)
}

export async function listCertificates(filters: CertificateFilters = {}, signal?: AbortSignal): Promise<CertificateListItem[]> {
  const params = new URLSearchParams()
  if (filters.id) params.set('id', filters.id.trim())
  if (filters.bairro) params.set('bairro', filters.bairro.trim())
  if (filters.cidade) params.set('cidade', filters.cidade.trim())
  if (typeof filters.minValor === 'number') params.set('min_valor', String(filters.minValor))
  if (typeof filters.maxValor === 'number') params.set('max_valor', String(filters.maxValor))
  params.set('limit', String(filters.limit ?? 100))
  params.set('offset', String(filters.offset ?? 0))
  const response = await fetch(`${API_BASE_URL}/certificados?${params.toString()}`, { signal })
  {
    const text = await response.text()
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(text || `Erro ${response.status} ao listar certificados`)
    }

    if (parsed?.sucesso === false) {
      throw new Error(parsed.message || 'Erro ao listar certificados')
    }

    if (!parsed?.data) {
      throw new Error('Resposta inválida do servidor: dados ausentes')
    }
    const data = parsed.data as CertificateListItem[]
    return Array.isArray(data) ? data : []
  }
}

export interface ManualFormPayload {
  certificado: {
    numero_certificado: string
    numero_licenca: string
    razao_social: string
    nome_fantasia: string
    cnpj: string
    endereco_completo: string
    data_execucao: string
    data_validade: string
    pragas_tratadas: string
    valor?: string
    bairro?: string
    cidade?: string
  }
  produtos: Array<{
    nome_produto: string
    classe_quimica: string
    concentracao?: number | null
  }>
  metodos: Array<{
    metodo: string
    quantidade: string
  }>
}

export async function createManualCertificate(
  payload: ManualFormPayload,
): Promise<UploadExcelResult> {
  const response = await fetch(`${API_BASE_URL}/certificados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(text || `Erro ${response.status} no backend`)
  }

  if (parsed?.sucesso === false) {
    throw new Error(parsed.message || 'Erro ao criar certificado manual')
  }

  if (!parsed?.data) {
    throw new Error('Resposta inválida do servidor: dados ausentes')
  }
  const data = parsed.data as UploadExcelResponse

  const certificadoNumero = extractCertificateNumber(data.certificado)
  const certificadoId = extractCertificateId(data.certificado)

  const arquivos = data.arquivos
  const arquivosUrls =
    arquivos && typeof arquivos === 'object' && !Array.isArray(arquivos)
      ? ((arquivos as { urls?: unknown }).urls as Record<string, unknown> | undefined)
      : undefined

  const pdfUrlFromResponse = pickString(
    pickFromRecord(arquivosUrls, 'pdf'),
    pickFromRecord(arquivosUrls, 'certificadoPdf'),
    data.urls?.pdf,
    data.urls?.certificadoPdf,
  )

  const planilhaUrlFromResponse = pickString(
    pickFromRecord(arquivosUrls, 'planilha'),
    pickFromRecord(arquivosUrls, 'planilhaConsolidada'),
    data.urls?.planilha,
    data.urls?.planilhaConsolidada,
  )

  const pdfDownloadUrl =
    resolveBackendUrl(pdfUrlFromResponse) ??
    (certificadoId
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoId)}/pdf`)
      : certificadoNumero
        ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/pdf`)
        : null)

  const planilhaDownloadUrl =
    resolveBackendUrl(planilhaUrlFromResponse) ??
    (certificadoId
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoId)}/planilha`)
      : certificadoNumero
        ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/planilha`)
        : null)

  return {
    data,
    downloadUrls: {
      pdf: ensureEncodedCertificatePath(pdfDownloadUrl, certificadoNumero),
      planilha: ensureEncodedCertificatePath(planilhaDownloadUrl, certificadoNumero),
    },
    certificadoNumero,
    certificadoId,
  }
}

export { resolveBackendUrl }

export async function getCacheStatus(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/admin/cache-status`)
  if (!response.ok) {
    throw new Error(await response.text())
  }
  const json = await response.json()
  return json.data || json
}

export async function clearCache(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/clear-cache`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  await response.json()
}
