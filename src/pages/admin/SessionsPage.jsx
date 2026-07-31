import { useState } from 'react'
import { sessionsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Badge, Button, Card, Field, Input, Loading, Modal, PageHeader } from '@/components/ui'

export function SessionsPage() {
  const { data, loading, reload } = useAsync(() => sessionsApi.list({ size: 50 }).then((p) => p.content), [])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })
  const [terms, setTerms] = useState([])
  const [selected, setSelected] = useState(null)
  const [termActionId, setTermActionId] = useState(null)

  const activeSession = data?.find((s) => s.isActive)

  const handleCreate = async (e) => {
    e.preventDefault()
    await sessionsApi.create(form)
    setOpen(false)
    reload()
  }

  const loadTerms = async (id) => {
    setSelected(id)
    const t = await sessionsApi.terms(id)
    setTerms(t)
  }

  const activateSession = async (id) => {
    await sessionsApi.activate(id)
    reload()
    if (selected === id) {
      await loadTerms(id)
    }
  }

  const activateTerm = async (sessionId, termId) => {
    setTermActionId(termId)
    try {
      await sessionsApi.activateTerm(sessionId, termId)
      await loadTerms(sessionId)
    } finally {
      setTermActionId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Academic Sessions" actions={<Button onClick={() => setOpen(true)}>New session</Button>} />
      <p className="mb-4 text-sm text-muted">
        Each new session automatically gets First Term, Second Term, and Third Term.
        The active term applies to all teachers system-wide.
      </p>
      {loading ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between">
                <h3 className="font-semibold">{s.name}</h3>
                {s.isActive && <Badge tone="success">Active</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{s.startDate} → {s.endDate}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => loadTerms(s.id)}>View terms</Button>
                {!s.isActive && <Button size="sm" onClick={() => activateSession(s.id)}>Activate</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {selected && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-1">Terms (3 per session)</h3>
          {activeSession?.id === selected ? (
            <p className="mb-3 text-sm text-muted">
              Activate the term teachers should use for grades, results, and exam timetables.
            </p>
          ) : (
            <p className="mb-3 text-sm text-muted">
              Activate this session first before changing its active term.
            </p>
          )}
          <ul className="space-y-2 text-sm">
            {terms.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span>{t.name}</span>
                {t.isActive && <Badge tone="success">Active</Badge>}
                {activeSession?.id === selected && !t.isActive && (
                  <Button
                    size="sm"
                    disabled={termActionId === t.id}
                    onClick={() => activateTerm(selected, t.id)}
                  >
                    {termActionId === t.id ? 'Activating…' : 'Activate'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New session">
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Start"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></Field>
          <Field label="End"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></Field>
          <p className="text-sm text-muted">First, Second, and Third Term will be created automatically.</p>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  )
}
