import { useState, useEffect } from 'react'

export default function MyHistory({ user }) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/updates/mine')
      .then(r => r.json())
      .then(data => { setUpdates(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-4xl animate-pulse">📖</span>
      </div>
    )
  }

  // Group by month
  const grouped = updates.reduce((acc, u) => {
    const key = new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-handwritten text-4xl text-earth-800">My Updates 📖</h1>
        <p className="text-earth-500 text-sm mt-1 font-serif">Your personal family diary</p>
      </div>

      {updates.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="font-handwritten text-2xl text-earth-600 mb-2">No updates yet</h2>
          <p className="text-earth-500 font-serif">Your updates will appear here once you start posting!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthUpdates]) => (
            <div key={month}>
              <h2 className="font-handwritten text-2xl text-earth-600 mb-3 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-cream-300 rounded" />
                {month}
                <span className="w-8 h-0.5 bg-cream-300 rounded" />
              </h2>
              <div className="space-y-4">
                {monthUpdates.map(update => (
                  <div key={update.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {update.weather_emoji && <span className="text-xl">{update.weather_emoji}</span>}
                        {update.location && (
                          <span className="text-sm text-earth-500">📍 {update.location}</span>
                        )}
                      </div>
                      <span className="text-xs text-earth-400">
                        {new Date(update.created_at).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="font-serif text-earth-700 leading-relaxed whitespace-pre-wrap">{update.text}</p>
                    {update.photo_path && (
                      <img
                        src={update.photo_path}
                        alt="Your photo"
                        className="w-full rounded-xl mt-3 max-h-64 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
