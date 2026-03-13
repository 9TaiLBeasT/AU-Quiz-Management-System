import './Table.css'

/**
 * columns: [{ key, label, render? }]
 * data:    array of row objects
 * page, totalPages, onPageChange for pagination
 */
export default function Table({ columns, data, page, totalPages, onPageChange, emptyMessage = 'No data found.' }) {
    return (
        <div className="table-wrapper">
            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="table-empty">{emptyMessage}</td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={row.id || i}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="table-pagination">
                    <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>‹ Prev</button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next ›</button>
                </div>
            )}
        </div>
    )
}
