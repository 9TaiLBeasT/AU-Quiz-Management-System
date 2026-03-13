export default function Spinner({ size = 28, color = 'var(--clr-primary)' }) {
    return (
        <div
            style={{
                width: size, height: size,
                border: `3px solid rgba(99,102,241,0.2)`,
                borderTopColor: color,
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
            }}
        />
    )
}
