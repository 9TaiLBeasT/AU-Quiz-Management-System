import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './AcademicStructure.css'

/* ─── Delete confirm ────────────────────────────────────────── */
function DelBtn({ onDelete }) {
    const [ask, setAsk] = useState(false)
    if (ask) return (
        <span className="del-confirm" onClick={e => e.stopPropagation()}>
            Delete?
            <button className="del-yes" onClick={() => onDelete()}>Yes</button>
            <button className="del-no" onClick={() => setAsk(false)}>No</button>
        </span>
    )
    return (
        <button className="del-icon" onClick={e => { e.stopPropagation(); setAsk(true) }} title="Delete">
            ✕
        </button>
    )
}

/* ─── Inline add form ───────────────────────────────────────── */
function AddForm({ label, placeholder, type = 'text', min, max, onSave, onCancel, saving }) {
    const [val, setVal] = useState('')
    return (
        <form className="add-form" onSubmit={e => { e.preventDefault(); onSave(type === 'number' ? Number(val) : val) }}>
            <input
                autoFocus
                type={type}
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={placeholder}
                required
                min={min} max={max}
                className="add-form-input"
            />
            <button type="submit" className="add-form-save" disabled={saving}>{saving ? '…' : 'Add'}</button>
            <button type="button" className="add-form-cancel" onClick={onCancel}>✕</button>
        </form>
    )
}

/* ─── Generic side-panel ────────────────────────────────────── */
function Panel({ icon, title, tag, count, onAdd, children, empty, emptyIcon, emptyText }) {
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleAdd = async (val) => {
        setSaving(true)
        await onAdd(val)
        setSaving(false)
        setShowForm(false)
    }

    return (
        <div className="ac-col">
            <div className="ac-col-head">
                <div className="ac-col-title">
                    <span>{icon}</span>
                    <span>{title}</span>
                    {tag && <span className="ac-tag">{tag}</span>}
                    {typeof count === 'number' && <span className="ac-badge">{count}</span>}
                </div>
                <button className="ac-add-btn" onClick={() => setShowForm(true)}>+ Add</button>
            </div>
            {showForm && onAdd.form
                ? onAdd.form({ onCancel: () => setShowForm(false) })
                : showForm && (
                    <AddForm
                        placeholder={onAdd.placeholder}
                        type={onAdd.type}
                        min={onAdd.min}
                        max={onAdd.max}
                        onSave={handleAdd}
                        onCancel={() => setShowForm(false)}
                        saving={saving}
                    />
                )
            }
            <div className="ac-col-body">
                {children}
                {empty && (
                    <div className="ac-empty-state">
                        <div className="ac-empty-icon">{emptyIcon || '📭'}</div>
                        <div className="ac-empty-text">{emptyText || 'Nothing here yet'}</div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Single row item in a panel ───────────────────────────── */
function Item({ label, selected, onClick, onDelete }) {
    return (
        <div className={`ac-item ${selected ? 'ac-item--active' : ''}`} onClick={onClick}>
            <span className="ac-item-dot" />
            <span className="ac-item-label">{label}</span>
            {selected && <span className="ac-item-arrow">›</span>}
            <DelBtn onDelete={onDelete} />
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   PANEL 1 — Majors
═══════════════════════════════════════════════════════════════ */
function MajorsCol({ sel, onSel }) {
    const [list, setList] = useState([])
    const load = useCallback(async () => {
        try { setList((await apiClient.get('/admin/majors')).data) } catch { setList([]) }
    }, [])
    useEffect(() => { load() }, [load])

    const add = async (name) => {
        await apiClient.post('/admin/majors', { name }); await load()
    }
    const del = async (id) => {
        await apiClient.delete(`/admin/majors/${id}`); await load()
        if (sel?.id === id) onSel(null)
    }

    return (
        <Panel
            icon="🎓" title="Majors" count={list.length}
            onAdd={Object.assign(add, { placeholder: 'e.g. BTech' })}
            empty={list.length === 0} emptyIcon="🎓" emptyText="No majors yet"
        >
            {list.map(m => (
                <Item key={m.id} label={m.name} selected={sel?.id === m.id}
                    onClick={() => onSel(sel?.id === m.id ? null : m)}
                    onDelete={() => del(m.id)}
                />
            ))}
        </Panel>
    )
}

/* ═══════════════════════════════════════════════════════════════
   PANEL 2 — Departments
═══════════════════════════════════════════════════════════════ */
function DepartmentsCol({ major, sel, onSel }) {
    const [list, setList] = useState([])
    const load = useCallback(async () => {
        if (!major) return setList([])
        try { setList((await apiClient.get(`/admin/departments?major_id=${major.id}`)).data) } catch { setList([]) }
    }, [major])
    useEffect(() => { load() }, [load])

    if (!major) return (
        <div className="ac-col ac-col--hint">
            <div className="ac-hint-icon">🏛️</div>
            <div className="ac-hint-text">Select a major</div>
        </div>
    )

    const add = async (name) => {
        await apiClient.post('/admin/departments', { name, major_id: major.id }); await load()
    }
    const del = async (id) => {
        await apiClient.delete(`/admin/departments/${id}`); await load()
        if (sel?.id === id) onSel(null)
    }

    return (
        <Panel
            icon="🏛️" title="Departments" tag={major.name} count={list.length}
            onAdd={Object.assign(add, { placeholder: 'e.g. CSE, AIML' })}
            empty={list.length === 0} emptyIcon="🏛️" emptyText={`No departments in ${major.name}`}
        >
            {list.map(d => (
                <Item key={d.id} label={d.name} selected={sel?.id === d.id}
                    onClick={() => onSel(sel?.id === d.id ? null : d)}
                    onDelete={() => del(d.id)}
                />
            ))}
        </Panel>
    )
}

/* ═══════════════════════════════════════════════════════════════
   PANEL 3 — Academic Years
═══════════════════════════════════════════════════════════════ */
function YearsCol({ dept, sel, onSel }) {
    const [list, setList] = useState([])
    const load = useCallback(async () => {
        if (!dept) return setList([])
        try { setList((await apiClient.get(`/admin/academic-years?department_id=${dept.id}`)).data) } catch { setList([]) }
    }, [dept])
    useEffect(() => { load() }, [load])

    if (!dept) return (
        <div className="ac-col ac-col--hint">
            <div className="ac-hint-icon">📅</div>
            <div className="ac-hint-text">Select a department</div>
        </div>
    )

    const add = async (n) => {
        await apiClient.post('/admin/academic-years', { year_number: n, department_id: dept.id }); await load()
    }
    const del = async (id) => {
        await apiClient.delete(`/admin/academic-years/${id}`); await load()
        if (sel?.id === id) onSel(null)
    }

    return (
        <Panel
            icon="📅" title="Years" tag={dept.name} count={list.length}
            onAdd={Object.assign(add, { placeholder: '1', type: 'number', min: 1, max: 6 })}
            empty={list.length === 0} emptyIcon="📅" emptyText={`No years in ${dept.name} yet`}
        >
            {list.map(y => (
                <Item key={y.id} label={`Year ${y.year_number}`} selected={sel?.id === y.id}
                    onClick={() => onSel(sel?.id === y.id ? null : y)}
                    onDelete={() => del(y.id)}
                />
            ))}
        </Panel>
    )
}

/* ═══════════════════════════════════════════════════════════════
   PANEL 4 — Year Detail: Sections + Curriculum
═══════════════════════════════════════════════════════════════ */
function YearDetailCol({ year, dept }) {
    const [sections, setSections] = useState([])
    const [terms, setTerms] = useState([])   // [{id, term_number, subjects:[]}]
    const [addSection, setAddSection] = useState(false)
    const [addTerm, setAddTerm] = useState(false)
    const [addSubject, setAddSubject] = useState(null) // term id
    const [saving, setSaving] = useState(false)

    const loadSections = useCallback(async () => {
        if (!year) return setSections([])
        try { setSections((await apiClient.get(`/admin/sections?academic_year_id=${year.id}`)).data) } catch { setSections([]) }
    }, [year])

    const loadTerms = useCallback(async () => {
        if (!year) return setTerms([])
        try {
            const raw = (await apiClient.get(`/admin/terms?academic_year_id=${year.id}`)).data
            const enriched = await Promise.all(raw.map(async t => {
                const subjects = (await apiClient.get(`/admin/subjects?term_id=${t.id}`)).data
                return { ...t, subjects }
            }))
            setTerms(enriched)
        } catch { setTerms([]) }
    }, [year])

    useEffect(() => { loadSections(); loadTerms() }, [loadSections, loadTerms])

    if (!year) return (
        <div className="ac-col ac-col--hint ac-col--wide">
            <div className="ac-hint-icon">📋</div>
            <div className="ac-hint-text">Select a year to manage its sections, terms & subjects</div>
        </div>
    )

    /* sections CRUD */
    const doAddSection = async (name) => {
        setSaving(true)
        await apiClient.post('/admin/sections', { name, academic_year_id: year.id })
        await loadSections(); setAddSection(false); setSaving(false)
    }
    const delSection = async id => { await apiClient.delete(`/admin/sections/${id}`); loadSections() }

    /* terms CRUD */
    const doAddTerm = async (n) => {
        setSaving(true)
        await apiClient.post('/admin/terms', { term_number: n, academic_year_id: year.id })
        await loadTerms(); setAddTerm(false); setSaving(false)
    }
    const delTerm = async id => { await apiClient.delete(`/admin/terms/${id}`); loadTerms() }

    /* subjects CRUD */
    const doAddSubject = async (termId, name) => {
        setSaving(true)
        await apiClient.post('/admin/subjects', { name, term_id: termId })
        await loadTerms(); setAddSubject(null); setSaving(false)
    }
    const delSubject = async id => { await apiClient.delete(`/admin/subjects/${id}`); loadTerms() }

    return (
        <div className="ac-col ac-col--wide">
            {/* Header */}
            <div className="ac-col-head">
                <div className="ac-col-title">
                    <span>📋</span>
                    <span>{dept?.name} — Year {year.year_number}</span>
                </div>
            </div>

            <div className="ac-detail-body">
                {/* ── SECTIONS ── */}
                <div className="ac-section-block">
                    <div className="ac-section-row-head">
                        <div className="ac-section-row-label">
                            <span className="ac-section-icon">👥</span>
                            <span className="ac-section-title">Sections</span>
                            <span className="ac-badge">{sections.length}</span>
                        </div>
                        <button className="ac-add-btn" onClick={() => setAddSection(true)}>+ Add Section</button>
                    </div>
                    <p className="ac-section-hint">Class batches for Year {year.year_number} — e.g. {dept?.name}-{year.year_number}A, {dept?.name}-{year.year_number}B</p>
                    {addSection && (
                        <AddForm
                            placeholder={`e.g. ${dept?.name ?? 'CSE'}-${year.year_number}A`}
                            onSave={doAddSection}
                            onCancel={() => setAddSection(false)}
                            saving={saving}
                        />
                    )}
                    <div className="ac-chip-row">
                        {sections.length === 0 && <span className="ac-empty-inline">No sections yet</span>}
                        {sections.map(s => (
                            <div key={s.id} className="ac-chip ac-chip--section">
                                {s.name}
                                <DelBtn onDelete={() => delSection(s.id)} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ac-divider" />

                {/* ── CURRICULUM ── */}
                <div className="ac-section-block">
                    <div className="ac-section-row-head">
                        <div className="ac-section-row-label">
                            <span className="ac-section-icon">📚</span>
                            <span className="ac-section-title">Curriculum</span>
                            <span className="ac-badge">{terms.length} terms</span>
                        </div>
                        <button className="ac-add-btn" onClick={() => setAddTerm(true)}>+ Add Term</button>
                    </div>
                    {addTerm && (
                        <AddForm
                            placeholder="Term number (1–4)"
                            type="number" min={1} max={4}
                            onSave={doAddTerm}
                            onCancel={() => setAddTerm(false)}
                            saving={saving}
                        />
                    )}
                    {terms.length === 0 && (
                        <div className="ac-empty-inline">No terms yet — click "+ Add Term"</div>
                    )}
                    {terms.map(t => (
                        <div key={t.id} className="ac-term-block">
                            <div className="ac-term-head">
                                <span className="ac-term-badge">Term {t.term_number}</span>
                                <div className="ac-term-actions">
                                    <button className="ac-add-btn-sm" onClick={() => setAddSubject(t.id)}>+ Subject</button>
                                    <DelBtn onDelete={() => delTerm(t.id)} />
                                </div>
                            </div>
                            {addSubject === t.id && (
                                <AddForm
                                    placeholder="Subject name"
                                    onSave={name => doAddSubject(t.id, name)}
                                    onCancel={() => setAddSubject(null)}
                                    saving={saving}
                                />
                            )}
                            <div className="ac-chip-row">
                                {t.subjects.length === 0 && <span className="ac-empty-inline">No subjects yet</span>}
                                {t.subjects.map(s => (
                                    <div key={s.id} className="ac-chip ac-chip--subject">
                                        📚 {s.name}
                                        <DelBtn onDelete={() => delSubject(s.id)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════════════════════════ */
export default function AcademicStructure() {
    const [major, setMajor] = useState(null)
    const [dept, setDept] = useState(null)
    const [year, setYear] = useState(null)

    const pickMajor = m => { setMajor(m); setDept(null); setYear(null) }
    const pickDept = d => { setDept(d); setYear(null) }

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div>
                        <h1>Academic Structure</h1>
                        <p>Manage majors, departments, academic years, sections and curriculum</p>
                    </div>
                    <div className="ac-breadcrumb">
                        <span className={major ? 'bc-active' : 'bc-dim'}>Major</span>
                        <span className="bc-sep">›</span>
                        <span className={dept ? 'bc-active' : 'bc-dim'}>Department</span>
                        <span className="bc-sep">›</span>
                        <span className={year ? 'bc-active' : 'bc-dim'}>Year</span>
                        <span className="bc-sep">›</span>
                        <span className="bc-dim">Sections &amp; Curriculum</span>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="ac-grid">
                        <MajorsCol sel={major} onSel={pickMajor} />
                        <DepartmentsCol major={major} sel={dept} onSel={pickDept} />
                        <YearsCol dept={dept} sel={year} onSel={setYear} />
                        <YearDetailCol year={year} dept={dept} />
                    </div>
                </div>
            </main>
        </div>
    )
}
