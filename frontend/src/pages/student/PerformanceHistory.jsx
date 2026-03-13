import { useState, useEffect } from 'react'
import StudentSidebar from '../../components/layout/StudentSidebar'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Student.css'

export default function PerformanceHistory() {
    const [history, setHistory] = useState([])
    const [subjectStats, setSubjectStats] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const PER = 10

    useEffect(() => {
        Promise.all([
            apiClient.get('/student/attempts'),
            apiClient.get('/student/subject-stats'),
        ]).then(([a, s]) => {
            setHistory(a.data); setSubjectStats(s.data)
        }).finally(() => setLoading(false))
    }, [])

    const getScoreBadge = (score, total) => {
        const pct = (score / total) * 100
        return pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'
    }

    const columns = [
        { key: 'subject_name', label: 'Subject' },
        {
            key: 'score', label: 'Score', render: r => (
                r.results_published ? (
                    <span style={{ fontWeight: 700, color: 'var(--clr-primary-h)' }}>{r.score}/{r.total_questions}</span>
                ) : <span style={{ color: 'var(--clr-text-muted)' }}>—</span>
            )
        },
        {
            key: 'pct', label: '%', render: r => r.results_published ? (
                <Badge variant={getScoreBadge(r.score, r.total_questions)}>{r.percentage}%</Badge>
            ) : <Badge variant="warning">Pending</Badge>
        },
        { key: 'submitted_at', label: 'Date', render: r => new Date(r.submitted_at).toLocaleDateString() },
    ]

    const paged = history.slice((page - 1) * PER, page * PER)

    return (
        <div className="app-shell">
            <StudentSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Performance History</h1><p>Your quiz scores and subject-wise analytics</p></div>
                </div>

                {subjectStats.length > 0 && (
                    <div className="card mb-6">
                        <h3 className="section-title">Subject-wise Average Score</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={subjectStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                                <XAxis dataKey="subject_name" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8 }} />
                                <Bar dataKey="avg_score" fill="var(--clr-primary)" radius={[4, 4, 0, 0]} name="Avg Score %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {loading ? <p>Loading history...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(history.length / PER)} onPageChange={setPage} emptyMessage="No quiz attempts yet. Take your first quiz!" />
                    </div>
                )}
            </main>
        </div>
    )
}
