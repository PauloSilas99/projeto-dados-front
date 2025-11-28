import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const COMPANY_NAME = 'ServeImuni'

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
  // Popup de funcionalidade não implementada
  const [notImplOpen, setNotImplOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotImplOpen(false)
    }
    if (notImplOpen) {
      window.addEventListener('keydown', onKey)
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [notImplOpen])

  const selectedNames = useMemo(() => Object.keys(selected).filter((n) => selected[n]), [selected])
  const selectedIds = useMemo(() => {
    return items
      .filter((it) => selected[it.relpath])
      .map((it) => (it as any).cert_id)
      .filter((id) => typeof id === 'string' && id.trim())
  }, [items, selected])

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
    console.log('AdminPdfs filters state:', {
      q,
      docType,
      dataDe,
      dataAte,
      limit,
      offset,
    })
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (docType.trim()) params.set('doc_type', docType.trim())
    if (dataDe.trim()) params.set('data_de', `${dataDe.trim()}T00:00:00`)
    if (dataAte.trim()) params.set('data_ate', `${dataAte.trim()}T23:59:59`)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    const url = `${API_BASE}/api/admin/pdfs?${params.toString()}`
    console.log('AdminPdfs load URL:', url)
    fetch(url)
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
    const payloadItems = items
      .filter((it) => selected[it.relpath])
      .map((it) => ({ name: it.relpath, id: (it as any).cert_id }))
    if (payloadItems.length === 0) {
      setError('Nenhum item selecionado para excluir')
      return
    }
    setNotImplOpen(true)
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
          <p>Gerencie visualização e download dos PDFs gerados.</p>
        </div>
      </header>

      <section className="analytics__grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="option-grid__item">
              <label className="option-group__label">Busca por nome</label>
              <input className="option-group__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="cert_..." />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Tipo</label>
              <select className="option-group__input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="">Todos</option>
                <option value="documento">Documento</option>
              </select>
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Criado de</label>
              <input
                className="option-group__input"
                type="date"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
              />
            </div>
            <div className="option-grid__item">
              <label className="option-group__label">Criado até</label>
              <input
                className="option-group__input"
                type="date"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
              />
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
          <div className="actions" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="actions__secondary btn-large" onClick={load}>Aplicar filtros</button>
          </div>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: '0.85rem' }}>
            <span>Query atual: </span>
            <code>{(() => {
              const p = new URLSearchParams()
              if (q.trim()) p.set('q', q.trim())
              if (docType.trim()) p.set('doc_type', docType.trim())
              if (dataDe.trim()) p.set('data_de', `${dataDe.trim()}T00:00:00`)
              if (dataAte.trim()) p.set('data_ate', `${dataAte.trim()}T23:59:59`)
              p.set('limit', String(limit))
              p.set('offset', String(offset))
              return `/api/admin/pdfs?${p.toString()}`
            })()}</code>
          </div>
        </div>

        <div className="chart-card">
          <div className="option-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
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
          {loading && <p style={{ padding: '1rem', textAlign: 'center' }}>Carregando documentos...</p>}
          {!loading && error && <p className="feedback feedback--error" style={{ textAlign: 'center' }}>{error}</p>}
          {!loading && !error && items.length === 0 && <p className="chart-card__empty">Nenhum PDF encontrado.</p>}
          {!loading && !error && items.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Selecionar</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Arquivo</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Tamanho</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Criado</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((it) => (
                  <tr key={it.relpath} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="checkbox" checked={!!selected[it.relpath]} onChange={(e) => toggle(it.relpath, e.target.checked)} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <span className={`badge badge--status-${it.status}`}>{it.status}</span>{' '}
                      <span className={`badge badge--type-${it.doc_type}`}>{it.doc_type}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{it.doc_type}</td>
                    <td style={{ padding: '10px 12px' }}>{it.size_human}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(it.modified_at).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="actions__secondary btn-large" type="button" onClick={() => openPreview(it.relpath)}>Preview</button>{' '}
                      <a className="download-link btn-large" href={`${API_BASE}/api/admin/pdfs/download?name=${encodeURIComponent(it.relpath)}`} download>Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="actions" style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
            <button className="actions__secondary btn-large" onClick={baixarZip} disabled={selectedNames.length === 0}>Baixar selecionados (.zip)</button>
            <button
              className="btn-large"
              onClick={excluirSelecionados}
              disabled={selectedNames.length === 0}
              style={{
                padding: '0.6rem 1rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                cursor: selectedNames.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedNames.length === 0 ? 0.6 : 1
              }}
            >
              Excluir selecionados
            </button>
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
      {notImplOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="not-impl-title"
          onClick={() => setNotImplOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 92vw)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(2, 6, 23, 0.35)',
              background: '#fff',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 id="not-impl-title" style={{ margin: 0, fontSize: '1.1rem' }}>Funcionalidade não implementada</h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setNotImplOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px 18px', color: '#0f172a' }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Exclusão em cascata ainda não está disponível. Em breve você poderá remover PDFs e seus registros relacionados de forma segura.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Popup de aviso removido conforme solicitado */}
    </div>
  )
}

export default AdminPdfsPage
