import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import '../App.css'

type CompanyProfile = {
  name: string
  cnpj: string
  segment: string
  contactEmail: string
  lastSync: string
  operations: number
}

type UserProfilePageProps = {
  company: CompanyProfile
}

function UserProfilePage({ company }: UserProfilePageProps) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <AppHeader companyName={company.name} />
      <header className="page__header">
        <div>
          <h1>Perfil do Usuário</h1>
          <p>Gerencie suas informações pessoais e preferências da conta.</p>
        </div>
      </header>

      <section className="dashboard__company-card">
        <header>
          <div>
            <p className="dashboard__company-label">Empresa logada</p>
            <h2>{company.name}</h2>
          </div>
          <div className="dashboard__stats">
            <div>
              <span>Segmento</span>
              <strong>{company.segment}</strong>
            </div>
            <div>
              <span>Operações acompanhadas</span>
              <strong>{company.operations}</strong>
            </div>
          </div>
        </header>
        <ul className="dashboard__info-list">
          <li>
            <span>CNPJ</span>
            <strong>{company.cnpj}</strong>
          </li>
          <li>
            <span>Contato</span>
            <strong>{company.contactEmail}</strong>
          </li>
          <li>
            <span>Última sincronização</span>
            <strong>{company.lastSync}</strong>
          </li>
        </ul>
      </section>

      <section className="dashboard__actions" style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className="dashboard__action-card"
          onClick={() => navigate('/admin')}
        >
          <div>
            <h3>Administração</h3>
            <p>Acesse a central de ferramentas administrativas do sistema.</p>
          </div>
          <span className="dashboard__action-cta">Acessar →</span>
        </button>
      </section>
    </div>
  )
}

export default UserProfilePage

