import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function FacultyManagement() {
    const [faculty, setFaculty] = useState([])
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)
    const [createModal, setCreateModal] = useState(false)
    const [assignModal, setAssignModal] = useState(false)
    const [selectedFaculty, setSelectedFaculty] = useState(null)
    const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '' })

    // Cascade state for assignment
    const [cascade, setCascade] = useState({ major_id: '', dept_id: '', year_id: '', term_id: '', subject_id: '', section_id: '' })
    const [majors, setMajors] = useState([])
    const [deptOpts, setDeptOpts] = useState([])
    const [yearOpts, setYearOpts] = useState([])
    const [termOpts, setTermOpts] = useState([])
    const [subjectOpts, setSubjectOpts] = useState([])
    const [sectionOpts, setSectionOpts] = useState([])

    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(() => {
        setLoading(true)
        Promise.all([
            apiClient.get('/admin/users?role=faculty'),
            apiClient.get('/admin/faculty-assignments'),
        ]).then(([usersRes, assignRes]) => {
            setFaculty(usersRes.data)
            setAssignments(assignRes.data)
        }).finally(() => setLoading(false))
    }, [])
    useEffect(() => { fetchData() }, [fetchData])

    // Cascade data fetching
    useEffect(() => {
        if (assignModal) apiClient.get('/admin/majors').then(r => setMajors(r.data))
    }, [assignModal])

    useEffect(() => {
        if (cascade.major_id) apiClient.get(`/admin/departments?major_id=${cascade.major_id}`).then(r => setDeptOpts(r.data))
        else setDeptOpts([])
    }, [cascade.major_id])

    useEffect(() => {
        if (cascade.dept_id) apiClient.get(`/admin/academic-years?department_id=${cascade.dept_id}`).then(r => setYearOpts(r.data))
        else setYearOpts([])
    }, [cascade.dept_id])

    useEffect(() => {
        if (cascade.year_id) {
            apiClient.get(`/admin/terms?academic_year_id=${cascade.year_id}`).then(r => setTermOpts(r.data))
            apiClient.get(`/admin/sections?academic_year_id=${cascade.year_id}`).then(r => setSectionOpts(r.data))
        } else {
            setTermOpts([]); setSectionOpts([])
        }
    }, [cascade.year_id])

    useEffect(() => {
        if (cascade.term_id) apiClient.get(`/admin/subjects?term_id=${cascade.term_id}`).then(r => setSubjectOpts(r.data))
        else setSubjectOpts([])
    }, [cascade.term_id])

    const openAssign = (fac) => {
        setSelectedFaculty(fac)
        setCascade({ major_id: '', dept_id: '', year_id: '', term_id: '', subject_id: '', section_id: '' })
        setAssignModal(true)
    }


    const handleCreate = async () => {
        if (!createForm.full_name || !createForm.email || !createForm.password) return
        setSaving(true)
        try {
            await apiClient.post('/admin/users/faculty', createForm)
            fetchData(); setCreateModal(false); setCreateForm({ full_name: '', email: '', password: '' })
        } catch (e) { alert(e.response?.data?.detail || 'Error creating faculty') }
        finally { setSaving(false) }
    }

    const handleAssign = async () => {
        if (!selectedFaculty || !cascade.subject_id || !cascade.section_id) return
        setSaving(true)
        try {
            await apiClient.post('/admin/faculty-assignments', {
                faculty_id: selectedFaculty.id,
                subject_id: cascade.subject_id,
                section_id: cascade.section_id
            })
            fetchData()
            setAssignModal(false)
        } catch (e) { alert(e.response?.data?.detail || 'Error assigning') }
        finally { setSaving(false) }
    }

    const handleUnassign = async (assignmentId) => {
        if (!confirm('Remove this assignment?')) return
        try {
            await apiClient.delete(`/admin/faculty-assignments/${assignmentId}`)
            fetchData()
        } catch (e) { alert(e.response?.data?.detail || 'Error removing assignment') }
    }

    const handleDeactivate = async (id) => {
        if (!confirm('Deactivate this faculty member?')) return
        await apiClient.patch(`/admin/users/${id}/deactivate`); fetchData()
    }

    const PER = 10
    const paged = faculty.slice((page - 1) * PER, page * PER)

    const columns = [
        { key: 'full_name', label: 'Name' },
        { key: 'email', label: 'Email', render: r => <span style={{ color: 'var(--clr-text-muted)' }}>{r.email}</span> },
        {
            key: 'assignments',
            label: 'Assigned Classes',
            render: r => {
                const facAssignments = assignments.filter(a => a.faculty_id === r.id)
                if (facAssignments.length === 0) return <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>No classes assigned</span>
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {facAssignments.map(a => (
                            <div key={a.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                background: 'var(--clr-surface-high)', padding: '0.25rem 0.5rem',
                                borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--clr-border)'
                            }}>
                                <span>📚 {a.subject?.name}</span>
                                <span style={{ color: 'var(--clr-text-muted)' }}>•</span>
                                <span>👥 {a.section?.name}</span>
                                <button
                                    onClick={() => handleUnassign(a.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--clr-danger)', cursor: 'pointer', marginLeft: '0.25rem' }}
                                    title="Remove assignment"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }
        },
        { key: 'status', label: 'Status', render: r => <Badge variant={r.status === 'active' ? 'success' : 'default'}>{r.status}</Badge> },
        {
            key: 'actions', label: 'Actions', render: r => (
                <div className="actions-cell">
                    <button className="action-btn" onClick={() => openAssign(r)}>+ Add Class</button>
                    {r.status === 'active' && <button className="action-btn danger" onClick={() => handleDeactivate(r.id)}>Deactivate</button>}
                </div>
            )
        },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Faculty Management</h1><p>Create and manage faculty accounts and assignments</p></div>
                    <Button onClick={() => setCreateModal(true)}>+ Create Faculty</Button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(faculty.length / PER)} onPageChange={setPage} emptyMessage="No faculty created yet." />
                    </div>
                )}

                {/* Create Faculty Modal */}
                <Modal open={createModal} title="Create Faculty Account" onClose={() => setCreateModal(false)} onConfirm={handleCreate} confirmText="Create" loading={saving}>
                    <Input label="Full Name" placeholder="Dr. John Smith" value={createForm.full_name} onChange={e => setCreateForm(p => ({ ...p, full_name: e.target.value }))} />
                    <Input label="Email" type="email" placeholder="john@university.edu" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                    <Input label="Temporary Password" type="password" placeholder="Min 8 characters" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                </Modal>

                {/* Assign Faculty Modal (Cascading) */}
                <Modal open={assignModal} title={`Assign — ${selectedFaculty?.full_name}`} onClose={() => setAssignModal(false)} onConfirm={handleAssign} confirmText="Assign" loading={saving} disabled={!cascade.subject_id || !cascade.section_id}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                        Pinpoint the exact subject and section you want to assign to this faculty member.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">1. Major</label>
                            <select className="input-field" value={cascade.major_id} onChange={e => setCascade({ major_id: e.target.value, dept_id: '', year_id: '', term_id: '', subject_id: '', section_id: '' })}>
                                <option value="">Select Major</option>
                                {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">2. Department</label>
                            <select className="input-field" value={cascade.dept_id} onChange={e => setCascade(p => ({ ...p, dept_id: e.target.value, year_id: '', term_id: '', subject_id: '', section_id: '' }))} disabled={!cascade.major_id}>
                                <option value="">Select Department</option>
                                {deptOpts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">3. Academic Year</label>
                        <select className="input-field" value={cascade.year_id} onChange={e => setCascade(p => ({ ...p, year_id: e.target.value, term_id: '', subject_id: '', section_id: '' }))} disabled={!cascade.dept_id}>
                            <option value="">Select Year</option>
                            {yearOpts.map(y => <option key={y.id} value={y.id}>Year {y.year_number}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--clr-border)' }}>
                        <div>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label className="input-label">4. Term</label>
                                <select className="input-field" value={cascade.term_id} onChange={e => setCascade(p => ({ ...p, term_id: e.target.value, subject_id: '' }))} disabled={!cascade.year_id}>
                                    <option value="">Select Term</option>
                                    {termOpts.map(t => <option key={t.id} value={t.id}>Term {t.term_number}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">5. Subject</label>
                                <select className="input-field" value={cascade.subject_id} onChange={e => setCascade(p => ({ ...p, subject_id: e.target.value }))} disabled={!cascade.term_id}>
                                    <option value="">Select Subject</option>
                                    {subjectOpts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="input-group">
                                <label className="input-label">6. Class Section</label>
                                <select className="input-field" value={cascade.section_id} onChange={e => setCascade(p => ({ ...p, section_id: e.target.value }))} disabled={!cascade.year_id}>
                                    <option value="">Select Section</option>
                                    {sectionOpts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    )
}
