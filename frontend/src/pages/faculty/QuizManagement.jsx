import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FacultySidebar from '../../components/layout/FacultySidebar'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'
import './Faculty.css'

export default function QuizManagement() {
    const [quizzes, setQuizzes] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const PER = 10

    useEffect(() => {
        apiClient.get('/faculty/quizzes').then(r => setQuizzes(r.data)).finally(() => setLoading(false))
    }, [])

    const handlePublish = async (id) => {
        try {
            await apiClient.patch(`/faculty/quizzes/${id}/publish`)
            setQuizzes(p => p.map(q => q.id === id ? { ...q, status: 'published' } : q))
        } catch (err) {
            alert('Failed to publish quiz: ' + (err.response?.data?.detail || err.message))
        }
    }
    const handleUnpublish = async (id) => {
        if (!confirm('Unpublishing will hide this quiz from students. Continue?')) return
        try {
            await apiClient.patch(`/faculty/quizzes/${id}/unpublish`)
            setQuizzes(p => p.map(q => q.id === id ? { ...q, status: 'draft' } : q))
        } catch (err) {
            alert('Failed to unpublish quiz: ' + (err.response?.data?.detail || err.message))
        }
    }
    const toggleResults = async (id, currentState) => {
        try {
            await apiClient.patch(`/faculty/quizzes/${id}/publish-results`)
            setQuizzes(p => p.map(q => q.id === id ? { ...q, results_published: !currentState } : q))
        } catch (err) {
            alert('Failed to toggle results: ' + (err.response?.data?.detail || err.message))
        }
    }
    const handleDelete = async (id) => {
        if (!confirm('Delete this quiz?')) return
        try {
            await apiClient.delete(`/faculty/quizzes/${id}`)
            setQuizzes(p => p.filter(q => q.id !== id))
        } catch (err) {
            alert('Failed to delete quiz: ' + (err.response?.data?.detail || err.message))
        }
    }

    const statusVariant = { draft: 'default', published: 'success', closed: 'warning' }
    const paged = quizzes.slice((page - 1) * PER, page * PER)

    const columns = [
        { key: 'subject_name', label: 'Subject' },
        { key: 'section_name', label: 'Section' },
        { key: 'difficulty_level', label: 'Difficulty', render: r => <Badge variant={r.difficulty_level === 'hard' ? 'danger' : r.difficulty_level === 'medium' ? 'warning' : 'info'}>{r.difficulty_level}</Badge> },
        { key: 'deadline', label: 'Deadline', render: r => r.end_time ? new Date(r.end_time).toLocaleDateString() : '—' },
        {
            key: 'status', label: 'Status', render: r => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    {r.status !== 'draft' && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: r.results_published ? 'var(--clr-success)' : 'var(--clr-warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {r.results_published ? '🔓 Results Pub' : '🔒 Results Hidden'}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'actions', label: '', render: r => (
                <div className="actions-cell">
                    {r.status === 'draft' ? (
                        <>
                            <Link to={`/faculty/quiz/edit/${r.id}`}>
                                <button className="action-btn">✏️ Edit</button>
                            </Link>
                            <button className="action-btn primary" onClick={() => handlePublish(r.id)}>✅ Publish</button>
                        </>
                    ) : (
                        <>
                            <button className="action-btn" onClick={() => toggleResults(r.id, r.results_published)}>
                                {r.results_published ? '🚫 Hide Results' : '📢 Pub Results'}
                            </button>
                            <button className="action-btn danger" onClick={() => handleUnpublish(r.id)}>↩️ Unpublish</button>
                        </>
                    )}
                    <Link to={`/faculty/analytics/${r.id}`}><button className="action-btn">📊 Analytics</button></Link>
                    <button className="action-btn danger" onClick={() => handleDelete(r.id)}>🗑️ Delete</button>
                </div>
            )
        },
    ]

    return (
        <div className="app-shell">
            <FacultySidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>My Quizzes</h1><p>Manage quizzes you've created</p></div>
                    <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                        <Link to="/faculty/quiz/create/ai"><Button variant="secondary">🤖 AI Quiz</Button></Link>
                        <Link to="/faculty/quiz/create/manual"><Button>+ New Quiz</Button></Link>
                    </div>
                </div>
                {loading ? <p>Loading...</p> : quizzes.length === 0 ? (
                    <EmptyState icon="📝" title="No quizzes yet" description="Create your first quiz manually or with AI." />
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(quizzes.length / PER)} onPageChange={setPage} />
                    </div>
                )}
            </main>
        </div>
    )
}
