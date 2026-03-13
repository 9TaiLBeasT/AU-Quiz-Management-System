export default function EmptyState({ icon = '📭', title, description, action }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 'var(--sp-4)', padding: 'var(--sp-12)', textAlign: 'center',
            background: 'var(--clr-surface)', borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--clr-border)',
        }}>
            <div style={{ fontSize: '3rem' }}>{icon}</div>
            <h3 style={{ color: 'var(--clr-text)' }}>{title}</h3>
            {description && <p style={{ color: 'var(--clr-text-muted)', maxWidth: 360 }}>{description}</p>}
            {action && action}
        </div>
    )
}
