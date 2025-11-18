import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { uploadExcelFile } from '../lib/backend'
import type { UploadExcelResult } from '../lib/backend'
import '../App.css'

type ConvertStatus = 'idle' | 'loading' | 'success' | 'error'

function ExcelToPdfPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ConvertStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<UploadExcelResult | null>(null)

  const cleanState = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setResult(null)
  }, [])

  const handleFileSelection = useCallback(
    (inputFile: File | null) => {
      if (!inputFile) {
        setFile(null)
        cleanState()
        return
      }

      setFile(inputFile)
      cleanState()
    },
    [cleanState],
  )

  const processFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0] ?? null
      void handleFileSelection(selected)
    },
    [handleFileSelection],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      const dropped = event.dataTransfer.files?.[0] ?? null
      void handleFileSelection(dropped)
    },
    [handleFileSelection],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const fileInfo = useMemo(() => {
    if (!file) {
      return null
    }

    const sizeInKb = (file.size / 1024).toFixed(1)

    return {
      name: file.name,
      type: file.type || 'Formato Excel',
      size: `${sizeInKb} KB`,
      lastModified: new Date(file.lastModified).toLocaleString('pt-BR'),
    }
  }, [file])

  const handleConvert = useCallback(async () => {
    if (!file) {
      setErrorMessage('Selecione um arquivo Excel antes de converter.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const uploadResult = await uploadExcelFile(file)
      setResult(uploadResult)
      setStatus('success')
    } catch (error) {
      console.error('Falha na conversão do arquivo', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível converter o arquivo. Tente novamente ou verifique a biblioteca de conversão.',
      )
      setStatus('error')
    }
  }, [file])

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="subpage-nav">
            <Link to="/">← Voltar para o dashboard</Link>
          </p>
          <h1>Excel para PDF</h1>
          <p>Faça upload da planilha, escolha as opções e gere o PDF com apenas um clique.</p>
        </div>
      </header>

      <main className="page__content">
        <section className="card">
          <label
            className="dropzone"
            htmlFor="excel-input"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="excel-input"
              type="file"
              accept=".xlsx,.xls,.xlsm,.xltx,.csv"
              onChange={processFileInput}
              hidden
            />
            <p className="dropzone__title">Arraste sua planilha aqui</p>
            <p className="dropzone__subtitle">ou clique para procurar no computador</p>
            <span className="dropzone__hint">Formatos aceitos: .xlsx, .xls, .xlsm, .xltx, .csv</span>
          </label>

          {fileInfo && (
            <section className="file-info">
              <div>
                <strong>Arquivo:</strong> {fileInfo.name}
              </div>
              <div>
                <strong>Tamanho:</strong> {fileInfo.size}
              </div>
              <div>
                <strong>Última modificação:</strong> {fileInfo.lastModified}
              </div>
            </section>
          )}

          <div className="actions">
            <button
              className="actions__primary"
              type="button"
              onClick={handleConvert}
              disabled={!file || status === 'loading'}
            >
              {status === 'loading' ? 'Convertendo...' : 'Converter para PDF'}
            </button>
            <button
              className="actions__secondary"
              type="button"
              onClick={() => {
                void handleFileSelection(null)
              }}
              disabled={!file || status === 'loading'}
            >
              Limpar
            </button>
          </div>

          {status === 'error' && errorMessage && <p className="feedback feedback--error">{errorMessage}</p>}
          {status === 'success' && result && (
            <section className="feedback feedback--success upload-result">
              <p>Upload concluído e dados processados com sucesso pelo backend.</p>
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

              <details className="upload-result__details">
                <summary>Visualizar resposta completa do backend</summary>
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              </details>
            </section>
          )}
        </section>
      </main>

      <footer className="page__footer">
        <small>
          Certifique-se de carregar a biblioteca de conversão antes de usar a aplicação. Consulte a documentação para
          mais detalhes.
        </small>
      </footer>
    </div>
  )
}

export default ExcelToPdfPage

