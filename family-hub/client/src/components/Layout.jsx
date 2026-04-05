export default function Layout({ user, page, setPage, onLogout, children }) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  const navItems = [
    { id: 'feed', label: 'This Week', icon: '🌿' },
    { id: 'post', label: 'Post Update', icon: '✏️' },
    { id: 'history', label: 'My History', icon: '📖' },
    ...(user.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Top nav */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-cream-300 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-handwritten text-2xl text-brand-600">The Family Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: user.color + '25', border: `2px solid ${user.color}40` }}
              >
                {user.emoji}
              </div>
              <span className="text-sm font-semibold text-earth-700 hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-earth-500 hover:text-earth-700 transition-colors px-2 py-1 rounded-lg hover:bg-cream-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-300 z-30">
        <div className="max-w-3xl mx-auto flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200
                ${page === item.id
                  ? 'text-brand-600'
                  : 'text-earth-500 hover:text-earth-700'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
              {page === item.id && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
