import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const navItems = [
    { to: '/faculty', label: 'Dashboard', icon: '🏠' },
    { to: '/faculty/quizzes', label: 'My Quizzes', icon: '📝' },
    { label: '──────', divider: true },
    { to: '/faculty/quiz/create/manual', label: 'Create (Manual)', icon: '✏️' },
    { to: '/faculty/quiz/create/ai', label: 'Create (AI)', icon: '🤖' },
    { to: '/faculty/quiz/create/pdf', label: 'Create (PDF)', icon: '📄' },
]

export default function FacultySidebar() {
    const { signOut, profile } = useAuth()
    const navigate = useNavigate()
    const handleSignOut = async () => { await signOut(); navigate('/login') }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">⚡</span>
                <span className="sidebar-logo-text">AU Quiz</span>
                <span className="sidebar-role-badge faculty">Faculty</span>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item, i) =>
                    item.divider ? (
                        <div key={i} className="sidebar-divider" />
                    ) : (
                        <NavLink key={item.to} to={item.to} end={item.to === '/faculty'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    )
                )}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{profile?.full_name?.[0]?.toUpperCase() || 'F'}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile?.full_name || 'Faculty'}</span>
                        <span className="sidebar-user-role">Faculty</span>
                    </div>
                </div>
                <button className="sidebar-signout" onClick={handleSignOut}>Sign Out</button>
            </div>
        </aside>
    )
}
