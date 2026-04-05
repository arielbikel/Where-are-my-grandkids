import { useState } from 'react'

export default function DigestPreview() {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadPreview() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/preview', { method: 'POST' })
      if (res.ok) {
        const text = await res.text()
        setHtml(text)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load preview')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-handwritten text-2xl text-earth-700">Email Preview</h2>
        <button onClick={loadPreview} disabled={loading} className="btn-primary btn-sm">
          {loading ? '...' : '👁 Load Preview'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">{error}</div>
      )}

      {html ? (
        <div className="border border-cream-300 rounded-xl overflow-hidden">
          <iframe
            srcDoc={html}
            title="Email Preview"
            className="w-full"
            style={{ height: '600px', border: 'none' }}
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        <div className="card p-10 text-center text-earth-400 font-serif">
          Click "Load Preview" to see how the email will look
        </div>
      )}
    </div>
  )
}
