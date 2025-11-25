import { useEffect, useState, useRef } from 'react'
import AppHeader from '../components/AppHeader'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

type HeatmapItem = {
    city: string
    bairro: string
    address: string
    count: number
    lat: number | null
    long: number | null
}

function HeatmapPage() {
    const [data, setData] = useState<HeatmapItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetch('http://localhost:8000/dashboard/heatmap')
            .then((res) => res.json())
            .then((json) => {
                if (json.sucesso) {
                    setData(json.data.data || [])
                } else {
                    setError(json.message || 'Erro ao carregar dados')
                }
            })
            .catch((err) => {
                setError(err.message)
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

        // Prepara dados para o heatmap: [lat, lng, intensity]
        const heatData = validPoints.map((point) => {
            // Normaliza a intensidade (0.3 = mínimo visível, 1.0 = máximo)
            const maxCount = Math.max(...validPoints.map((p) => p.count))
            const intensity = 0.3 + (point.count / maxCount) * 0.7
            return [point.lat!, point.long!, intensity] as [number, number, number]
        })

        // @ts-ignore - leaflet.heat não tem types oficiais
        L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            max: 1.0,
            gradient: {
                0.0: 'blue',
                0.3: 'cyan',
                0.5: 'lime',
                0.7: 'yellow',
                1.0: 'red',
            },
        }).addTo(map)

        // Adiciona marcadores com popups
        validPoints.forEach((point) => {
            const marker = L.circleMarker([point.lat!, point.long!], {
                radius: 6,
                fillColor: '#2563eb',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
            }).addTo(map)

            marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>${point.city}</strong><br/>
          <em>${point.bairro || 'Bairro não especificado'}</em><br/>
          <span style="color: #2563eb; font-weight: 600;">${point.count} certificado${point.count > 1 ? 's' : ''}</span>
        </div>
      `)
        })

        // Ajusta zoom para mostrar todos os pontos
        if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints.map((p) => [p.lat!, p.long!]))
            map.fitBounds(bounds, { padding: [50, 50] })
        }

        return () => {
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
                                💡 <strong>Dica:</strong> Clique nos marcadores para ver detalhes. A intensidade da cor indica a concentração de certificados.
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
