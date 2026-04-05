import { useState, useEffect } from 'react'
import DigestPreview from './DigestPreview'
import MemberManager from './MemberManager'

const TABS = [
  { id: 'settings', label: '⚙️ Settings' },
  { id: 'members', label: '👨‍👩‍👧 Members' },
  { id: 'preview', label: '👁 Preview' },
]

export default function AdminPanel({ user }) {
  const [tab, setTab] = useState('settings')
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { setSettings(data); setForm(data) })
  }, [])

  async function saveSettings(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) { setSettings(data); setMsg('✅ Settings saved!') }
    else setMsg(`❌ ${data.error}`)
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function sendTest() {
    if (!testEmail) return
    setLoading(true)
    const res = await fetch('/api/admin/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    const data = await res.json()
    setMsg(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`)
    setLoading(false)
    setTimeout(() => setMsg(''), 5000)
  }

  async function sendNow() {
    if (!confirm('Send the weekly digest to grandparents now?')) return
    setLoading(true)
    const res = await fetch('/api/admin/send-now', { method: 'POST' })
    const data = await res.json()
    setMsg(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`)
    setLoading(false)
    setTimeout(() => setMsg(''), 5000)
  }

  async function sendReminders() {
    setLoading(true)
    const res = await fetch('/api/admin/send-reminders', { method: 'POST' })
    const data = await res.json()
    setMsg(res.ok ? `✅ Reminders sent to ${data.sent} member(s)` : `❌ ${data.error}`)
    setLoading(false)
    setTimeout(() => setMsg(''), 5000)
  }

  if (!settings) return <div className="flex items-center justify-center py-20"><span className="text-4xl animate-pulse">⚙️</span></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-handwritten text-4xl text-earth-800">Admin Panel ⚙️</h1>
        <p className="text-earth-500 text-sm mt-1 font-serif">Manage the family hub</p>
      </div>

      {msg && (
        <div className={`rounded-xl p-3 text-sm mb-4 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-cream-200 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200
              ${tab === t.id ? 'bg-white shadow-sm text-brand-600' : 'text-earth-500 hover:text-earth-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="space-y-5">
          <form onSubmit={saveSettings} className="card p-5 space-y-4">
            <h2 className="font-handwritten text-2xl text-earth-700">Digest Settings</h2>

            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">
                Grandparent Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="grandma@example.com"
                value={form.grandparent_email || ''}
                onChange={e => setForm({...form, grandparent_email: e.target.value})}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">
                Digest Title
              </label>
              <input
                className="input"
                value={form.digest_title || ''}
                onChange={e => setForm({...form, digest_title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">
                  Send Day
                </label>
                <select className="input" value={form.send_day || 'sunday'} onChange={e => setForm({...form, send_day: e.target.value})}>
                  <option value="sunday">Sunday</option>
                  <option value="saturday">Saturday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">
                  Send Time (UTC)
                </label>
                <input
                  type="time"
                  className="input"
                  value={form.send_time || '09:00'}
                  onChange={e => setForm({...form, send_time: e.target.value})}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-12 h-6 rounded-full transition-colors duration-200 relative
                  ${form.reminder_enabled ? 'bg-brand-500' : 'bg-cream-300'}`}
                onClick={() => setForm({...form, reminder_enabled: !form.reminder_enabled})}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                  ${form.reminder_enabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className="font-serif text-earth-700">
                Send Friday reminders to members who haven't posted
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>

          {/* Send actions */}
          <div className="card p-5 space-y-4">
            <h2 className="font-handwritten text-2xl text-earth-700">Send Digest</h2>

            <div className="flex gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder="Test email address"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
              />
              <button onClick={sendTest} disabled={loading || !testEmail} className="btn-primary btn-sm whitespace-nowrap">
                Send Test
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={sendNow}
                disabled={loading || !settings.grandparent_email}
                className="btn-primary flex-1"
              >
                📨 Send Digest Now
              </button>
              <button
                onClick={sendReminders}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                📩 Send Reminders
              </button>
            </div>

            {!settings.grandparent_email && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                ⚠️ Set a grandparent email above to enable sending the digest.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && <MemberManager currentUserId={user.id} />}

      {/* Preview tab */}
      {tab === 'preview' && <DigestPreview />}
    </div>
  )
}
