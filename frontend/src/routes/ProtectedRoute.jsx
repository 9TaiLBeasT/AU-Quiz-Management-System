import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'

/**
 * allowedRoles: array of roles allowed, e.g. ['admin'] or ['faculty', 'admin']
 * If not provided, just requires authentication.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
    const { session, profile, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spinner size={48} />
            </div>
        )
    }

    if (!session) return <Navigate to="/login" replace />

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}
