import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Table from '../../components/ui/Table'
import apiClient from '../../services/api'
import '../../styles/PageLayout.css'

export default function AuditLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const PER = 20

    useEffect(() => {
        setLoading(true)
        apiClient.get('/admin/audit-logs').then(r => setLogs(r.data)).finally(() => setLoading(false))
    }, [])

    const paged = logs.slice((page - 1) * PER, page * PER)
    const columns = [
        { key: 'created_at', label: 'Timestamp', render: r => new Date(r.created_at).toLocaleString() },
        { key: 'actor', label: 'Actor', render: r => <span style={{ color: 'var(--clr-accent)' }}>{r.actor_email}</span> },
        { key: 'action', label: 'Action', render: r => <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>{r.action}</code> },
        { key: 'details', label: 'Details', render: r => <span style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--font-size-sm)' }}>{r.details}</span> },
    ]

    return (
        <div className="app-shell">
            <AdminSidebar />
            <main className="main-content animate-fadein">
                <div className="page-header">
                    <div><h1>Audit Logs</h1><p>System activity trail ({logs.length} entries)</p></div>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <Table columns={columns} data={paged} page={page} totalPages={Math.ceil(logs.length / PER)} onPageChange={setPage} emptyMessage="No audit logs found." />
                    </div>
                )}
            </main>
        </div>
    )
}
