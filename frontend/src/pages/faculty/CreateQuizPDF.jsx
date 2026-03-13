import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Faculty.css'

export default function CreateQuizPDF() {
    const navigate = useNavigate()
    const [assignments, setAssignments] = useState([])
    const [config, setConfig] = useState({
        assignment_key: '', subject_id: '', section_id: '',
        difficulty_level: 'medium',
        time_limit: 30, start_time: '', end_time: ''
    })
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fileName, setFileName] = useState('')
    const fileRef = useRef()
    const [file, setFile] = useState(null)

    useEffect(() => {
        apiClient.get('/faculty/assignments').then((a) => setAssignments(a.data))
    }, [])

    const handleFileSelect = (e) => {
        const f = e.target.files[0]; if (!f) return
        if (f.type !== 'application/pdf') { alert('Please upload a PDF file'); return }
        setFile(f)
        setFileName(f.name)
        setGeneratedQuestions([])
    }

    const handleGenerate = async () => {
        if (!file || !config.subject_id) return
        setUploading(true); setGeneratedQuestions([])
        const fd = new FormData()
        fd.append('file', file)
        fd.append('difficulty', config.difficulty_level)
        try {
            const res = await apiClient.post('/faculty/quizzes/generate-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setGeneratedQuestions(res.data.questions)
        } catch (e) { alert(e.response?.data?.detail || 'PDF processing failed') }
        finally { setUploading(false) }
    }

    const updateQuestion = (i, field, value) => {
        setGeneratedQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
    }
    const removeQuestion = (i) => {
        setGeneratedQuestions(q => q.filter((_, idx) => idx !== i))
    }
    const addQuestion = () => {
        setGeneratedQuestions(q => [...q, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', difficulty: 'medium' }])
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await apiClient.post('/faculty/quizzes', {
                ...config,
                start_time: config.start_time ? new Date(config.start_time).toISOString() : null,
                end_time: config.end_time ? new Date(config.end_time).toISOString() : null,
                questions: generatedQuestions
            })
            navigate('/faculty/quizzes')
        } catch (e) { alert(e.response?.data?.detail || 'Error') }
        finally { setSaving(false) }
    }

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Create Quiz from PDF</h1><p>Upload a study material PDF — AI extracts and generates MCQs</p></div>
                </div>
                <div className="card quiz-form">
                    <h3 className="section-title">📄 Upload PDF + Configuration</h3>
                    <div className="form-row">
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Select Assigned Class</label>
                            <select className="input-field" required value={config.assignment_key} onChange={e => {
                                const val = e.target.value;
                                if (!val) return setConfig(p => ({ ...p, assignment_key: '', subject_id: '', section_id: '' }));
                                const [subj, sect] = val.split('|');
                                setConfig(p => ({ ...p, assignment_key: val, subject_id: subj, section_id: sect }));
                            }}>
                                <option value="">Select a specific subject and class section...</option>
                                {assignments.map(a => (
                                    <option key={a.id} value={`${a.subject_id}|${a.section_id}`}>
                                        {a.subject_name} — Section {a.section_name} (Term {a.term_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Difficulty</label>
                            <select className="input-field" value={config.difficulty_level} onChange={e => setConfig(p => ({ ...p, difficulty_level: e.target.value }))}>
                                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                            </select>
                        </div>
                        <Input label="Time Limit (min)" type="number" min={5} value={config.time_limit} onChange={e => setConfig(p => ({ ...p, time_limit: e.target.value }))} />
                        <Input label="Start Time (Opens)" type="datetime-local" value={config.start_time} onChange={e => setConfig(p => ({ ...p, start_time: e.target.value }))} />
                        <Input label="End Time (Closes)" type="datetime-local" value={config.end_time} onChange={e => setConfig(p => ({ ...p, end_time: e.target.value }))} />
                    </div>
                    <div
                        onClick={() => fileRef.current.click()}
                        style={{
                            border: '2px dashed var(--clr-border)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--sp-10)', textAlign: 'center', cursor: 'pointer',
                            transition: 'border-color var(--t-fast)',
                            background: uploading ? 'var(--clr-surface-2)' : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}
                    >
                        {uploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
                                <Spinner size={36} />
                                <p>AI is processing your PDF...</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-3)' }}>📄</div>
                                <p style={{ color: 'var(--clr-text)' }}>{fileName || 'Click or drag to upload PDF'}</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--sp-2)' }}>Supported: PDF files only</p>
                            </>
                        )}
                        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        loading={uploading}
                        disabled={!file || !config.subject_id}
                        style={{ alignSelf: 'flex-start', marginTop: 'var(--sp-5)' }}
                    >
                        {uploading ? 'Extracting & Thinking…' : '📄 Extract Questions from PDF'}
                    </Button>
                </div>

                {/* Thinking indicator */}
                {uploading && (
                    <div className="ai-thinking-bar">
                        <Spinner />
                        <div>
                            <p style={{ margin: 0, fontWeight: 500 }}>AI is reading your PDF…</p>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                                lfm2.5-thinking is reasoning through the document. This may take 30–60 seconds.
                            </p>
                        </div>
                    </div>
                )}

                {generatedQuestions.length > 0 && (
                    <div className="card mt-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>✅ {generatedQuestions.length} Questions Extracted — Review Before Saving</h3>
                            <Button onClick={handleSave} loading={saving}>Save Quiz</Button>
                        </div>
                        <div className="ai-questions-preview">
                            {generatedQuestions.map((q, i) => (
                                <div key={i} className="quiz-question-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="question-number">Question {i + 1}</span>
                                        <button type="button" className="action-btn danger" onClick={() => removeQuestion(i)}>Verify / Remove</button>
                                    </div>
                                    <Input label="Question Text" value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} />
                                    <div className="options-grid">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <Input key={opt} label={`Option ${opt.toUpperCase()}`} value={q[`option_${opt}`]} onChange={e => updateQuestion(i, `option_${opt}`, e.target.value)} />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--sp-6)' }}>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label">Correct Answer</label>
                                            <select className="input-field" value={q.correct_option} onChange={e => updateQuestion(i, 'correct_option', e.target.value)}>
                                                {['a', 'b', 'c', 'd'].map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label className="input-label">Difficulty</label>
                                            <select className="input-field" value={q.difficulty || 'medium'} onChange={e => updateQuestion(i, 'difficulty', e.target.value)}>
                                                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Input label="Explanation (optional)" value={q.explanation || ''} onChange={e => updateQuestion(i, 'explanation', e.target.value)} />
                                </div>
                            ))}
                            <div style={{ alignSelf: 'flex-start', marginTop: 'var(--sp-2)' }}>
                                <Button type="button" variant="secondary" onClick={addQuestion}>+ Add Another Question</Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
