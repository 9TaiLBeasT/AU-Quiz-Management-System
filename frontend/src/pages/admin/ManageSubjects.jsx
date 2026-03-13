import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function ManageSubjects() {
    const [items, setItems] = useState([])
    const [terms, setTerms] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', term_id: '' })
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(() => {
        setLoading(true)
        Promise.all([apiClient.get('/admin/subjects'), apiClient.get('/admin/terms')])
            .then(([s, t]) => { setItems(s.data); setTerms(t.data) })
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { fetchData() }, [fetchData])

    const openAdd = () => { setEditing(null); setForm({ name: '', term_id: '' }); setModalOpen(true) }
    const openEdit = (i) => { setEditing(i); setForm({ name: i.name, term_id: i.term_id }); setModalOpen(true) }

    const handleSave = async () => {
        if (!form.name || !form.term_id) return
        setSaving(true)
        try {
            if (editing) await apiClient.put(`/admin/subjects/${editing.id}`, form)
            else await apiClient.post('/admin/subjects', form)
            fetchData(); setModalOpen(false)
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return
        await apiClient.delete(`/admin/subjects/${id}`); fetchData()
    }

    const getTermLabel = (id) => { const t = terms.find(t => t.id === id); return t ? `Term ${t.term_number}` : '—' }

    const columns = [
        { key: 'name', label: 'Subject Name' },
        { key: 'term_id', label: 'Term', render: (r) => getTermLabel(r.term_id) },
        {
            key: 'actions', label: 'Actions', render: (r) => (
                <div className="actions-cell">
                    <button className="action-btn" onClick={() => openEdit(r)}>Edit</button>
                    <button className="action-btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
            )
        },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Manage Subjects</h1><p>Subjects under each term</p></div>
                    <Button onClick={openAdd}>+ Add Subject</Button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={items} emptyMessage="No subjects yet." />
                    </div>
                )}
                <Modal open={modalOpen} title={editing ? 'Edit Subject' : 'Add Subject'} onClose={() => setModalOpen(false)} onConfirm={handleSave} loading={saving}>
                    <Input label="Subject Name" placeholder="e.g. Data Structures" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    <div className="input-group">
                        <label className="input-label">Term</label>
                        <select className="input-field" value={form.term_id} onChange={e => setForm(p => ({ ...p, term_id: e.target.value }))}>
                            <option value="">Select Term</option>
                            {terms.map(t => <option key={t.id} value={t.id}>Term {t.term_number}</option>)}
                        </select>
                    </div>
                </Modal>
            </main>
        </div>
    )
}
