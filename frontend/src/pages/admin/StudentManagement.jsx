import { useState, useEffect, useCallback, useRef } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './StudentManagement.css'

// ─── Collapsible Tree Node ──────────────────────────────────────────────────
function TreeNode({ label, icon, count, active, onClick, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    const hasChildren = !!children

    return (
        <div className="tree-node">
            <button
                className={`tree-item ${active ? 'active' : ''}`}
                onClick={() => { if (hasChildren) setOpen(o => !o); onClick?.() }}
            >
                <span className="tree-item-left">
                    {hasChildren && <span className={`tree-chevron ${open ? 'open' : ''}`}>›</span>}
                    {!hasChildren && <span className="tree-dot" />}
                    <span className="tree-icon">{icon}</span>
                    <span className="tree-label">{label}</span>
                </span>
                {count != null && <span className="tree-count">{count}</span>}
            </button>
            {hasChildren && open && (
                <div className="tree-children">{children}</div>
            )}
        </div>
    )
}

// ─── Filter Sidebar ─────────────────────────────────────────────────────────
function FilterSidebar({ activeFilter, onFilter }) {
    const [majors, setMajors] = useState([])
    const [depts, setDepts] = useState({})       // { majorId: [...] }
    const [years, setYears] = useState({})       // { deptId: [...] }
    const [sections, setSections] = useState({}) // { yearId: [...] }

    useEffect(() => {
        apiClient.get('/admin/majors').then(r => setMajors(r.data))
    }, [])

    const loadDepts = (majorId) => {
        if (depts[majorId]) return
        apiClient.get(`/admin/departments?major_id=${majorId}`).then(r =>
            setDepts(p => ({ ...p, [majorId]: r.data }))
        )
    }

    const loadYears = (deptId) => {
        if (years[deptId]) return
        apiClient.get(`/admin/academic-years?department_id=${deptId}`).then(r =>
            setYears(p => ({ ...p, [deptId]: r.data }))
        )
    }

    const loadSections = (yearId) => {
        if (sections[yearId]) return
        apiClient.get(`/admin/sections?academic_year_id=${yearId}`).then(r =>
            setSections(p => ({ ...p, [yearId]: r.data }))
        )
    }

    return (
        <aside className="student-filter-sidebar">
            <div className="filter-sidebar-header">
                <span className="filter-sidebar-title">🏛️ Filter by Batch</span>
                {activeFilter.label && (
                    <button className="filter-clear-btn" onClick={() => onFilter({})}>Clear ✕</button>
                )}
            </div>

            <TreeNode
                label="All Students"
                icon="👥"
                active={!activeFilter.label}
                onClick={() => onFilter({})}
            />

            <div className="filter-sidebar-divider" />

            {majors.map(major => (
                <TreeNode
                    key={major.id}
                    label={major.name}
                    icon="🎓"
                    active={activeFilter.major_id === major.id && !activeFilter.department_id}
                    onClick={() => {
                        loadDepts(major.id)
                        onFilter({ major_id: major.id, label: major.name })
                    }}
                >
                    {(depts[major.id] || []).map(dept => (
                        <TreeNode
                            key={dept.id}
                            label={dept.name}
                            icon="📐"
                            active={activeFilter.department_id === dept.id && !activeFilter.section_id}
                            onClick={() => {
                                loadYears(dept.id)
                                onFilter({ major_id: major.id, department_id: dept.id, label: `${major.name} › ${dept.name}` })
                            }}
                        >
                            {(years[dept.id] || []).map(yr => (
                                <TreeNode
                                    key={yr.id}
                                    label={`Year ${yr.year_number}`}
                                    icon="📅"
                                    onClick={() => {
                                        loadSections(yr.id)
                                        onFilter({ major_id: major.id, department_id: dept.id, label: `${dept.name} › Year ${yr.year_number}` })
                                    }}
                                >
                                    {(sections[yr.id] || []).map(sec => (
                                        <TreeNode
                                            key={sec.id}
                                            label={sec.name}
                                            icon="🏷️"
                                            active={activeFilter.section_id === sec.id}
                                            onClick={() => onFilter({
                                                section_id: sec.id,
                                                label: `${dept.name} › Year ${yr.year_number} › ${sec.name}`
                                            })}
                                        />
                                    ))}
                                </TreeNode>
                            ))}
                        </TreeNode>
                    ))}
                </TreeNode>
            ))}
        </aside>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function StudentManagement() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState({})
    const [search, setSearch] = useState('')
    const [createModal, setCreateModal] = useState(false)
    const [csvModal, setCsvModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)
    const PER = 12

    // For create/import modals
    const [form, setForm] = useState({ full_name: '', email: '', password: '' })
    const [csvLoading, setCsvLoading] = useState(false)
    const fileRef = useRef()
    const [cascade, setCascade] = useState({ major_id: '', dept_id: '', year_id: '', section_id: '' })
    const [majors, setMajors] = useState([])
    const [deptOpts, setDeptOpts] = useState([]); const [yearOpts, setYearOpts] = useState([]); const [sectionOpts, setSectionOpts] = useState([])

    // Fetch students whenever filter changes
    const fetchStudents = useCallback(() => {
        setLoading(true)
        const params = new URLSearchParams({ role: 'student' })
        if (activeFilter.section_id) params.set('section_id', activeFilter.section_id)
        else if (activeFilter.department_id) params.set('department_id', activeFilter.department_id)
        else if (activeFilter.major_id) params.set('major_id', activeFilter.major_id)
        apiClient.get(`/admin/users?${params}`).then(r => setStudents(r.data)).finally(() => setLoading(false))
    }, [activeFilter])

    useEffect(() => { fetchStudents() }, [fetchStudents])

    // Cascade loaders for modals
    useEffect(() => { if (createModal || csvModal) apiClient.get('/admin/majors').then(r => setMajors(r.data)) }, [createModal, csvModal])
    useEffect(() => { cascade.major_id ? apiClient.get(`/admin/departments?major_id=${cascade.major_id}`).then(r => setDeptOpts(r.data)) : setDeptOpts([]) }, [cascade.major_id])
    useEffect(() => { cascade.dept_id ? apiClient.get(`/admin/academic-years?department_id=${cascade.dept_id}`).then(r => setYearOpts(r.data)) : setYearOpts([]) }, [cascade.dept_id])
    useEffect(() => { cascade.year_id ? apiClient.get(`/admin/sections?academic_year_id=${cascade.year_id}`).then(r => setSectionOpts(r.data)) : setSectionOpts([]) }, [cascade.year_id])

    const handleFilter = (f) => { setActiveFilter(f); setPage(1); setSearch('') }

    const handleCreate = async () => {
        if (!cascade.section_id) return alert('Please select a section.')
        setSaving(true)
        try {
            await apiClient.post('/admin/users/student', {
                ...form, section_id: cascade.section_id,
                academic_year_id: cascade.year_id, department_id: cascade.dept_id, major_id: cascade.major_id
            })
            fetchStudents(); setCreateModal(false)
            setForm({ full_name: '', email: '', password: '' })
            setCascade({ major_id: '', dept_id: '', year_id: '', section_id: '' })
        } catch (e) { alert(e.response?.data?.detail || 'Error') }
        finally { setSaving(false) }
    }

    const handleCSVUpload = async (e) => {
        if (!cascade.section_id) return alert('Please select a section first.')
        const file = e.target.files[0]; if (!file) return
        const text = await file.text()
        const rows = text.split('\n').slice(1).filter(Boolean).map(r => {
            const [full_name, email, password] = r.split(',')
            return { full_name: full_name?.trim(), email: email?.trim(), password: password?.trim(), section_id: cascade.section_id, academic_year_id: cascade.year_id, department_id: cascade.dept_id, major_id: cascade.major_id }
        })
        if (!rows.length) return alert('No valid rows.')
        setCsvLoading(true)
        try {
            await apiClient.post('/admin/users/students/bulk', { students: rows })
            fetchStudents(); setCsvModal(false)
            setCascade({ major_id: '', dept_id: '', year_id: '', section_id: '' })
        } catch (e) { alert('Import failed: ' + (e.response?.data?.detail || 'error')) }
        finally { setCsvLoading(false); e.target.value = '' }
    }

    const handlePromote = async (id) => {
        if (!confirm('Promote student to next year?')) return
        await apiClient.patch(`/admin/users/${id}/promote`); fetchStudents()
    }

    const handleDeactivate = async (id) => {
        if (!confirm('Deactivate this student?')) return
        await apiClient.patch(`/admin/users/${id}/deactivate`); fetchStudents()
    }

    // Search filtering (client-side on current result set)
    const filtered = search
        ? students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()))
        : students
    const paged = filtered.slice((page - 1) * PER, page * PER)

    const columns = [
        { key: 'full_name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.full_name}</span> },
        { key: 'email', label: 'Email', render: r => <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>{r.email || '—'}</span> },
        {
            key: 'batch', label: 'Batch', render: r => (
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                    {r.major?.name && <Badge variant="secondary">{r.major.name}</Badge>}
                    {r.department?.name && <Badge variant="default">{r.department.name}</Badge>}
                    {r.academic_year?.year_number && <Badge variant="warning">Yr {r.academic_year.year_number}</Badge>}
                    {r.section?.name && <Badge variant="success">{r.section.name}</Badge>}
                </div>
            )
        },
        { key: 'status', label: 'Status', render: r => <Badge variant={r.status === 'active' ? 'success' : 'danger'}>{r.status}</Badge> },
        {
            key: 'actions', label: '', render: r => (
                <div className="actions-cell">
                    <button className="action-btn" onClick={() => handlePromote(r.id)}>Promote</button>
                    {r.status === 'active' && <button className="action-btn danger" onClick={() => handleDeactivate(r.id)}>Deactivate</button>}
                </div>
            )
        },
    ]

    const CascadeSelector = () => (
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--clr-border)' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>Select the target academic batch for this student.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                    { label: '1. Major', value: cascade.major_id, opts: majors, disabled: false, labelFn: m => m.name, onChange: v => setCascade({ major_id: v, dept_id: '', year_id: '', section_id: '' }) },
                    { label: '2. Department', value: cascade.dept_id, opts: deptOpts, disabled: !cascade.major_id, labelFn: d => d.name, onChange: v => setCascade(p => ({ ...p, dept_id: v, year_id: '', section_id: '' })) },
                    { label: '3. Academic Year', value: cascade.year_id, opts: yearOpts, disabled: !cascade.dept_id, labelFn: y => `Year ${y.year_number}`, onChange: v => setCascade(p => ({ ...p, year_id: v, section_id: '' })) },
                    { label: '4. Section', value: cascade.section_id, opts: sectionOpts, disabled: !cascade.year_id, labelFn: s => s.name, onChange: v => setCascade(p => ({ ...p, section_id: v })) },
                ].map(({ label, value, opts, disabled, labelFn, onChange }) => (
                    <div key={label} className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">{label}</label>
                        <select className="input-field" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
                            <option value="">Select…</option>
                            {opts.map(o => <option key={o.id} value={o.id}>{labelFn(o)}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div>
                        <h1>Student Management</h1>
                        <p>Filter by batch, search, and manage students</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                        <Button variant="secondary" onClick={() => { setCascade({ major_id: '', dept_id: '', year_id: '', section_id: '' }); setCsvModal(true) }}>📄 Import CSV</Button>
                        <Button onClick={() => { setCascade({ major_id: '', dept_id: '', year_id: '', section_id: '' }); setCreateModal(true) }}>+ Add Student</Button>
                    </div>
                </div>

                <div className="student-management-layout">
                    {/* Left Filter Sidebar */}
                    <FilterSidebar activeFilter={activeFilter} onFilter={handleFilter} />

                    {/* Right Content Area */}
                    <div className="student-content-area">
                        {/* Active Filter + Search Bar */}
                        <div className="student-toolbar">
                            {activeFilter.label && (
                                <div className="active-filter-chip">
                                    <span>🔍 {activeFilter.label}</span>
                                    <button onClick={() => handleFilter({})}>✕</button>
                                </div>
                            )}
                            <input
                                className="student-search"
                                placeholder="Search by name or email…"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1) }}
                            />
                        </div>

                        {/* Stats row */}
                        <div className="student-stats-row">
                            <span className="student-count-label">
                                {loading ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}${activeFilter.label ? ` in ${activeFilter.label}` : ' total'}`}
                            </span>
                        </div>

                        {/* Table */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <Table
                                columns={columns}
                                data={paged}
                                page={page}
                                totalPages={Math.ceil(filtered.length / PER)}
                                onPageChange={setPage}
                                emptyMessage={loading ? 'Loading students…' : activeFilter.label ? `No students in ${activeFilter.label}.` : 'No students yet.'}
                            />
                        </div>
                    </div>
                </div>

                {/* Add Student Modal */}
                <Modal open={createModal} title="Add Student" onClose={() => setCreateModal(false)} onConfirm={handleCreate} loading={saving} disabled={!cascade.section_id}>
                    <CascadeSelector />
                    <Input label="Full Name" placeholder="Jane Doe" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                    <Input label="Email" type="email" placeholder="jane@university.edu" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                    <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </Modal>

                {/* CSV Import Modal */}
                <Modal open={csvModal} title="Import Students (CSV)" onClose={() => setCsvModal(false)} onConfirm={() => fileRef.current?.click()} confirmText="Select CSV File" loading={csvLoading} disabled={!cascade.section_id}>
                    <CascadeSelector />
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--clr-surface-high)', border: '1px dashed var(--clr-border)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--clr-text)' }}>CSV Format:</strong><br />
                        <code style={{ color: 'var(--clr-accent)' }}>full_name, email, password</code><br />
                        <em>First row = headers. Section is set by the selector above.</em>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
                </Modal>
            </main>
        </div>
    )
}
