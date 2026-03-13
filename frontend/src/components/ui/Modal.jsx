import { useEffect } from 'react'
import './Modal.css'
import Button from './Button'

export default function Modal({ open, title, onClose, onConfirm, confirmText = 'Confirm', confirmVariant = 'primary', loading, children }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">{children}</div>
                {onConfirm && (
                    <div className="modal-footer">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
