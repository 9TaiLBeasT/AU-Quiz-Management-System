import './Button.css'

/**
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 * size:    'sm' | 'md' | 'lg'
 */
export default function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? <span className="btn-spinner" /> : null}
            {children}
        </button>
    )
}
