import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import AppHeader from '../components/AppHeader'
import { uploadExcelFile, uploadMultipleExcelFiles } from '../lib/backend'
import type { UploadExcelResult, UploadExcelItemResult } from '../lib/backend'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

type ConvertStatus = 'idle' | 'loading' | 'success' | 'error'

function ExcelToPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<ConvertStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<UploadExcelResult | null>(null)
  const [batchResults, setBatchResults] = useState<UploadExcelItemResult[] | null>(null)

  const cleanState = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setResult(null)
    setBatchResults(null)
  }, [])

  const handleFileSelection = useCallback(
    (inputFiles: File[] | null) => {
      if (!inputFiles || inputFiles.length === 0) {
        setFiles([])
        cleanState()
        return
      }
      setFiles(inputFiles)
      cleanState()
    },
    [cleanState],
  )

  const processFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files ? Array.from(event.target.files) : []
      void handleFileSelection(list)
    },
    [handleFileSelection],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      const droppedList = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : []
      void handleFileSelection(droppedList)
    },
    [handleFileSelection],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const fileListInfo = useMemo(() => {
    if (!files.length) return []
    return files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      lastModified: new Date(f.lastModified).toLocaleString('pt-BR'),
      type: f.type || 'Formato Excel',
    }))
  }, [files])

  const handleConvert = useCallback(async () => {
    if (!files.length) {
      setErrorMessage('Selecione ao menos um arquivo Excel antes de converter.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      if (files.length === 1) {
        const uploadResult = await uploadExcelFile(files[0])
        setResult(uploadResult)
      } else {
        const results = await uploadMultipleExcelFiles(files)
        setBatchResults(results)
      }
      setStatus('success')
    } catch (error) {
      console.error('Falha na conversão de arquivos', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível converter os arquivos. Tente novamente ou verifique a biblioteca de conversão.',
      )
      setStatus('error')
    }
  }, [files])

  return (
    <div className="page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="page__header">
        <div>
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
              multiple
              onChange={processFileInput}
              hidden
            />
            <p className="dropzone__title">Arraste sua planilha aqui</p>
            <p className="dropzone__subtitle">ou clique para procurar no computador</p>
            <span className="dropzone__hint">Formatos aceitos: .xlsx, .xls, .xlsm, .xltx, .csv</span>
          </label>

          {fileListInfo.length > 0 && (
            <section className="file-info">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {fileListInfo.map((info) => (
                  <li
                    key={info.name}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: '0 3px 8px rgba(15,23,42,0.06)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{info.name}</div>
                    <small style={{ color: '#64748b' }}>
                      Tamanho: {info.size} • Modificado: {info.lastModified}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="actions">
            <button
              className="actions__primary"
              type="button"
              onClick={handleConvert}
              disabled={!files.length || status === 'loading'}
            >
              {status === 'loading' ? 'Convertendo...' : 'Converter para PDF'}
            </button>
            <button
              className="actions__secondary"
              type="button"
              onClick={() => {
                void handleFileSelection([])
              }}
              disabled={!files.length || status === 'loading'}
            >
              Limpar
            </button>
          </div>

          {status === 'error' && errorMessage && <p className="feedback feedback--error">{errorMessage}</p>}
          {status === 'success' && result && files.length === 1 && (
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
          {status === 'success' && batchResults && files.length > 1 && (
            <section className="feedback feedback--success upload-result">
              <p>Arquivos processados. Veja o status de cada item abaixo:</p>
              <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {batchResults.map((item) => (
                  <div key={item.fileName} className="option-grid__item" style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{item.fileName}</div>
                    <div style={{ color: item.ok ? '#16a34a' : '#dc2626' }}>
                      {item.ok ? 'Processado com sucesso' : `Erro: ${item.error}`}
                    </div>
                    {item.ok && item.result && (
                      <div className="download-links" style={{ marginTop: 6 }}>
                        {item.result.downloadUrls.pdf && (
                          <a href={item.result.downloadUrls.pdf} className="download-link" download>
                            Baixar PDF
                          </a>
                        )}
                        {item.result.downloadUrls.planilha && (
                          <a href={item.result.downloadUrls.planilha} className="download-link" download>
                            Baixar planilha
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
