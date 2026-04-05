import { useState, useEffect } from 'react'

const REACTION_EMOJIS = ['❤️', '😂', '🥰', '👏', '🎉']

function UpdateCard({ update, currentUserId, onReact }) {
  const dateStr = new Date(update.created_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div className="card overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Card header */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <div
          className="avatar text-2xl flex-shrink-0"
          style={{ backgroundColor: update.color + '20', border: `2px solid ${update.color}40` }}
        >
          {update.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-handwritten text-xl text-earth-800">{update.name}</span>
            <span className="text-xs text-earth-400 flex-shrink-0">{dateStr}</span>
          </div>
          {(update.location || update.weather_emoji) && (
            <div className="flex items-center gap-2 mt-0.5">
              {update.location && (
                <span className="text-xs text-earth-500">📍 {update.location}</span>
              )}
              {update.weather_emoji && (
                <span className="text-sm">{update.weather_emoji}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Update text */}
      <div className="px-4 pb-3">
        <p className="font-serif text-earth-700 leading-relaxed whitespace-pre-wrap">{update.text}</p>
      </div>

      {/* Photo */}
      {update.photo_path && (
        <div className="px-4 pb-3">
          <img
            src={update.photo_path}
            alt={`Photo from ${update.name}`}
            className="w-full rounded-xl object-cover max-h-80"
            loading="lazy"
          />
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 pb-3 border-t border-cream-200 pt-3 flex items-center gap-2 flex-wrap">
        {REACTION_EMOJIS.map(emoji => {
          const reaction = update.reactions?.find(r => r.emoji === emoji)
          const count = reaction?.count || 0
          const reacted = reaction?.reacted_by_me === 1
          return (
            <button
              key={emoji}
              onClick={() => onReact(update.id, emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all duration-150
                ${reacted
                  ? 'bg-brand-500/15 border border-brand-500/30 scale-105'
                  : 'bg-cream-100 border border-cream-300 hover:bg-cream-200'}`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-xs font-semibold text-earth-600">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function WeekFeed({ user }) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadUpdates() {
    const res = await fetch('/api/updates/week')
    if (res.ok) setUpdates(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadUpdates() }, [])

  async function handleReact(updateId, emoji) {
    const res = await fetch(`/api/updates/${updateId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (res.ok) loadUpdates()
  }

  const weekRange = (() => {
    const now = new Date()
    const day = now.getUTCDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setUTCDate(now.getUTCDate() - diff)
    return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-4xl animate-pulse">🌿</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-handwritten text-4xl text-earth-800">This Week's Updates 🌿</h1>
        <p className="text-earth-500 text-sm mt-1">Week of {weekRange}</p>
      </div>

      {updates.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="font-handwritten text-2xl text-earth-600 mb-2">It's quiet this week!</h2>
          <p className="text-earth-500 font-serif">Be the first to share an update with the family.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(update => (
            <UpdateCard
              key={update.id}
              update={update}
              currentUserId={user.id}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  )
}
