import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function ManageTerms() {
    const [items, setItems] = useState([])
    const [years, setYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ term_number: '', academic_year_id: '' })
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(() => {
        setLoading(true)
        Promise.all([apiClient.get('/admin/terms'), apiClient.get('/admin/academic-years')])
            .then(([t, y]) => { setItems(t.data); setYears(y.data) })
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { fetchData() }, [fetchData])

    const openAdd = () => { setEditing(null); setForm({ term_number: '', academic_year_id: '' }); setModalOpen(true) }
    const openEdit = (i) => { setEditing(i); setForm({ term_number: i.term_number, academic_year_id: i.academic_year_id }); setModalOpen(true) }

    const handleSave = async () => {
        setSaving(true)
        try {
            if (editing) await apiClient.put(`/admin/terms/${editing.id}`, form)
            else await apiClient.post('/admin/terms', form)
            fetchData(); setModalOpen(false)
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this term?')) return
        await apiClient.delete(`/admin/terms/${id}`); fetchData()
    }

    const getYearLabel = (id) => { const y = years.find(y => y.id === id); return y ? `Year ${y.year_number}` : '—' }

    const columns = [
        { key: 'term_number', label: 'Term', render: (r) => `Term ${r.term_number}` },
        { key: 'academic_year_id', label: 'Academic Year', render: (r) => getYearLabel(r.academic_year_id) },
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
                    <div><h1>Manage Terms</h1><p>Terms within each academic year</p></div>
                    <Button onClick={openAdd}>+ Add Term</Button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={items} emptyMessage="No terms yet." />
                    </div>
                )}
                <Modal open={modalOpen} title={editing ? 'Edit Term' : 'Add Term'} onClose={() => setModalOpen(false)} onConfirm={handleSave} loading={saving}>
                    <Input label="Term Number" type="number" min={1} max={4} placeholder="1–4" value={form.term_number} onChange={e => setForm(p => ({ ...p, term_number: e.target.value }))} />
                    <div className="input-group">
                        <label className="input-label">Academic Year</label>
                        <select className="input-field" value={form.academic_year_id} onChange={e => setForm(p => ({ ...p, academic_year_id: e.target.value }))}>
                            <option value="">Select Year</option>
                            {years.map(y => <option key={y.id} value={y.id}>Year {y.year_number}</option>)}
                        </select>
                    </div>
                </Modal>
            </main>
        </div>
    )
}
