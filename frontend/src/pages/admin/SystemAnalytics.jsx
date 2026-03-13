import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function SystemAnalytics() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get('/admin/analytics').then(r => setAnalytics(r.data)).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="app-shell"><AdminSidebar /><main className="main-content"><p>Loading analytics...</p></main></div>

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>System Analytics</h1><p>Platform-wide performance metrics</p></div>
                </div>

                <div className="stats-grid mb-6">
                    {[
                        { label: 'Total Quizzes', value: analytics?.total_quizzes ?? 0, icon: '📝' },
                        { label: 'Total Attempts', value: analytics?.total_attempts ?? 0, icon: '📊' },
                        { label: 'Active Students', value: analytics?.active_students ?? 0, icon: '👨‍🎓' },
                        { label: 'Avg Score', value: analytics?.avg_score ? `${analytics.avg_score.toFixed(1)}%` : '—', icon: '🎯' },
                    ].map(c => (
                        <div key={c.label} className="stat-card">
                            <div className="stat-icon">{c.icon}</div>
                            <div className="stat-value" style={{ color: 'var(--clr-primary-h)' }}>{c.value}</div>
                            <div className="stat-label">{c.label}</div>
                        </div>
                    ))}
                </div>

                {analytics?.section_scores?.length > 0 && (
                    <div className="card">
                        <h3 className="section-title">Section Average Scores</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.section_scores}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                                <XAxis dataKey="section_name" tick={{ fill: 'var(--clr-text-muted)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--clr-text-muted)', fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8 }} />
                                <Bar dataKey="avg_score" fill="var(--clr-primary)" radius={[4, 4, 0, 0]} name="Avg Score %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </main>
        </div>
    )
}
