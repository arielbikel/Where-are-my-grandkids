import { useState, useEffect } from 'react'

export default function LoginScreen({ onLogin }) {
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selected.id, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid PIN')
        setPin('')
      } else {
        onLogin(data)
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🏠</div>
        <h1 className="font-handwritten text-5xl text-brand-600 mb-2">The Family Hub</h1>
        <p className="text-earth-500 font-serif text-lg italic">
          Keeping grandma & grandpa in the loop 💕
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {!selected ? (
          /* Member grid */
          <div className="card p-6">
            <h2 className="font-handwritten text-3xl text-earth-700 text-center mb-5">
              Who are you?
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => { setSelected(member); setPin(''); setError('') }}
                  className="flex flex-col items-center p-4 rounded-2xl transition-all duration-200
                             hover:scale-105 active:scale-95 hover:shadow-md border-2 border-transparent
                             hover:border-opacity-50 bg-cream-50 hover:bg-white"
                  style={{ '--tw-hover-border-color': member.color }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2 shadow-sm"
                    style={{ backgroundColor: member.color + '25', border: `2px solid ${member.color}40` }}
                  >
                    {member.emoji}
                  </div>
                  <span className="font-serif text-sm text-earth-700 text-center leading-tight font-semibold">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PIN entry */
          <div className="card p-8 max-w-sm mx-auto">
            <button
              onClick={() => { setSelected(null); setPin(''); setError('') }}
              className="text-earth-500 hover:text-earth-700 mb-6 flex items-center gap-2 text-sm transition-colors"
            >
              ← Back
            </button>

            <div className="text-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-md"
                style={{ backgroundColor: selected.color + '25', border: `3px solid ${selected.color}` }}
              >
                {selected.emoji}
              </div>
              <h2 className="font-handwritten text-3xl text-earth-700">
                Hi, {selected.name}! 👋
              </h2>
              <p className="text-earth-500 text-sm mt-1">Enter your 4-digit PIN</p>
            </div>

            <form onSubmit={handleLogin}>
              {/* PIN dots display */}
              <div className="flex justify-center gap-3 mb-4">
                {[0,1,2,3].map(i => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border-2 transition-all duration-150"
                    style={{
                      backgroundColor: pin.length > i ? selected.color : 'transparent',
                      borderColor: pin.length > i ? selected.color : '#EDD9C0',
                    }}
                  />
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={key === ''}
                    onClick={() => {
                      if (key === '⌫') setPin(p => p.slice(0, -1))
                      else if (typeof key === 'number' && pin.length < 4) setPin(p => p + key)
                      setError('')
                    }}
                    className={`h-14 rounded-xl text-xl font-semibold transition-all duration-150
                      ${key === '' ? 'invisible' : 'bg-cream-200 hover:bg-cream-300 active:scale-95 active:bg-cream-300'}
                      ${key === '⌫' ? 'text-earth-500' : 'text-earth-700'}`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4 || loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: selected.color }}
              >
                {loading ? '...' : 'Enter the Hub 🏠'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
