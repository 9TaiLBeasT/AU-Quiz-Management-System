import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function ManageDepartments() {
    const [departments, setDepartments] = useState([])
    const [majors, setMajors] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', major_id: '' })
    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    const fetchData = useCallback(() => {
        setLoading(true)
        Promise.all([apiClient.get('/admin/departments'), apiClient.get('/admin/majors')])
            .then(([d, m]) => { setDepartments(d.data); setMajors(m.data) })
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { fetchData() }, [fetchData])

    const openAdd = () => { setEditing(null); setForm({ name: '', major_id: '' }); setModalOpen(true) }
    const openEdit = (d) => { setEditing(d); setForm({ name: d.name, major_id: d.major_id }); setModalOpen(true) }

    const handleSave = async () => {
        if (!form.name.trim() || !form.major_id) return
        setSaving(true)
        try {
            if (editing) await apiClient.put(`/admin/departments/${editing.id}`, form)
            else await apiClient.post('/admin/departments', form)
            fetchData(); setModalOpen(false)
        } catch (e) { alert(e.response?.data?.detail || 'Error') }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this department?')) return
        await apiClient.delete(`/admin/departments/${id}`); fetchData()
    }

    const getMajorName = (id) => majors.find(m => m.id === id)?.name || '—'
    const paged = departments.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const columns = [
        { key: 'name', label: 'Department' },
        { key: 'major_id', label: 'Major', render: (row) => getMajorName(row.major_id) },
        {
            key: 'actions', label: 'Actions', render: (row) => (
                <div className="actions-cell">
                    <button className="action-btn" onClick={() => openEdit(row)}>Edit</button>
                    <button className="action-btn danger" onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
            )
        },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Manage Departments</h1><p>Departments within each major</p></div>
                    <Button onClick={openAdd}>+ Add Department</Button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(departments.length / PER_PAGE)} onPageChange={setPage} emptyMessage="No departments yet." />
                    </div>
                )}
                <Modal open={modalOpen} title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setModalOpen(false)} onConfirm={handleSave} loading={saving}>
                    <Input label="Department Name" placeholder="e.g. CSE, AIML, DS" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    <div className="input-group">
                        <label className="input-label">Major</label>
                        <select className="input-field" value={form.major_id} onChange={e => setForm(p => ({ ...p, major_id: e.target.value }))}>
                            <option value="">Select Major</option>
                            {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </Modal>
            </main>
        </div>
    )
}
