import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import ExcelToPdfPage from './pages/ExcelToPdfPage'
import PdfAnalyticsPage from './pages/PdfAnalyticsPage'
import ManualFormPage from './pages/ManualFormPage'
import AiImprovementsPage from './pages/AiImprovementsPage'
import './App.css'

const companyProfile = {
  name: 'SC Solutions',
  cnpj: '12.345.678/0001-99',
  segment: 'Serviços de Certificação',
  contactEmail: 'dados@scsolutions.com.br',
  lastSync: '14/11/2025 09:45',
  operations: 482,
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage company={companyProfile} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/excel-pdf"
            element={
              <ProtectedRoute>
                <ExcelToPdfPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dados-pdfs"
            element={
              <ProtectedRoute>
                <PdfAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formulario-manual"
            element={
              <ProtectedRoute>
                <ManualFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/melhorias-ia"
            element={
              <ProtectedRoute>
                <AiImprovementsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
