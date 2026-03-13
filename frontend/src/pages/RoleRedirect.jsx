import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const roleHome = {
    admin: '/admin',
    faculty: '/faculty',
    student: '/student',
}

export default function RoleRedirect() {
    const { profile, loading } = useAuth()
    if (loading) return null
    if (!profile) return <Navigate to="/unauthorized" replace />
    return <Navigate to={roleHome[profile.role] || '/unauthorized'} replace />
}
