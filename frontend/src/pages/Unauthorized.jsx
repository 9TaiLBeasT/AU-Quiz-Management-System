import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Unauthorized.css'

export default function Unauthorized() {
    const { profile } = useAuth()
    const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'faculty' ? '/faculty' : '/student'

    return (
        <div className="unauthorized-page">
            <div className="unauthorized-card">
                <div className="unauthorized-icon">🚫</div>
                <h1>Access Denied</h1>
                <p>You don't have permission to view this page.</p>
                <Link to={home} className="btn-primary">Go to my Dashboard</Link>
            </div>
        </div>
    )
}
