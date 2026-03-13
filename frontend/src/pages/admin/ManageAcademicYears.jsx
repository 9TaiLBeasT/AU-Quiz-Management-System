import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function ManageAcademicYears() {
    const [items, setItems] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ year_number: '', department_id: '' })
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(() => {
        setLoading(true)
        Promise.all([apiClient.get('/admin/academic-years'), apiClient.get('/admin/departments')])
            .then(([y, d]) => { setItems(y.data); setDepartments(d.data) })
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { fetchData() }, [fetchData])

    const openAdd = () => { setEditing(null); setForm({ year_number: '', department_id: '' }); setModalOpen(true) }
    const openEdit = (i) => { setEditing(i); setForm({ year_number: i.year_number, department_id: i.department_id }); setModalOpen(true) }

    const handleSave = async () => {
        setSaving(true)
        try {
            if (editing) await apiClient.put(`/admin/academic-years/${editing.id}`, form)
            else await apiClient.post('/admin/academic-years', form)
            fetchData(); setModalOpen(false)
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete?')) return
        await apiClient.delete(`/admin/academic-years/${id}`); fetchData()
    }

    const getDeptName = (id) => departments.find(d => d.id === id)?.name || '—'

    const columns = [
        { key: 'year_number', label: 'Year' },
        { key: 'department_id', label: 'Department', render: (r) => getDeptName(r.department_id) },
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
                    <div><h1>Academic Years</h1><p>Year levels per department</p></div>
                    <Button onClick={openAdd}>+ Add Year</Button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={items} emptyMessage="No academic years yet." />
                    </div>
                )}
                <Modal open={modalOpen} title={editing ? 'Edit Year' : 'Add Academic Year'} onClose={() => setModalOpen(false)} onConfirm={handleSave} loading={saving}>
                    <Input label="Year Number" type="number" min={1} max={4} placeholder="1–4" value={form.year_number} onChange={e => setForm(p => ({ ...p, year_number: e.target.value }))} />
                    <div className="input-group">
                        <label className="input-label">Department</label>
                        <select className="input-field" value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </Modal>
            </main>
        </div>
    )
}
