import { useState, useRef } from 'react'

const WEATHER_OPTIONS = [
  { emoji: '☀️', label: 'Sunny' },
  { emoji: '⛅', label: 'Partly Cloudy' },
  { emoji: '☁️', label: 'Cloudy' },
  { emoji: '🌧️', label: 'Rainy' },
  { emoji: '❄️', label: 'Snowy' },
  { emoji: '🌪️', label: 'Stormy' },
  { emoji: '🌤️', label: 'Clear' },
  { emoji: '🌸', label: 'Spring' },
]

export default function PostUpdate({ user, onPosted }) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB')
      return
    }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) { setError('Please write something!'); return }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('text', text.trim())
    if (location) formData.append('location', location.trim())
    if (weather) formData.append('weather_emoji', weather)
    if (photo) formData.append('photo', photo)

    try {
      const res = await fetch('/api/updates', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to post update')
      } else {
        onPosted()
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const charLeft = 500 - text.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-handwritten text-4xl text-earth-800">Share Your Week ✏️</h1>
        <p className="text-earth-500 text-sm mt-1 font-serif italic">
          What would you like Grandma & Grandpa to know?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Text area */}
        <div className="card p-5">
          <label className="block font-handwritten text-xl text-earth-700 mb-3">
            What's been happening? 💬
          </label>
          <textarea
            className="input min-h-32 resize-none"
            placeholder="Tell the family about your week — the highlights, the little moments, whatever you'd like to share..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
          />
          <div className={`text-right text-xs mt-1 transition-colors ${charLeft < 50 ? 'text-red-400' : 'text-earth-400'}`}>
            {charLeft} characters left
          </div>
        </div>

        {/* Location */}
        <div className="card p-5">
          <label className="block font-handwritten text-xl text-earth-700 mb-3">
            Where are you? 📍 <span className="text-base text-earth-400">(optional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Tokyo, Japan"
            value={location}
            onChange={e => setLocation(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Weather picker */}
        <div className="card p-5">
          <label className="block font-handwritten text-xl text-earth-700 mb-3">
            How's the weather? <span className="text-base text-earth-400">(optional)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {WEATHER_OPTIONS.map(opt => (
              <button
                key={opt.emoji}
                type="button"
                onClick={() => setWeather(weather === opt.emoji ? '' : opt.emoji)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-150 active:scale-95
                  ${weather === opt.emoji
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-cream-300 hover:border-cream-400 bg-cream-50 hover:bg-cream-100'}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-xs text-earth-500 mt-1 font-semibold leading-tight text-center">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div className="card p-5">
          <label className="block font-handwritten text-xl text-earth-700 mb-3">
            Add a photo 📸 <span className="text-base text-earth-400">(optional)</span>
          </label>

          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); fileInputRef.current.value = '' }}
                className="absolute top-2 right-2 bg-white/90 text-earth-700 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-white transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-full border-2 border-dashed border-cream-300 rounded-xl p-8 text-center
                         hover:border-brand-500/40 hover:bg-cream-50 transition-all duration-200 group"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</div>
              <p className="text-earth-500 font-serif">Click to add a photo</p>
              <p className="text-earth-400 text-xs mt-1">JPG, PNG, GIF up to 5MB</p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '✨ Posting...' : 'Share with the family 💕'}
        </button>
      </form>
    </div>
  )
}
