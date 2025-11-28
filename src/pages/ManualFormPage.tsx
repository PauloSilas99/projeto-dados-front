import { useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import AppHeader from '../components/AppHeader'
import { createManualCertificate, type ManualFormPayload } from '../lib/backend'
import type { UploadExcelResult } from '../lib/backend'
import '../App.css'

const COMPANY_NAME = 'ServeImuni'

type Produto = {
  nome_produto: string
  classe_quimica: string
  concentracao: string
}

type Metodo = {
  metodo: string
  quantidade: string
}

function ManualFormPage() {
  const [formData, setFormData] = useState({
    numero_certificado: '',
    numero_licenca: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco_completo: '',
    bairro: '',
    cidade: '',
    data_execucao: '',
    data_validade: '',
    pragas_tratadas: '',
    valor: '',
  })

  const [produtos, setProdutos] = useState<Produto[]>([{ nome_produto: '', classe_quimica: '', concentracao: '' }])
  const [metodos, setMetodos] = useState<Metodo[]>([{ metodo: '', quantidade: '' }])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<UploadExcelResult | null>(null)

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleProdutoChange = useCallback((index: number, field: keyof Produto, value: string) => {
    setProdutos((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const handleMetodoChange = useCallback((index: number, field: keyof Metodo, value: string) => {
    setMetodos((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const addProduto = useCallback(() => {
    setProdutos((prev) => [...prev, { nome_produto: '', classe_quimica: '', concentracao: '' }])
  }, [])

  const removeProduto = useCallback((index: number) => {
    setProdutos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addMetodo = useCallback(() => {
    setMetodos((prev) => [...prev, { metodo: '', quantidade: '' }])
  }, [])

  const removeMetodo = useCallback((index: number) => {
    setMetodos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    // Filtrar produtos e métodos vazios
    const produtosValidos = produtos
      .filter((p) => p.nome_produto.trim() || p.classe_quimica.trim())
      .map((p) => ({
        nome_produto: p.nome_produto.trim(),
        classe_quimica: p.classe_quimica.trim(),
        concentracao: p.concentracao.trim() ? parseFloat(p.concentracao.replace(',', '.')) : null,
      }))

    const metodosValidos = metodos
      .filter((m) => m.metodo.trim())
      .map((m) => ({
        metodo: m.metodo.trim(),
        quantidade: m.quantidade.trim(),
      }))

    const payload: ManualFormPayload = {
      certificado: {
        numero_certificado: formData.numero_certificado.trim(),
        numero_licenca: formData.numero_licenca.trim(),
        razao_social: formData.razao_social.trim(),
        nome_fantasia: formData.nome_fantasia.trim(),
        cnpj: formData.cnpj.trim(),
        endereco_completo: formData.endereco_completo.trim(),
        data_execucao: formData.data_execucao,
        data_validade: formData.data_validade,
        pragas_tratadas: formData.pragas_tratadas.trim(),
        ...(formData.valor.trim() && { valor: formData.valor.trim() }),
        ...(formData.bairro.trim() && { bairro: formData.bairro.trim() }),
        ...(formData.cidade.trim() && { cidade: formData.cidade.trim() }),
      },
      produtos: produtosValidos,
      metodos: metodosValidos,
    }

    try {
      const uploadResult = await createManualCertificate(payload)
      setResult(uploadResult)
      setStatus('success')
    } catch (error) {
      console.error('Falha ao criar certificado', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o certificado. Verifique os dados e tente novamente.',
      )
      setStatus('error')
    }
  }

  return (
    <div className="page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="page__header">
        <div>
          <h2>Certificado Manual</h2>
          <p>Preencha todos os dados necessários para gerar o certificado em PDF.</p>
        </div>
      </header>

      <main className="page__content">
        <form className="card manual-form" onSubmit={handleSubmit}>
          {/* Dados do Certificado */}
          <section className="manual-form__section manual-form__section--highlighted">
            <div className="manual-form__section-title">
              <span className="manual-form__icon">📋</span>
              <h2>Dados do Certificado</h2>
            </div>
            <div className="manual-form__grid">
              <div className="option-group">
                <label htmlFor="numero_certificado">Nº Certificado *</label>
                <input
                  id="numero_certificado"
                  type="text"
                  value={formData.numero_certificado}
                  onChange={(e) => handleInputChange('numero_certificado', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="numero_licenca">Nº Licença *</label>
                <input
                  id="numero_licenca"
                  type="text"
                  value={formData.numero_licenca}
                  onChange={(e) => handleInputChange('numero_licenca', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="razao_social">Razão Social *</label>
                <input
                  id="razao_social"
                  type="text"
                  value={formData.razao_social}
                  onChange={(e) => handleInputChange('razao_social', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="nome_fantasia">Nome Fantasia *</label>
                <input
                  id="nome_fantasia"
                  type="text"
                  value={formData.nome_fantasia}
                  onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="cnpj">CNPJ *</label>
                <input
                  id="cnpj"
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="endereco_completo">Endereço Completo *</label>
                <input
                  id="endereco_completo"
                  type="text"
                  value={formData.endereco_completo}
                  onChange={(e) => handleInputChange('endereco_completo', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="bairro">Bairro</label>
                <input
                  id="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="cidade">Cidade</label>
                <input
                  id="cidade"
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="data_execucao">Data de Execução *</label>
                <input
                  id="data_execucao"
                  type="date"
                  value={formData.data_execucao}
                  onChange={(e) => handleInputChange('data_execucao', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="data_validade">Data de Validade *</label>
                <input
                  id="data_validade"
                  type="date"
                  value={formData.data_validade}
                  onChange={(e) => handleInputChange('data_validade', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="pragas_tratadas">Pragas Tratadas *</label>
                <input
                  id="pragas_tratadas"
                  type="text"
                  value={formData.pragas_tratadas}
                  onChange={(e) => handleInputChange('pragas_tratadas', e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="option-group">
                <label htmlFor="valor">Valor (opcional)</label>
                <input
                  id="valor"
                  type="text"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="Ex: R$ 1.500,00"
                  disabled={status === 'loading'}
                />
              </div>
            </div>
          </section>

          {/* Produtos Químicos */}
          <section className="manual-form__section">
            <div className="manual-form__section-header">
              <div className="manual-form__section-title">
                <span className="manual-form__icon">🧪</span>
                <h2>Produtos Químicos</h2>
              </div>
              <button type="button" onClick={addProduto} className="manual-form__add-btn" disabled={status === 'loading'}>
                <span>+</span> Adicionar Produto
              </button>
            </div>
            {produtos.map((produto, index) => (
              <div key={index} className="manual-form__item-row manual-form__item-row--animated">
                <div className="option-group">
                  <label>Nome do Produto</label>
                  <input
                    type="text"
                    value={produto.nome_produto}
                    onChange={(e) => handleProdutoChange(index, 'nome_produto', e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
                <div className="option-group">
                  <label>Classe Química</label>
                  <input
                    type="text"
                    value={produto.classe_quimica}
                    onChange={(e) => handleProdutoChange(index, 'classe_quimica', e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
                <div className="option-group">
                  <label>Concentração</label>
                  <input
                    type="text"
                    value={produto.concentracao}
                    onChange={(e) => handleProdutoChange(index, 'concentracao', e.target.value)}
                    placeholder="Ex: 0.05"
                    disabled={status === 'loading'}
                  />
                </div>
                {produtos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduto(index)}
                    className="manual-form__remove-btn"
                    disabled={status === 'loading'}
                    aria-label="Remover produto"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* Métodos de Aplicação */}
          <section className="manual-form__section">
            <div className="manual-form__section-header">
              <div className="manual-form__section-title">
                <span className="manual-form__icon">⚙️</span>
                <h2>Métodos de Aplicação</h2>
              </div>
              <button type="button" onClick={addMetodo} className="manual-form__add-btn" disabled={status === 'loading'}>
                <span>+</span> Adicionar Método
              </button>
            </div>
            {metodos.map((metodo, index) => (
              <div key={index} className="manual-form__item-row manual-form__item-row--two-columns manual-form__item-row--animated">
                <div className="option-group">
                  <label>Descrição do Método</label>
                  <input
                    type="text"
                    value={metodo.metodo}
                    onChange={(e) => handleMetodoChange(index, 'metodo', e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
                <div className="option-group">
                  <label>Quantidade</label>
                  <input
                    type="text"
                    value={metodo.quantidade}
                    onChange={(e) => handleMetodoChange(index, 'quantidade', e.target.value)}
                    placeholder="Ex: 10 litros"
                    disabled={status === 'loading'}
                  />
                </div>
                {metodos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMetodo(index)}
                    className="manual-form__remove-btn"
                    disabled={status === 'loading'}
                    aria-label="Remover método"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </section>

          <div className="actions">
            <button
              className="actions__primary"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Gerando certificado...' : 'Gerar Certificado PDF'}
            </button>
          </div>

          {status === 'error' && errorMessage && (
            <p className="feedback feedback--error">{errorMessage}</p>
          )}

          {status === 'success' && result && (
            <section className="feedback feedback--success upload-result">
              <p>Certificado criado e processado com sucesso!</p>
              {result.certificadoNumero && (
                <p>
                  Certificado: <strong>{result.certificadoNumero}</strong>
                </p>
              )}
              {(result.downloadUrls.pdf || result.downloadUrls.planilha) && (
                <div className="download-links">
                  {result.downloadUrls.pdf && (
                    <a href={result.downloadUrls.pdf} className="download-link" download>
                      Baixar PDF gerado
                    </a>
                  )}
                  {result.downloadUrls.planilha && (
                    <a href={result.downloadUrls.planilha} className="download-link" download>
                      Baixar planilha consolidada
                    </a>
                  )}
                </div>
              )}
            </section>
          )}
        </form>
      </main>
    </div>
  )
}

export default ManualFormPage
