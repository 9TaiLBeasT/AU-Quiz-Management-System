import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const navItems = [
    { to: '/student', label: 'Dashboard', icon: '🏠' },
    { to: '/student/quizzes', label: 'My Quizzes', icon: '📝' },
    { to: '/student/history', label: 'My Performance', icon: '📊' },
]

export default function StudentSidebar() {
    const { signOut, profile } = useAuth()
    const navigate = useNavigate()
    const handleSignOut = async () => { await signOut(); navigate('/login') }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">⚡</span>
                <span className="sidebar-logo-text">AU Quiz</span>
                <span className="sidebar-role-badge student">Student</span>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === '/student'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span className="sidebar-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{profile?.full_name?.[0]?.toUpperCase() || 'S'}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile?.full_name || 'Student'}</span>
                        <span className="sidebar-user-role">Student</span>
                    </div>
                </div>
                <button className="sidebar-signout" onClick={handleSignOut}>Sign Out</button>
            </div>
        </aside>
    )
}
