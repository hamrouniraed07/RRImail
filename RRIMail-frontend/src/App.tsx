import { useEffect, useState } from 'react'
import DashboardPage from './app/dashboard/page'
import DispatcherPage from './app/dispatcher/page'
import InboxPage from './app/inbox/page'
import LoginPage from './app/login/page'

type PageView = 'dashboard' | 'dispatcher' | 'inbox'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [page, setPage] = useState<PageView>('dashboard')

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    setIsAuthenticated(Boolean(storedToken))
  }, [])

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  if (page === 'dispatcher') {
    return <DispatcherPage onBack={() => setPage('dashboard')} onNavigate={(target) => setPage(target)} />
  }

  if (page === 'inbox') {
    return <InboxPage onNavigate={(target) => setPage(target)} />
  }

  return <DashboardPage onNavigate={(target) => setPage(target)} />
}