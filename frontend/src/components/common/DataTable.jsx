// src/components/common/DataTable.jsx
import { useState } from 'react';

export default function DataTable({ columns, data, emptyMessage = 'No records found.' }) {
  const [search, setSearch] = useState('');

  const filtered = data.filter(row =>
    columns.some(col => {
      const val = col.accessor ? row[col.accessor] : '';
      return String(val ?? '').toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <input
          className="form-input"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <span className="text-muted">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table className="data-table">
          <thead>
            <tr>{columns.map(col => <th key={col.key || col.label}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{emptyMessage}</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key || col.label}>
                      {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
