import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function AllQuizzes() {
    const [quizzes, setQuizzes] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const PER = 15

    useEffect(() => {
        setLoading(true)
        apiClient.get('/admin/quizzes').then(r => setQuizzes(r.data)).finally(() => setLoading(false))
    }, [])

    const statusVariant = { draft: 'default', published: 'success', closed: 'warning' }
    const paged = quizzes.slice((page - 1) * PER, page * PER)

    const columns = [
        { key: 'subject_name', label: 'Subject' },
        { key: 'faculty_name', label: 'Faculty' },
        { key: 'section_name', label: 'Section' },
        { key: 'difficulty_level', label: 'Difficulty', render: r => <Badge variant={r.difficulty_level === 'hard' ? 'danger' : r.difficulty_level === 'medium' ? 'warning' : 'info'}>{r.difficulty_level}</Badge> },
        { key: 'deadline', label: 'Deadline', render: r => r.deadline ? new Date(r.deadline).toLocaleDateString() : '—' },
        { key: 'status', label: 'Status', render: r => <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge> },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>All Quizzes</h1><p>System-wide quiz overview ({quizzes.length} total)</p></div>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(quizzes.length / PER)} onPageChange={setPage} emptyMessage="No quizzes in the system yet." />
                    </div>
                )}
            </main>
        </div>
    )
}
