import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function QuizAnalytics() {
    const { quizId } = useParams()
    const [data, setData] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            const [statsRes, subsRes] = await Promise.all([
                apiClient.get(`/faculty/quizzes/${quizId}/analytics`),
                apiClient.get(`/faculty/quizzes/${quizId}/submissions`)
            ])
            setData(statsRes.data)
            setSubmissions(subsRes.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [quizId])

    const handleDeleteAttempt = async (attemptId) => {
        if (!window.confirm('Are you sure you want to delete this attempt? This will allow the student to retake the quiz.')) return
        try {
            await apiClient.delete(`/faculty/quizzes/${quizId}/attempts/${attemptId}`)
            // Refresh data to reflect the deleted attempt
            fetchAnalytics()
        } catch (error) {
            console.error('Failed to delete attempt', error)
            alert('Failed to delete attempt. Check console for details.')
        }
    }

    if (loading) return <div className="app-shell"><FacultySidebar /><main className="main-content"><p>Loading analytics...</p></main></div>
    if (!data) return <div className="app-shell"><FacultySidebar /><main className="main-content"><p>No analytics available.</p></main></div>

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Quiz Analytics</h1><p>{data.quiz_title}</p></div>
                </div>

                <div className="stats-grid mb-6">
                    {[
                        { label: 'Total Attempts', value: data.total_attempts, icon: '👥' },
                        { label: 'Section Average', value: `${data.avg_score?.toFixed(1) ?? 0}%`, icon: '🎯' },
                        { label: 'Highest Score', value: `${data.highest_score ?? 0}%`, icon: '🏆' },
                        { label: 'Lowest Score', value: `${data.lowest_score ?? 0}%`, icon: '📉' },
                    ].map(c => (
                        <div key={c.label} className="stat-card">
                            <div className="stat-icon">{c.icon}</div>
                            <div className="stat-value" style={{ color: 'var(--clr-primary-h)' }}>{c.value}</div>
                            <div className="stat-label">{c.label}</div>
                        </div>
                    ))}
                </div>

                {data.question_accuracies?.length > 0 && (
                    <div className="card mb-6">
                        <h3 className="section-title">Question-wise Accuracy (%)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.question_accuracies} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
                                <YAxis type="category" dataKey="label" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} width={70} />
                                <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8 }} />
                                <Bar dataKey="accuracy" fill="var(--clr-accent)" radius={[0, 4, 4, 0]} name="Accuracy %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {data.weak_topics?.length > 0 && (
                    <div className="card">
                        <h3 className="section-title">⚠️ Weak Topics (Below 50% Accuracy)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                            {data.weak_topics.map((t, i) => (
                                <div key={i} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: 'var(--sp-3) var(--sp-4)' }}>
                                    <span style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>Q{t.question_number}</span>
                                    <span style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'var(--sp-3)' }}>{t.question_text}</span>
                                    <span style={{ float: 'right', color: 'var(--clr-danger)', fontWeight: 700 }}>{t.accuracy}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="card mt-6">
                    <h3 className="section-title">📊 Live Submissions Board</h3>
                    {submissions.length === 0 ? (
                        <p style={{ color: 'var(--clr-text-muted)' }}>No students have submitted this quiz yet.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                                        <th style={{ padding: 'var(--sp-2)' }}>Student Name</th>
                                        <th style={{ padding: 'var(--sp-2)' }}>Submitted At</th>
                                        <th style={{ padding: 'var(--sp-2)' }}>Score</th>
                                        <th style={{ padding: 'var(--sp-2)' }}>Acc %</th>
                                        <th style={{ padding: 'var(--sp-2)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map(sub => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                                            <td style={{ padding: 'var(--sp-2)' }}>{sub.student_name}</td>
                                            <td style={{ padding: 'var(--sp-2)' }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                                            <td style={{ padding: 'var(--sp-2)' }}>{sub.score} / {sub.total_questions}</td>
                                            <td style={{ padding: 'var(--sp-2)' }}>{sub.percentage}%</td>
                                            <td style={{ padding: 'var(--sp-2)', textAlign: 'right' }}>
                                                <button
                                                    className="action-btn danger btn-sm"
                                                    onClick={() => handleDeleteAttempt(sub.id)}
                                                    title="Delete attempt to allow a retake"
                                                >
                                                    🗑️ Reset
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
