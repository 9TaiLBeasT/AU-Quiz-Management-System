import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import './Student.css'

export default function QuizAttempt() {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const [quiz, setQuiz] = useState(null)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const timerRef = useRef(null)

    const [error, setError] = useState(null)

    useEffect(() => {
        apiClient.get(`/student/quizzes/${quizId}`).then(r => {
            setQuiz(r.data)
            setTimeLeft(r.data.time_limit * 60)
        }).catch(err => {
            setError(err.response?.data?.detail || 'Failed to load quiz')
        }).finally(() => setLoading(false))
    }, [quizId])

    const handleSubmit = useCallback(async (auto = false) => {
        if (submitting) return
        if (!auto && !confirm('Submit quiz now? You cannot change your answers after submission.')) return
        setSubmitting(true)
        clearInterval(timerRef.current)
        try {
            await apiClient.post(`/student/quizzes/${quizId}/submit`, { answers })
            navigate(`/student/quiz/${quizId}/result`)
        } catch (e) {
            alert(e.response?.data?.detail || 'Submission failed')
            setSubmitting(false)
        }
    }, [quizId, answers, submitting, navigate])

    // Countdown timer
    useEffect(() => {
        if (timeLeft === null) return
        if (timeLeft <= 0) { handleSubmit(true); return }
        timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
        return () => clearInterval(timerRef.current)
    }, [timeLeft, handleSubmit])

    // Warn on tab leave
    useEffect(() => {
        const handler = () => { if (quiz) alert('⚠️ Please stay on the quiz page!') }
        document.addEventListener('visibilitychange', handler)
        return () => document.removeEventListener('visibilitychange', handler)
    }, [quiz])

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={48} /></div>
    if (error) return <div className="app-shell"><main className="main-content"><p style={{ color: 'var(--clr-danger)' }}>❌ {error}</p></main></div>
    if (!quiz) return <p style={{ padding: 'var(--sp-8)', color: 'var(--clr-text-muted)' }}>Quiz not found.</p>

    const question = quiz.questions[currentIdx]
    const totalQ = quiz.questions.length
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const secs = String(timeLeft % 60).padStart(2, '0')

    const selectOption = (opt) => setAnswers(a => ({ ...a, [question.id]: opt }))

    return (
        <div className="quiz-attempt-page">
            {/* Top Bar */}
            <div className="quiz-topbar">
                <div>
                    <h3 style={{ color: 'var(--clr-text)', fontWeight: 700 }}>{quiz.subject_name}</h3>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-muted)' }}>Question {currentIdx + 1} of {totalQ}</div>
                </div>
                <div className={`quiz-timer ${timeLeft < 60 ? 'warning' : ''}`}>{mins}:{secs}</div>
                <button className="btn btn-danger btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-wrap" style={{ borderRadius: 0, height: 3 }}>
                <div className="progress-bar-fill" style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }} />
            </div>

            {/* Question */}
            <div className="quiz-body">
                <div className="question-card">
                    <p className="text-muted text-sm mb-4" style={{ marginBottom: 'var(--sp-4)' }}>Question {currentIdx + 1} · {question.difficulty}</p>
                    <p className="question-text">{question.question_text}</p>
                    <div className="option-list">
                        {['a', 'b', 'c', 'd'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${answers[question.id] === opt ? 'selected' : ''}`}
                                onClick={() => selectOption(opt)}
                            >
                                <span className="option-letter">{opt.toUpperCase()}</span>
                                <span>{question[`option_${opt}`]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="quiz-nav mt-6">
                    <button className="btn btn-secondary btn-md" onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}>← Previous</button>
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        {Object.keys(answers).length} / {totalQ} answered
                    </span>
                    {currentIdx < totalQ - 1 ? (
                        <button className="btn btn-primary btn-md" onClick={() => setCurrentIdx(i => i + 1)}>Next →</button>
                    ) : (
                        <button className="btn btn-primary btn-md" onClick={() => handleSubmit(false)} disabled={submitting}>
                            {submitting ? 'Submitting...' : '✓ Submit'}
                        </button>
                    )}
                </div>

                {/* Question dots */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--sp-6)' }}>
                    {quiz.questions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            style={{
                                width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                                fontSize: 'var(--font-size-xs)', fontWeight: 700,
                                background: answers[q.id] ? 'var(--clr-primary)' : i === currentIdx ? 'var(--clr-surface-2)' : 'var(--clr-border)',
                                color: answers[q.id] || i === currentIdx ? 'var(--clr-text)' : 'var(--clr-text-muted)',
                                outline: i === currentIdx ? '2px solid var(--clr-primary-h)' : 'none',
                            }}
                        >{i + 1}</button>
                    ))}
                </div>
            </div>
        </div>
    )
}
