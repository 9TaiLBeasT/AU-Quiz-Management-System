import { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
    const { signIn, profile, loading: authLoading, profileMissing } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect once profile is loaded
    useEffect(() => {
        if (!authLoading && profile) {
            const dest = { admin: '/admin', faculty: '/faculty', student: '/student' }
            navigate(dest[profile.role] || '/', { replace: true })
        }
    }, [authLoading, profile, navigate])

    // If login succeeded but no profile row exists in DB, stop the spinner and show error
    useEffect(() => {
        if (profileMissing) {
            setLoading(false)
            setError('Your account is not set up yet. Ask your administrator to add your profile.')
        }
    }, [profileMissing])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(email, password)
            // Navigation is handled by the useEffect above once profile loads
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-orb orb-1" />
                <div className="login-orb orb-2" />
            </div>
            <div className="login-card animate-fadein">
                <div className="login-header">
                    <div className="login-logo">⚡</div>
                    <h1>AU Quiz</h1>
                    <p>University Assessment Platform</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <span className="login-spinner" /> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="login-footer-note">
                    Access is restricted to university staff and students only.
                    Contact your administrator if you need an account.
                </p>
            </div>
        </div>
    )
}
