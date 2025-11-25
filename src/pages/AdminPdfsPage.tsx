import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const COMPANY_NAME = 'SC Solutions'

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000'

type PdfItem = {
  name: string
  relpath: string
  size_bytes: number
  size_human: string
  modified_at: string
  doc_type: string
  status: string
}

function AdminPdfsPage() {
  const [items, setItems] = useState<PdfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [docType, setDocType] = useState('')
  const [dataDe, setDataDe] = useState('')
  const [dataAte, setDataAte] = useState('')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const [sortKey, setSortKey] = useState<'date' | 'size' | 'name'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const MODAL_OFFSET = 24
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)

  const selectedNames = useMemo(() => Object.keys(selected).filter((n) => selected[n]), [selected])

  const sortedItems = useMemo(() => {
    const base = [...items]
    const cmp = (a: PdfItem, b: PdfItem) => {
      if (sortKey === 'date') {
        const ta = new Date(a.modified_at).getTime()
        const tb = new Date(b.modified_at).getTime()
        return sortDir === 'asc' ? ta - tb : tb - ta
      }
      if (sortKey === 'size') {
        return sortDir === 'asc' ? a.size_bytes - b.size_bytes : b.size_bytes - a.size_bytes
      }
      // name
      const na = a.name.toLowerCase()
      const nb = b.name.toLowerCase()
      if (na < nb) return sortDir === 'asc' ? -1 : 1
      if (na > nb) return sortDir === 'asc' ? 1 : -1
      return 0
    }
    base.sort(cmp)
    return base
  }, [items, sortKey, sortDir])

  const load = () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (docType.trim()) params.set('doc_type', docType.trim())
    if (dataDe.trim()) params.set('data_de', dataDe.trim())
    if (dataAte.trim()) params.set('data_ate', dataAte.trim())
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    fetch(`${API_BASE}/api/admin/pdfs?${params.toString()}`)
      .then(async (res) => {
        const text = await res.text()
        const parsed = JSON.parse(text)
        if (parsed?.sucesso !== true) throw new Error(parsed?.message || 'Falha ao listar PDFs')
        setItems(parsed.data as PdfItem[])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = (name: string, value: boolean) => setSelected((prev) => ({ ...prev, [name]: value }))

  const openPreview = (name: string) => {
    fetch(`${API_BASE}/api/admin/pdfs/download?name=${encodeURIComponent(name)}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setPreviewName(name)
        setPreviewOpen(true)
      })
      .catch((e: Error) => setError(e.message))
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewName(null)
    setPreviewOpen(false)
  }

  const excluirSelecionados = () => {
    if (selectedNames.length === 0) return
    fetch(`${API_BASE}/api/admin/pdfs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: selectedNames }),
    })
      .then(async (res) => {
        const text = await res.text()
        const parsed = JSON.parse(text)
        if (parsed?.sucesso !== true) throw new Error(parsed?.message || 'Falha ao excluir PDFs')
        load()
      })
      .catch((e: Error) => setError(e.message))
  }

  const baixarZip = () => {
    if (selectedNames.length === 0) return
    fetch(`${API_BASE}/api/admin/pdfs/download-zip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: selectedNames }),
    })
      .then(async (res) => {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'documentos.zip'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch((e: Error) => setError(e.message))
  }

  return (
    <div className="analytics-page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="analytics__header">
        <div>
          <h1>Documentos PDF</h1>
          <p>Gerencie visualização, download e exclusão de PDFs gerados.</p>
        </div>
      </header>

      <section className="analytics__grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="option-grid__item">
              <label className="option-group__label">Busca por nome</label>
              <input className="option-group__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="cert_..." />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Tipo</label>
              <select className="option-group__input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="">Todos</option>
                <option value="certificado">Certificado</option>
                <option value="documento">Documento</option>
              </select>
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Criado de</label>
              <input className="option-group__input" type="datetime-local" value={dataDe} onChange={(e) => setDataDe(e.target.value)} />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Criado até</label>
              <input className="option-group__input" type="datetime-local" value={dataAte} onChange={(e) => setDataAte(e.target.value)} />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Página</label>
              <input className="option-group__input" type="number" value={offset} onChange={(e) => setOffset(Number(e.target.value))} />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Limite</label>
              <input className="option-group__input" type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
          </div>
          <div className="actions">
            <button className="actions__secondary" onClick={load}>Aplicar filtros</button>
          </div>
        </div>

        <div className="chart-card">
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="option-grid__item">
              <label className="option-group__label">Ordenar por</label>
              <select className="option-group__input" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                <option value="date">Data</option>
                <option value="size">Tamanho</option>
                <option value="name">Nome</option>
              </select>
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Direção</label>
              <select className="option-group__input" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
            <div className="option-grid__item">
              <span className="sort-indicator">Ordenação: {sortKey}/{sortDir}</span>
            </div>
          </div>
          {loading && <p>Carregando documentos...</p>}
          {!loading && error && <p className="feedback feedback--error">{error}</p>}
          {!loading && !error && items.length === 0 && <p className="chart-card__empty">Nenhum PDF encontrado.</p>}
          {!loading && !error && items.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Selecionar</th>
                  <th style={{ textAlign: 'left' }}>Arquivo</th>
                  <th style={{ textAlign: 'left' }}>Tipo</th>
                  <th style={{ textAlign: 'left' }}>Tamanho</th>
                  <th style={{ textAlign: 'left' }}>Criado</th>
                  <th style={{ textAlign: 'left' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((it) => (
                  <tr key={it.relpath} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td>
                      <input type="checkbox" checked={!!selected[it.relpath]} onChange={(e) => toggle(it.relpath, e.target.checked)} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <span className={`badge badge--status-${it.status}`}>{it.status}</span>{' '}
                      <span className={`badge badge--type-${it.doc_type}`}>{it.doc_type}</span>
                    </td>
                    <td>{it.doc_type}</td>
                    <td>{it.size_human}</td>
                    <td>{new Date(it.modified_at).toLocaleString()}</td>
                    <td>
                      <button className="actions__secondary" type="button" onClick={() => openPreview(it.relpath)}>Preview</button>{' '}
                      <a className="download-link" href={`${API_BASE}/api/admin/pdfs/download?name=${encodeURIComponent(it.relpath)}`} download>Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="actions__secondary" onClick={baixarZip} disabled={selectedNames.length === 0}>Baixar selecionados (.zip)</button>
            <button className="actions__danger" onClick={excluirSelecionados} disabled={selectedNames.length === 0}>Excluir selecionados</button>
          </div>
        </div>
      </section>

      {previewOpen && (
        <div className="modal-backdrop" onClick={closePreview}>
          <div className="modal" style={{ top: MODAL_OFFSET }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Pré-visualização: {previewName}</h3>
              <button type="button" className="actions__secondary" onClick={closePreview}>Fechar</button>
            </div>
            <div className="modal__content">
              {previewUrl && (
                <iframe title="preview-pdf" src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPdfsPage
