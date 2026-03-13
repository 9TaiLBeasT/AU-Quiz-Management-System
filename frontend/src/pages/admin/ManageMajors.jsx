import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function ManageMajors() {
    const [majors, setMajors] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    const fetchMajors = useCallback(() => {
        setLoading(true)
        apiClient.get('/admin/majors').then(r => setMajors(r.data)).catch(() => { }).finally(() => setLoading(false))
    }, [])

    useEffect(() => { fetchMajors() }, [fetchMajors])

    const openAdd = () => { setEditing(null); setName(''); setModalOpen(true) }
    const openEdit = (m) => { setEditing(m); setName(m.name); setModalOpen(true) }

    const handleSave = async () => {
        if (!name.trim()) return
        setSaving(true)
        try {
            if (editing) await apiClient.put(`/admin/majors/${editing.id}`, { name })
            else await apiClient.post('/admin/majors', { name })
            fetchMajors(); setModalOpen(false)
        } catch (e) { alert(e.response?.data?.detail || 'Error saving major') }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this major? This will affect all related departments.')) return
        await apiClient.delete(`/admin/majors/${id}`); fetchMajors()
    }

    const paged = majors.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    const totalPages = Math.ceil(majors.length / PER_PAGE)

    const columns = [
        { key: 'name', label: 'Major Name' },
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
                    <div><h1>Manage Majors</h1><p>Programs offered by the university</p></div>
                    <Button onClick={openAdd}>+ Add Major</Button>
                </div>
                {loading ? <p>Loading...</p> : majors.length === 0 ? (
                    <EmptyState icon="🎓" title="No majors found" description="Add your first major to get started." action={<Button onClick={openAdd}>Add Major</Button>} />
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}
                <Modal open={modalOpen} title={editing ? 'Edit Major' : 'Add Major'} onClose={() => setModalOpen(false)} onConfirm={handleSave} confirmText="Save" loading={saving}>
                    <Input label="Major Name" placeholder="e.g. BTech, MTech" value={name} onChange={(e) => setName(e.target.value)} />
                </Modal>
            </main>
        </div>
    )
}
