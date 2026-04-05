import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import Layout from './components/Layout'
import PostUpdate from './components/PostUpdate'
import WeekFeed from './components/WeekFeed'
import MyHistory from './components/MyHistory'
import AdminPanel from './components/AdminPanel'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('feed')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🏠</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />
  }

  const renderPage = () => {
    switch (page) {
      case 'post': return <PostUpdate user={user} onPosted={() => setPage('feed')} />
      case 'history': return <MyHistory user={user} />
      case 'admin': return user.role === 'admin' ? <AdminPanel user={user} /> : null
      default: return <WeekFeed user={user} />
    }
  }

  return (
    <Layout user={user} page={page} setPage={setPage} onLogout={() => setUser(null)}>
      <div className="page-enter">
        {renderPage()}
      </div>
    </Layout>
  )
}
