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

  const response = await fetch(`${API_BASE_URL}/upload-excel`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => null)
    throw new Error(
      errorText
        ? `Falha ao enviar o arquivo para o backend: ${response.status} ${response.statusText} - ${errorText}`
        : `Falha ao enviar o arquivo para o backend: ${response.status} ${response.statusText}`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('O backend retornou um formato inesperado. Esperado JSON.')
  }

  const data = (await response.json()) as UploadExcelResponse

  const certificadoNumero = extractCertificateNumber(data.certificado)

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
    (certificadoNumero
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/pdf`)
      : null)

  const planilhaDownloadUrl =
    resolveBackendUrl(planilhaUrlFromResponse) ??
    (certificadoNumero
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/planilha`)
      : null)

  return {
    data,
    downloadUrls: {
      pdf: ensureEncodedCertificatePath(pdfDownloadUrl, certificadoNumero),
      planilha: ensureEncodedCertificatePath(planilhaDownloadUrl, certificadoNumero),
    },
    certificadoNumero,
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

  if (!response.ok) {
    const errorText = await response.text().catch(() => null)
    throw new Error(
      errorText
        ? `Falha ao criar certificado: ${response.status} ${response.statusText} - ${errorText}`
        : `Falha ao criar certificado: ${response.status} ${response.statusText}`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('O backend retornou um formato inesperado. Esperado JSON.')
  }

  const data = (await response.json()) as UploadExcelResponse

  const certificadoNumero = extractCertificateNumber(data.certificado)

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
    (certificadoNumero
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/pdf`)
      : null)

  const planilhaDownloadUrl =
    resolveBackendUrl(planilhaUrlFromResponse) ??
    (certificadoNumero
      ? resolveBackendUrl(`/certificados/${encodeURIComponent(certificadoNumero)}/planilha`)
      : null)

  return {
    data,
    downloadUrls: {
      pdf: ensureEncodedCertificatePath(pdfDownloadUrl, certificadoNumero),
      planilha: ensureEncodedCertificatePath(planilhaDownloadUrl, certificadoNumero),
    },
    certificadoNumero,
  }
}

export { resolveBackendUrl }

