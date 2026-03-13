import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/academic', label: 'Academic Structure', icon: '🎓' },
    { label: '──────', divider: true },
    { to: '/admin/faculty', label: 'Faculty', icon: '👨‍🏫' },
    { to: '/admin/students', label: 'Students', icon: '👨‍🎓' },
    { label: '──────', divider: true },
    { to: '/admin/quizzes', label: 'All Quizzes', icon: '📝' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: '🔒' },
]

export default function AdminSidebar() {
    const { signOut, profile } = useAuth()
    const navigate = useNavigate()
    const handleSignOut = async () => { await signOut(); navigate('/login') }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">⚡</span>
                <span className="sidebar-logo-text">AU Quiz</span>
                <span className="sidebar-role-badge">Admin</span>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item, i) =>
                    item.divider ? (
                        <div key={i} className="sidebar-divider" />
                    ) : (
                        <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    )
                )}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{profile?.full_name?.[0]?.toUpperCase() || 'A'}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile?.full_name || 'Admin'}</span>
                        <span className="sidebar-user-role">Administrator</span>
                    </div>
                </div>
                <button className="sidebar-signout" onClick={handleSignOut}>Sign Out</button>
            </div>
        </aside>
    )
}
