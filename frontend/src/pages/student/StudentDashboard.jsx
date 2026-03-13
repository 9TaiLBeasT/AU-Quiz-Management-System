import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../../components/layout/StudentSidebar'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/PageLayout.css'
import './Student.css'

export default function StudentDashboard() {
    const { profile } = useAuth()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get('/student/subjects').then(r => setSubjects(r.data)).finally(() => setLoading(false))
    }, [])

    return (
        <div className="app-shell">
            <StudentSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div>
                        <h1>Welcome, {profile?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
                        <p>Here's your academic overview for this term</p>
                    </div>
                    <Link to="/student/quizzes"><button className="btn btn-primary btn-md">View My Quizzes</button></Link>
                </div>

                {/* Profile Card */}
                <div className="student-profile-card mb-6">
                    <div className="profile-field"><span className="pf-label">Major</span><span className="pf-value">{profile?.major_name || '—'}</span></div>
                    <div className="profile-divider" />
                    <div className="profile-field"><span className="pf-label">Department</span><span className="pf-value">{profile?.department_name || '—'}</span></div>
                    <div className="profile-divider" />
                    <div className="profile-field"><span className="pf-label">Academic Year</span><span className="pf-value">Year {profile?.year_number || '—'}</span></div>
                    <div className="profile-divider" />
                    <div className="profile-field"><span className="pf-label">Section</span><span className="pf-value">{profile?.section_name || '—'}</span></div>
                </div>

                {/* Current Term Subjects */}
                <h3 className="section-title">📚 Current Term Subjects</h3>
                {loading ? <p>Loading subjects...</p> : (
                    <div className="student-subject-grid">
                        {subjects.map(s => (
                            <div key={s.id} className="student-subject-card">
                                <div style={{ fontSize: '2rem' }}>📘</div>
                                <div>
                                    <h4>{s.name}</h4>
                                    <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 4 }}>Term {s.term_number}</p>
                                </div>
                                <Badge variant="info">Active</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
