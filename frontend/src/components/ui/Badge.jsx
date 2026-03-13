/**
 * variant: 'success' | 'warning' | 'danger' | 'info' | 'default'
 */
const colors = {
    success: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    warning: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    danger: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    info: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    default: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
}

export default function Badge({ children, variant = 'default' }) {
    const c = colors[variant] || colors.default
    return (
        <span style={{
            background: c.bg, color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 'var(--radius-full)',
            padding: '2px 10px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            display: 'inline-flex', alignItems: 'center',
            whiteSpace: 'nowrap',
        }}>
            {children}
        </span>
    )
}
