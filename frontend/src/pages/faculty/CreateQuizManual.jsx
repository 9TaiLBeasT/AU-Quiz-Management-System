import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Faculty.css'

const emptyQuestion = () => ({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '', difficulty: 'medium' })

export default function CreateQuizManual({ editMode = false }) {
    const navigate = useNavigate()
    const { id } = useParams()

    const [assignments, setAssignments] = useState([])
    const [config, setConfig] = useState({
        assignment_key: '', subject_id: '', section_id: '',
        time_limit: 30, start_time: '', end_time: '',
        difficulty_level: 'medium', randomize_questions: false, randomize_options: false
    })
    const [questions, setQuestions] = useState([emptyQuestion()])
    const [saving, setSaving] = useState(false)
    const [loadingEdit, setLoadingEdit] = useState(editMode)

    useEffect(() => {
        apiClient.get('/faculty/assignments').then(r => setAssignments(r.data))
    }, [])

    useEffect(() => {
        if (editMode && id) {
            apiClient.get(`/faculty/quizzes/${id}`).then(r => {
                const qz = r.data
                const toLocalInputFormat = (utcStr) => {
                    if (!utcStr) return '';
                    const d = new Date(utcStr);
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                };
                setConfig({
                    assignment_key: `${qz.subject_id}|${qz.section_id}`,
                    subject_id: qz.subject_id, section_id: qz.section_id,
                    time_limit: qz.time_limit,
                    start_time: toLocalInputFormat(qz.start_time),
                    end_time: toLocalInputFormat(qz.end_time),
                    difficulty_level: qz.difficulty_level,
                    randomize_questions: qz.randomize_questions,
                    randomize_options: qz.randomize_options
                })
                if (qz.questions && qz.questions.length > 0) {
                    setQuestions(qz.questions.map(q => ({
                        question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
                        option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
                        explanation: q.explanation || '', difficulty: q.difficulty || 'medium'
                    })))
                } else {
                    setQuestions([emptyQuestion()])
                }
            }).catch(e => {
                alert('Could not load quiz for editing.')
                navigate('/faculty/quizzes')
            }).finally(() => setLoadingEdit(false))
        }
    }, [editMode, id, navigate])

    const addQuestion = () => setQuestions(q => [...q, emptyQuestion()])
    const removeQuestion = (i) => setQuestions(q => q.filter((_, idx) => idx !== i))
    const updateQuestion = (i, field, value) => setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true)
        const payload = { ...config, questions }
        payload.start_time = payload.start_time ? new Date(payload.start_time).toISOString() : null
        payload.end_time = payload.end_time ? new Date(payload.end_time).toISOString() : null

        try {
            if (editMode) {
                await apiClient.put(`/faculty/quizzes/${id}`, payload)
            } else {
                await apiClient.post('/faculty/quizzes', payload)
            }
            navigate('/faculty/quizzes')
        } catch (err) { alert(err.response?.data?.detail || 'Error saving quiz') }
        finally { setSaving(false) }
    }

    if (loadingEdit) {
        return <div className="app-shell"><FacultySidebar /><main className="main-content"><p>Loading quiz...</p></main></div>
    }

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div>
                        <h1>{editMode ? 'Edit Quiz' : 'Create Quiz (Manual)'}</h1>
                        <p>{editMode ? 'Make changes to your draft quiz' : 'Build a quiz by entering questions yourself'}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="quiz-form">
                    {/* Config */}
                    <div className="card">
                        <h3 className="section-title">Quiz Configuration</h3>
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
                            <Input label="Time Limit (minutes)" type="number" min={5} value={config.time_limit} onChange={e => setConfig(p => ({ ...p, time_limit: e.target.value }))} />
                            <div className="input-group">
                                <label className="input-label">Difficulty</label>
                                <select className="input-field" value={config.difficulty_level} onChange={e => setConfig(p => ({ ...p, difficulty_level: e.target.value }))}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <Input label="Start Time (Opens)" type="datetime-local" value={config.start_time} onChange={e => setConfig(p => ({ ...p, start_time: e.target.value }))} />
                            <Input label="End Time (Closes)" type="datetime-local" value={config.end_time} onChange={e => setConfig(p => ({ ...p, end_time: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--sp-6)', marginTop: 'var(--sp-4)' }}>
                            <label className="correct-radio"><input type="checkbox" checked={config.randomize_questions} onChange={e => setConfig(p => ({ ...p, randomize_questions: e.target.checked }))} /> Randomize Questions</label>
                            <label className="correct-radio"><input type="checkbox" checked={config.randomize_options} onChange={e => setConfig(p => ({ ...p, randomize_options: e.target.checked }))} /> Randomize Options</label>
                        </div>
                    </div>

                    {/* Questions */}
                    {questions.map((q, i) => (
                        <div key={i} className="quiz-question-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="question-number">Question {i + 1}</span>
                                {questions.length > 1 && <button type="button" className="action-btn danger" onClick={() => removeQuestion(i)}>Remove</button>}
                            </div>
                            <Input label="Question Text" placeholder="Enter question..." value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} />
                            <div className="options-grid">
                                {['a', 'b', 'c', 'd'].map(opt => (
                                    <Input key={opt} label={`Option ${opt.toUpperCase()}`} placeholder={`Option ${opt.toUpperCase()}`} value={q[`option_${opt}`]} onChange={e => updateQuestion(i, `option_${opt}`, e.target.value)} />
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
                                    <select className="input-field" value={q.difficulty} onChange={e => updateQuestion(i, 'difficulty', e.target.value)}>
                                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <Input label="Explanation (optional)" placeholder="Why is this the correct answer?" value={q.explanation} onChange={e => updateQuestion(i, 'explanation', e.target.value)} />
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button type="button" variant="secondary" onClick={addQuestion}>+ Add Question</Button>
                        <Button type="submit" loading={saving}>{editMode ? 'Save Changes' : 'Create Quiz'}</Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
