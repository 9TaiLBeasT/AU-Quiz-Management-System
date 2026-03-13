import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, quizzes: 0, sections: 0, students: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get('/admin/stats').then(r => setStats(r.data)).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const cards = [
        { label: 'Total Users', value: stats.users, icon: '👥', color: 'var(--clr-primary)' },
        { label: 'Active Students', value: stats.students, icon: '👨‍🎓', color: 'var(--clr-success)' },
        { label: 'Total Quizzes', value: stats.quizzes, icon: '📝', color: 'var(--clr-accent)' },
        { label: 'Total Sections', value: stats.sections, icon: '🗂', color: 'var(--clr-warning)' },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>System overview and quick access</p>
                    </div>
                </div>

                <div className="stats-grid">
                    {cards.map((c) => (
                        <div key={c.label} className="stat-card">
                            <div className="stat-icon">{c.icon}</div>
                            <div className="stat-value" style={{ color: c.color }}>{loading ? '—' : c.value}</div>
                            <div className="stat-label">{c.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid-2 mt-6">
                    <div className="card">
                        <h3 className="section-title">📚 Academic Structure</h3>
                        <p>Manage majors, departments, academic years, terms, subjects, and sections.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                            {[['Majors', '/admin/majors'], ['Departments', '/admin/departments'], ['Years', '/admin/academic-years'], ['Terms', '/admin/terms'], ['Subjects', '/admin/subjects'], ['Sections', '/admin/sections']].map(([label, to]) => (
                                <a key={to} href={to} style={{ padding: '6px 14px', background: 'var(--clr-primary-dim)', color: 'var(--clr-primary-h)', borderRadius: 'var(--radius)', fontSize: 'var(--font-size-sm)', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' }}>{label}</a>
                            ))}
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="section-title">👤 User Management</h3>
                        <p>Create and manage faculty accounts and student enrollments.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                            {[['Faculty', '/admin/faculty'], ['Students', '/admin/students']].map(([label, to]) => (
                                <a key={to} href={to} style={{ padding: '6px 14px', background: 'var(--clr-accent-dim)', color: 'var(--clr-accent)', borderRadius: 'var(--radius)', fontSize: 'var(--font-size-sm)', fontWeight: 600, border: '1px solid rgba(34,211,238,0.2)' }}>{label}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
