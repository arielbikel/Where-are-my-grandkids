import { useState, useEffect } from 'react'

const EMOJI_OPTIONS = ['👤','👦','👧','🧒','👱','👱‍♀️','👨','👩','🧔','👴','👵','👶','🧑','👮','🧑‍🍳','🧑‍🎤','🧑‍🎨','🧑‍🏫','🧑‍🌾','🧑‍🔬','🧑‍💻','🧑‍🚀','🏃','🧘']
const COLOR_OPTIONS = ['#E11D48','#DB2777','#9333EA','#7C3AED','#4F46E5','#2563EB','#0891B2','#059669','#65A30D','#CA8A04','#D97706','#EA580C','#DC2626','#6B7280']

export default function MemberManager({ currentUserId }) {
  const [members, setMembers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPin, setNewPin] = useState('')
  const [form, setForm] = useState({ name: '', emoji: '👤', color: '#7C3AED', email: '', pin: '', role: 'member', birthday: '' })
  const [msg, setMsg] = useState('')

  async function loadMembers() {
    const res = await fetch('/api/admin/members')
    if (res.ok) setMembers(await res.json())
  }

  useEffect(() => { loadMembers() }, [])

  async function addMember(e) {
    e.preventDefault()
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`✅ ${data.name} added!`)
      setShowAdd(false)
      setForm({ name: '', emoji: '👤', color: '#7C3AED', email: '', pin: '', role: 'member', birthday: '' })
      loadMembers()
    } else {
      setMsg(`❌ ${data.error}`)
    }
  }

  async function removeMember(id, name) {
    if (!confirm(`Remove ${name} from the family hub?`)) return
    const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' })
    if (res.ok) { setMsg(`✅ ${name} removed`); loadMembers() }
  }

  async function resetPin(id) {
    if (!newPin || !/^\d{4}$/.test(newPin)) { setMsg('❌ PIN must be 4 digits'); return }
    const res = await fetch(`/api/admin/members/${id}/reset-pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    })
    if (res.ok) { setMsg('✅ PIN updated'); setResetTarget(null); setNewPin('') }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-xl p-3 text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-handwritten text-2xl text-earth-700">Family Members ({members.length})</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary btn-sm">
          {showAdd ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addMember} className="card p-5 space-y-4">
          <h3 className="font-handwritten text-xl text-earth-700">New Member</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">PIN (4 digits) *</label>
              <input className="input" maxLength={4} pattern="\d{4}" value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">Email (for reminders)</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-2">Emoji Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button key={em} type="button" onClick={() => setForm({...form, emoji: em})}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all
                    ${form.emoji === em ? 'ring-2 ring-brand-500 bg-brand-50' : 'hover:bg-cream-200'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-2">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-earth-700 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">Birthday</label>
              <input type="date" className="input" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">Add to the family 💕</button>
        </form>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="card p-4 flex items-center gap-3">
            <div className="avatar text-2xl" style={{ backgroundColor: m.color + '20', border: `2px solid ${m.color}40` }}>
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-earth-800">{m.name}</span>
                {m.role === 'admin' && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
              </div>
              {m.email && <span className="text-xs text-earth-400">{m.email}</span>}
              {m.birthday && (
                <span className="text-xs text-earth-400 ml-2">🎂 {new Date(m.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              )}
            </div>

            {resetTarget === m.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="input w-24 py-1 text-center"
                  placeholder="New PIN"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                />
                <button onClick={() => resetPin(m.id)} className="btn-primary btn-sm">Save</button>
                <button onClick={() => setResetTarget(null)} className="btn-secondary btn-sm">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setResetTarget(m.id); setNewPin('') }}
                  className="btn-secondary btn-sm text-xs"
                >
                  Reset PIN
                </button>
                {m.id !== currentUserId && (
                  <button
                    onClick={() => removeMember(m.id, m.name)}
                    className="btn-sm px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-xs transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
