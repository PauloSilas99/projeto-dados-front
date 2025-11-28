const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
// Debug: verificar se as variáveis estão sendo carregadas
if (import.meta.env.DEV) {
  console.log('Variáveis de ambiente Gemini:', {
    hasKey: !!GEMINI_API_KEY,
    hasUrl: !!GEMINI_API_URL,
    keyLength: GEMINI_API_KEY?.length || 0,
  })
}

if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY não está definida no arquivo .env')
  console.error('Certifique-se de que:')
  console.error('1. O arquivo .env existe na raiz do projeto')
  console.error('2. A variável VITE_GEMINI_API_KEY está definida no .env')
  console.error('3. O servidor de desenvolvimento foi reiniciado após criar/editar o .env')
}

if (!GEMINI_API_URL) {
  console.warn('VITE_GEMINI_API_URL não está definida no arquivo .env, usando URL padrão com modelo gemini-1.5-flash')
}

export type OverviewData = {
  totals: {
    certificados: number
    produtos: number
    metodos: number
  }
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

type GeminiRecommendation = {
  id: string
  category: 'performance' | 'automation' | 'growth' | 'optimization'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

type GeminiResponse = {
  period: string
  summary: {
    totalCertificados: number
    totalProdutos: number
    totalMetodos: number
    valorTotal: number
    ticketMedio: number
    crescimentoPercentual: number
    topCidade: string
  }
  recommendations: GeminiRecommendation[]
  insights: string[]
}

function formatDataForPrompt(overview: OverviewData): string {
  return JSON.stringify({
    totais: overview.totals,
    certificadosPorMes: overview.certificadosPorMes,
    certificadosPorCidade: overview.certificadosPorCidade,
    certificadosPorPraga: overview.certificadosPorPraga,
    classesQuimicas: overview.classesQuimicas,
    metodosAplicacao: overview.metodosAplicacao,
    valorFinanceiro: overview.valorFinanceiro,
  }, null, 2)
}

function createPrompt(overview: OverviewData, periodStart: string, periodEnd: string): string {
  const dataJson = formatDataForPrompt(overview)
  
  return `Você é um analista de dados especializado em certificados de serviços agrícolas. Analise os seguintes dados e gere um relatório completo em formato JSON.

Dados do período de ${periodStart} a ${periodEnd}:
${dataJson}

Gere um relatório JSON com a seguinte estrutura exata:
{
  "period": "${periodStart} a ${periodEnd}",
  "summary": {
    "totalCertificados": <número>,
    "totalProdutos": <número>,
    "totalMetodos": <número>,
    "valorTotal": <número>,
    "ticketMedio": <número>,
    "crescimentoPercentual": <número entre -100 e 100>,
    "topCidade": "<nome da cidade>"
  },
  "recommendations": [
    {
      "id": "perf-1",
      "category": "performance" | "automation" | "growth" | "optimization",
      "title": "<título da recomendação>",
      "description": "<descrição detalhada e específica baseada nos dados>",
      "priority": "high" | "medium" | "low",
      "impact": "<descrição do impacto esperado>"
    }
  ],
  "insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ]
}

IMPORTANTE:
- Gere entre 3 e 6 recomendações relevantes baseadas nos dados fornecidos
- As recomendações devem ser específicas, acionáveis e baseadas nos dados reais
- Use os dados de certificadosPorCidade, certificadosPorPraga, classesQuimicas e metodosAplicacao para insights
- Calcule o crescimentoPercentual baseado em tendências dos dados (se houver dados mensais suficientes)
- Os insights devem ser análises objetivas dos padrões identificados
- Retorne APENAS o JSON, sem markdown, sem código, sem explicações adicionais
- O JSON deve ser válido e parseável`
}

export async function generateAIReportWithGemini(
  overview: OverviewData,
  periodStart: Date,
  periodEnd: Date,
  signal?: AbortSignal
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error('VITE_GEMINI_API_KEY não está configurada. Por favor, adicione a chave da API do Gemini no arquivo .env e reinicie o servidor de desenvolvimento.')
  }

  if (!GEMINI_API_URL || GEMINI_API_URL.trim() === '') {
    throw new Error('VITE_GEMINI_API_URL não está configurada. Por favor, adicione a URL da API do Gemini no arquivo .env e reinicie o servidor de desenvolvimento.')
  }

  const periodStartStr = periodStart.toLocaleDateString('pt-BR')
  const periodEndStr = periodEnd.toLocaleDateString('pt-BR')
  
  const prompt = createPrompt(overview, periodStartStr, periodEndStr)

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
        signal,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API do Gemini: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extrair o texto da resposta do Gemini
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textResponse) {
      throw new Error('Resposta inválida da API do Gemini')
    }

    // Limpar o texto (remover markdown code blocks se houver)
    let cleanedText = textResponse.trim()
    
    // Remover markdown code blocks se presentes
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Tentar fazer parse do JSON
    let parsed: GeminiResponse
    try {
      parsed = JSON.parse(cleanedText)
    } catch (parseError) {
      // Se falhar, tentar extrair JSON do texto
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Não foi possível extrair JSON da resposta do Gemini')
      }
    }

    // Validar estrutura básica
    if (!parsed.summary || !parsed.recommendations || !parsed.insights) {
      throw new Error('Resposta do Gemini não contém a estrutura esperada')
    }

    // Garantir que os valores numéricos estão corretos
    parsed.summary.totalCertificados = overview.totals.certificados
    parsed.summary.totalProdutos = overview.totals.produtos
    parsed.summary.totalMetodos = overview.totals.metodos
    parsed.summary.valorTotal = overview.valorFinanceiro.total
    parsed.summary.ticketMedio = overview.valorFinanceiro.media

    // Garantir que topCidade está definida
    if (!parsed.summary.topCidade && overview.certificadosPorCidade.length > 0) {
      parsed.summary.topCidade = overview.certificadosPorCidade[0].cidade
    }

    return parsed
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    console.error('Erro ao gerar relatório com Gemini:', error)
    throw new Error(
      error instanceof Error
        ? `Erro ao gerar relatório: ${error.message}`
        : 'Erro desconhecido ao gerar relatório com Gemini'
    )
  }
}

