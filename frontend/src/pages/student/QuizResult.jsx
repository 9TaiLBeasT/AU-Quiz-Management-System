import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StudentSidebar from '../../components/layout/StudentSidebar'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Student.css'

export default function QuizResult() {
    const { quizId } = useParams()
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get(`/student/quizzes/${quizId}/result`).then(r => setResult(r.data)).finally(() => setLoading(false))
    }, [quizId])

    if (loading) return <div className="app-shell"><StudentSidebar /><main className="main-content"><p>Loading result...</p></main></div>
    if (!result) return <div className="app-shell"><StudentSidebar /><main className="main-content"><p>Result not found.</p></main></div>

    const pct = Math.round((result.score / result.total_questions) * 100)
    const pctStyle = `${pct * 3.6}deg`

    return (
        <div className="app-shell">
            <StudentSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Quiz Result</h1><p>{result.subject_name}</p></div>
                    <Link to="/student/quizzes"><button className="btn btn-secondary btn-md">← Back to Quizzes</button></Link>
                </div>

                {!result.results_published ? (
                    <div className="result-card mb-6" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>⏳</div>
                        <h2>Results Pending</h2>
                        <p style={{ color: 'var(--clr-text-muted)', marginTop: 'var(--sp-2)' }}>
                            Your answers have been safely recorded! <br />
                            Scores and correct answers will be visible once your faculty publishes them.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="result-card mb-6">
                            <div className="score-ring" style={{ '--pct': `${pct * 3.6}deg` }}>
                                <div className="score-ring-inner">{pct}%</div>
                            </div>
                            <style>{`.score-ring { background: conic-gradient(var(--clr-primary) ${pctStyle}, var(--clr-border) 0%); }`}</style>
                            <h2>{result.score} / {result.total_questions} Correct</h2>
                            <p style={{ marginTop: 'var(--sp-2)' }}>
                                {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good effort!' : '📚 Keep studying!'}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center', marginTop: 'var(--sp-5)' }}>
                                <Badge variant={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'}>{pct >= 80 ? 'Passed' : pct >= 60 ? 'Average' : 'Below Average'}</Badge>
                                <Badge variant="info">Submitted {new Date(result.submitted_at).toLocaleDateString()}</Badge>
                            </div>
                        </div>

                        {result.show_answers && result.questions?.length > 0 && (
                            <div className="card">
                                <h3 className="section-title">Answer Review</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                                    {result.questions.map((q, i) => {
                                        const isCorrect = result.answers[q.id] === q.correct_option
                                        return (
                                            <div key={q.id} style={{ background: 'var(--clr-surface-2)', border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>Q{i + 1}. {q.question_text}</span>
                                                    <Badge variant={isCorrect ? 'success' : 'danger'}>{isCorrect ? '✓ Correct' : '✗ Wrong'}</Badge>
                                                </div>
                                                {['a', 'b', 'c', 'd'].map(opt => (
                                                    <div key={opt} style={{
                                                        padding: '4px 12px', borderRadius: 4, marginBottom: 4, fontSize: 'var(--font-size-sm)',
                                                        background: opt === q.correct_option ? 'rgba(16,185,129,0.1)' : opt === result.answers[q.id] && !isCorrect ? 'rgba(239,68,68,0.08)' : 'transparent',
                                                        color: opt === q.correct_option ? 'var(--clr-success)' : opt === result.answers[q.id] && !isCorrect ? 'var(--clr-danger)' : 'var(--clr-text-muted)',
                                                    }}>
                                                        {opt.toUpperCase()}. {q[`option_${opt}`]}
                                                        {opt === q.correct_option ? ' ✓' : ''}
                                                        {opt === result.answers[q.id] && !isCorrect ? ' ✗ (your answer)' : ''}
                                                    </div>
                                                ))}
                                                {q.explanation && <p style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>💡 {q.explanation}</p>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
