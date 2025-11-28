import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import '../App.css'

const COMPANY_NAME = 'ServeImuni'
const HEATMAP_CACHE_KEY = 'heatmap_cache_v1'
const HEATMAP_CACHE_TTL_MS = Number(import.meta.env.VITE_HEATMAP_CACHE_TTL_MS || 12 * 60 * 60 * 1000)

type HeatmapItem = {
    city: string
    bairro: string
    address: string
    count: number
    lat: number | null
    long: number | null
}

function HeatmapPage() {
    const navigate = useNavigate()
    const [data, setData] = useState<HeatmapItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const now = Date.now()
        try {
            const raw = localStorage.getItem(HEATMAP_CACHE_KEY)
            if (raw) {
                const cached = JSON.parse(raw)
                if (cached && Array.isArray(cached.data) && typeof cached.ts === 'number') {
                    if (now - cached.ts < HEATMAP_CACHE_TTL_MS) {
                        setData(cached.data)
                        setLoading(false)
                    }
                }
            }
        } catch { }

        fetch('http://localhost:8000/dashboard/heatmap')
            .then((res) => res.json())
            .then((json) => {
                if (json.sucesso) {
                    const payload = json.data?.data || []
                    setData(payload)
                    try {
                        localStorage.setItem(HEATMAP_CACHE_KEY, JSON.stringify({ ts: now, data: payload }))
                    } catch { }
                } else {
                    if (!data.length) setError(json.message || 'Erro ao carregar dados')
                }
            })
            .catch((err) => {
                if (!data.length) setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!data.length || !mapContainerRef.current || mapRef.current) return

        // Filtra apenas pontos com coordenadas válidas
        const validPoints = data.filter((d) => d.lat !== null && d.long !== null)

        if (validPoints.length === 0) return

        // Inicializa o mapa centralizado no Brasil
        const map = L.map(mapContainerRef.current).setView([-15.7801, -47.9292], 4)
        mapRef.current = map

        // Adiciona camada de tiles do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map)

        const maxCount = Math.max(...validPoints.map((p) => p.count)) || 1
        const heatData = validPoints.map((point) => {
            const intensity = 0.25 + (point.count / maxCount) * 0.75
            return [point.lat!, point.long!, intensity] as [number, number, number]
        })

        // @ts-ignore - leaflet.heat não tem types oficiais
        L.heatLayer(heatData, {
            radius: 40,
            blur: 30,
            maxZoom: 12,
            max: 1.0,
            minOpacity: 0.25,
            gradient: {
                0.0: 'rgba(14, 165, 233, 0)',
                0.3: 'rgba(56, 189, 248, 0.35)',
                0.6: 'rgba(34, 197, 94, 0.55)',
                0.8: 'rgba(250, 204, 21, 0.65)',
                1.0: 'rgba(239, 68, 68, 0.75)',
            },
        }).addTo(map)
        // Camada de marcadores (apenas em zoom amplo: país/estado/cidade)
        const markersLayer = L.layerGroup().addTo(map)
        validPoints.forEach((point) => {
            const marker = L.circleMarker([point.lat!, point.long!], {
                radius: 6,
                fillColor: '#2563eb',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
            })
            marker.bindPopup(
                `<div style="font-family: sans-serif;">
                  <strong>${point.city}</strong><br/>
                  <em>${point.bairro || 'Bairro não especificado'}</em><br/>
                  <span style="color: #2563eb; font-weight: 600;">${point.count} certificado${point.count > 1 ? 's' : ''}</span>
                </div>`
            )
            marker.addTo(markersLayer)
        })
        // Atualiza visibilidade dos marcadores conforme zoom
        const updateMarkersVisibility = () => {
            const z = map.getZoom()
            // Mostrar pontos até nível de cidade (~<= 11); ocultar em bairros (> 11)
            if (z <= 11) {
                if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer)
            } else {
                if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer)
            }
        }
        updateMarkersVisibility()
        map.on('zoomend', updateMarkersVisibility)

        // Ajusta zoom para mostrar todos os pontos
        if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints.map((p) => [p.lat!, p.long!]))
            map.fitBounds(bounds, { padding: [50, 50] })
        }

        return () => {
            map.off('zoomend', updateMarkersVisibility)
            map.remove()
            mapRef.current = null
        }
    }, [data])

    return (
        <div className="page">
            <AppHeader companyName={COMPANY_NAME} />
            <header className="page__header">
                <div>
                    <h2>Mapa de Calor - Distribuição Geográfica</h2>
                    <p>Visualização interativa dos certificados por localização (cidade + bairro).</p>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/dados-pdfs')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12.5 15L7.5 10L12.5 5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Voltar para Dados Estatísticos
                    </button>
                </div>
            </header>

            <main className="page__content">
                {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando mapa...</p>}
                {error && (
                    <div className="card" style={{ background: '#fee', border: '1px solid #fcc', padding: '1rem' }}>
                        <p style={{ color: '#c00', margin: 0 }}>❌ Erro: {error}</p>
                    </div>
                )}
                {!loading && !error && (
                    <>
                        <section className="card">
                            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                                Total de localizações: <strong>{data.length}</strong> | Total de certificados:{' '}
                                <strong>{data.reduce((acc, d) => acc + d.count, 0)}</strong>
                            </p>

                            {/* Mapa interativo */}
                            <div
                                ref={mapContainerRef}
                                style={{
                                    width: '100%',
                                    height: '600px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0',
                                }}
                            />

                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1rem' }}>
                                💡 <strong>Dica:</strong> A intensidade da cor indica a concentração de certificados; áreas mais fortes representam maior densidade.
                            </p>
                        </section>

                        {data.length === 0 && (
                            <p className="chart-card__empty" style={{ textAlign: 'center', padding: '3rem' }}>
                                Nenhum dado disponível para exibição no mapa.
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default HeatmapPage
