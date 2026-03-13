import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Faculty.css'

export default function CreateQuizAI() {
    const navigate = useNavigate()
    const [assignments, setAssignments] = useState([])
    const [config, setConfig] = useState({
        assignment_key: '', subject_id: '', section_id: '',
        prompt: '',
        time_limit: 30, start_time: '', end_time: ''
    })
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        apiClient.get('/faculty/assignments').then((a) => setAssignments(a.data))
    }, [])

    const handleGenerate = async () => {
        if (!config.prompt.trim()) return alert('Please enter a prompt describing what quiz to generate.')
        if (!config.subject_id) return alert('Please select a class section first.')
        setGenerating(true); setGeneratedQuestions([])
        try {
            const res = await apiClient.post('/faculty/quizzes/generate-ai', {
                prompt: config.prompt
            })
            setGeneratedQuestions(res.data.questions)
        } catch (e) { alert(e.response?.data?.detail || 'AI generation failed. Make sure Ollama is running.') }
        finally { setGenerating(false) }
    }

    const handleSave = async () => {
        if (!generatedQuestions.length || !config.subject_id) return
        setSaving(true)
        try {
            await apiClient.post('/faculty/quizzes', {
                ...config,
                start_time: config.start_time ? new Date(config.start_time).toISOString() : null,
                end_time: config.end_time ? new Date(config.end_time).toISOString() : null,
                difficulty_level: 'medium',
                randomize_questions: false,
                randomize_options: false,
                questions: generatedQuestions
            })
            navigate('/faculty/quizzes')
        } catch (e) { alert(e.response?.data?.detail || 'Error saving quiz') }
        finally { setSaving(false) }
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

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Create Quiz (AI)</h1><p>Describe what you need — the AI thinks and builds it for you</p></div>
                </div>

                <div className="card quiz-form">
                    <h3 className="section-title">🧠 AI Quiz Generation</h3>
                    <div className="form-row">
                        {/* Class Selection */}
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Select Assigned Class</label>
                            <select className="input-field" required value={config.assignment_key} onChange={e => {
                                const val = e.target.value
                                if (!val) return setConfig(p => ({ ...p, assignment_key: '', subject_id: '', section_id: '' }))
                                const [subj, sect] = val.split('|')
                                setConfig(p => ({ ...p, assignment_key: val, subject_id: subj, section_id: sect }))
                            }}>
                                <option value="">Select a subject and class section…</option>
                                {assignments.map(a => (
                                    <option key={a.id} value={`${a.subject_id}|${a.section_id}`}>
                                        {a.subject_name} — Section {a.section_name} (Term {a.term_number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Free-form Prompt */}
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Quiz Prompt</label>
                            <textarea
                                className="input-field ai-prompt-textarea"
                                placeholder={`Describe what you want. Examples:\n• "Generate 5 medium difficulty questions on Machine Learning algorithms"\n• "Create 10 easy questions about Python data types and loops"\n• "Give me 7 hard questions on database normalization and SQL joins"`}
                                value={config.prompt}
                                onChange={e => setConfig(p => ({ ...p, prompt: e.target.value }))}
                                rows={4}
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: '0.4rem' }}>
                                💡 Tip: Mention the topic, number of questions, and difficulty in your prompt.
                            </p>
                        </div>

                        {/* Quiz Timing */}
                        <Input label="Time Limit (min)" type="number" min={5} value={config.time_limit} onChange={e => setConfig(p => ({ ...p, time_limit: e.target.value }))} />
                        <div /> {/* spacer */}
                        <Input label="Start Time (Opens)" type="datetime-local" value={config.start_time} onChange={e => setConfig(p => ({ ...p, start_time: e.target.value }))} />
                        <Input label="End Time (Closes)" type="datetime-local" value={config.end_time} onChange={e => setConfig(p => ({ ...p, end_time: e.target.value }))} />
                    </div>

                    <Button onClick={handleGenerate} loading={generating} disabled={!config.prompt.trim() || !config.subject_id} style={{ alignSelf: 'flex-start', marginTop: 'var(--sp-4)' }}>
                        {generating ? 'Thinking…' : '🧠 Generate Questions'}
                    </Button>
                </div>

                {/* Thinking indicator */}
                {generating && (
                    <div className="ai-thinking-bar">
                        <Spinner />
                        <div>
                            <p style={{ margin: 0, fontWeight: 500 }}>AI is thinking…</p>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                                lfm2.5-thinking is reasoning through your request. This may take 30–60 seconds.
                            </p>
                        </div>
                    </div>
                )}

                {/* Questions Preview */}
                {generatedQuestions.length > 0 && (
                    <div className="card mt-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>
                                ✅ {generatedQuestions.length} Questions Generated — Review Before Saving
                            </h3>
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
