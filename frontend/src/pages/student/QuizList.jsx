import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../../components/layout/StudentSidebar'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Student.css'

export default function QuizList() {
    const [quizzes, setQuizzes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.get('/student/quizzes').then(r => setQuizzes(r.data)).finally(() => setLoading(false))
    }, [])

    const getStatus = (q) => {
        const now = new Date()
        if (q.attempted) {
            return q.results_published ? { label: 'Completed', variant: 'success' } : { label: 'Results Pending', variant: 'warning' }
        }
        if (q.end_time && now > new Date(q.end_time)) return { label: 'Closed', variant: 'default' }
        if (q.start_time && now < new Date(q.start_time)) return { label: 'Upcoming', variant: 'warning' }
        return { label: 'Active', variant: 'info' }
    }

    const getDeadlineText = (q) => {
        const now = new Date()
        if (q.start_time && now < new Date(q.start_time)) {
            const diff = new Date(q.start_time) - now
            const hrs = Math.floor(diff / 3600000)
            if (hrs < 24) return `Opens in ${hrs}h`
            return `Opens in ${Math.floor(hrs / 24)}d`
        }
        if (!q.end_time) return 'No deadline'
        const diff = new Date(q.end_time) - now
        if (diff < 0) return 'Expired'
        const hrs = Math.floor(diff / 3600000)
        if (hrs < 24) return `${hrs}h remaining`
        return `${Math.floor(hrs / 24)}d remaining`
    }

    return (
        <div className="app-shell">
            <StudentSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>My Quizzes</h1><p>Quizzes assigned to your section</p></div>
                </div>
                {loading ? <p>Loading quizzes...</p> : quizzes.length === 0 ? (
                    <EmptyState icon="📝" title="No quizzes assigned yet" description="Your faculty hasn't assigned any quizzes for your section yet." />
                ) : (
                    <div className="quiz-list">
                        {quizzes.map(q => {
                            const status = getStatus(q)
                            return (
                                <div key={q.id} className="quiz-list-item">
                                    <div>
                                        <h4 style={{ color: 'var(--clr-text)', marginBottom: 6 }}>{q.subject_name}</h4>
                                        <div className="quiz-meta">
                                            <span>⏱ {q.time_limit} min</span>
                                            <span>📋 {q.question_count} questions</span>
                                            <span>🎯 {q.difficulty_level}</span>
                                            <span style={{ color: status.label === 'Active' ? 'var(--clr-warning)' : 'inherit' }}>🕐 {getDeadlineText(q)}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                        {!q.attempted && status.label === 'Active' && (
                                            <Link to={`/student/quiz/${q.id}/attempt`}>
                                                <button className="btn btn-primary btn-sm">Start Quiz</button>
                                            </Link>
                                        )}
                                        {!q.attempted && status.label === 'Upcoming' && (
                                            <button className="btn btn-secondary btn-sm" disabled>Not Started</button>
                                        )}
                                        {q.attempted && (
                                            <Link to={`/student/quiz/${q.id}/result`}>
                                                <button className="btn btn-secondary btn-sm">View Result</button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
