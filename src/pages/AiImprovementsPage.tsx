import AppHeader from '../components/AppHeader'
import '../App.css'

const COMPANY_NAME = 'SC Solutions'

function AiImprovementsPage() {
  return (
    <div className="placeholder-page">
      <AppHeader companyName={COMPANY_NAME} />
      <header className="placeholder-page__header">
        <div>
          <h1>Melhorias com IA</h1>
          <p>
            Esta área será dedicada a recomendações inteligentes que apontam gargalos, oportunidades de automação e
            insights de atendimento.
          </p>
        </div>
      </header>

      <section className="placeholder-card">
        <h2>O que está previsto</h2>
        <p>
          A integração com modelos de IA permitirá consolidar dados dos certificados e sugerir próximos passos com base
          em contexto histórico.
        </p>
        <ul>
          <li>Assistente conversacional para responder dúvidas operacionais.</li>
          <li>Alertas proativos sobre documentos pendentes ou padrões suspeitos.</li>
          <li>Roadmap de melhorias priorizadas para cada área da empresa.</li>
        </ul>
        <p className="placeholder-card__helper">
          Assim que o serviço de IA estiver disponível, basta conectar o endpoint e renderizar os componentes dinâmicos
          nesta mesma rota.
        </p>
      </section>
    </div>
  )
}

export default AiImprovementsPage

