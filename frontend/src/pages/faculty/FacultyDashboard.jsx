import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Faculty.css'

export default function FacultyDashboard() {
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get('/faculty/assignments').then(r => setAssignments(r.data)).finally(() => setLoading(false))
    }, [])

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Faculty Dashboard</h1><p>Your assigned subjects and sections</p></div>
                    <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                        <Link to="/faculty/quiz/create/ai"><Button variant="secondary">🤖 AI Quiz</Button></Link>
                        <Link to="/faculty/quiz/create/manual"><Button>+ Create Quiz</Button></Link>
                    </div>
                </div>

                {loading ? <p>Loading assignments...</p> : assignments.length === 0 ? (
                    <EmptyState icon="📚" title="No subjects assigned" description="Contact the administrator to get assigned to subjects." />
                ) : (
                    <div className="faculty-subject-grid">
                        {assignments.map((a) => (
                            <div key={a.id} className="subject-card">
                                <div className="subject-card-header">
                                    <span className="subject-icon">📘</span>
                                    <Badge variant="info">{a.section_name}</Badge>
                                </div>
                                <h3>{a.subject_name}</h3>
                                <p>Term {a.term_number}</p>
                                <div className="subject-card-actions">
                                    <Link to="/faculty/quizzes"><button className="subject-action-btn">📝 My Quizzes</button></Link>
                                    <Link to="/faculty/quiz/create/manual"><button className="subject-action-btn primary">+ Create Quiz</button></Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
