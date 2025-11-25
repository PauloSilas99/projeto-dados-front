import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { clearCache, getCacheStatus } from '../lib/backend'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

function AdminCachePage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadStatus = () => {
    setLoading(true)
    getCacheStatus()
      .then((data) => setStatus(data))
      .catch((err) => setMessage(`Erro ao carregar status: ${err.message}`))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleClear = async (type: 'frontend' | 'backend' | 'all') => {
    setLoading(true)
    setMessage(null)
    try {
      if (type === 'frontend' || type === 'all') {
        // Simulação de limpeza frontend (localStorage, etc)
        localStorage.removeItem('theme') // Exemplo
      }
      if (type === 'backend' || type === 'all') {
        await clearCache()
      }
      setMessage('Cache limpo com sucesso!')
      loadStatus()
    } catch (error: any) {
      setMessage(`Erro ao limpar cache: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="page__header">
        <div>
          <h1>Gerenciamento de Cache</h1>
          <p>Limpe caches do cliente e do servidor.</p>
        </div>
      </header>

      <section className="analytics__grid">
        <div className="chart-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => handleClear('all')}
            disabled={loading}
            className="manual-form__add-btn"
            style={{ minWidth: 240 }}
          >
            {loading ? 'Limpando Cache...' : 'Limpar Cache'}
          </button>
          {message && <p className="feedback" style={{ marginTop: 12 }}>{message}</p>}
        </div>

        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <header>
            <h3>Status Atual</h3>
            <p>Informações do motor e registros de limpeza.</p>
          </header>
          {!status && <p>Carregando...</p>}
          {status && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Motor inicializado:</span>{' '}
                <strong>{status.motor_inicializado ? 'Sim' : 'Não'}</strong>
              </li>
              <li style={{ marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Motor criado em:</span>{' '}
                <strong>{status.motor_created_at || '-'}</strong>
              </li>
              <li>
                <span style={{ color: '#64748b' }}>Última limpeza:</span>{' '}
                <strong>{status.cache_last_cleared_at || '-'}</strong>
              </li>
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminCachePage