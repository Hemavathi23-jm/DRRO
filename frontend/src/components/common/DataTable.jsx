import { useState } from 'react';

/**
 * Responsive data table:
 * - Desktop: classic table
 * - Mobile: stacked cards (avoids cramped multi-column layouts)
 */
export default function DataTable({ columns, data, emptyMessage = 'No records found.', searchable = true }) {
  const [search, setSearch] = useState('');

  const filtered = data.filter((row) =>
    columns.some((col) => {
      const val = col.accessor ? row[col.accessor] : '';
      return String(val ?? '').toLowerCase().includes(search.toLowerCase());
    }),
  );

  return (
    <div className="data-table-wrap">
      {searchable && (
        <div className="data-table-toolbar">
          <input
            className="form-input data-table-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search table"
          />
          <span className="text-muted">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="data-table-empty">{emptyMessage}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="data-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key || col.label}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id ?? i}>
                    {columns.map((col) => (
                      <td key={col.key || col.label}>
                        {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="data-table-mobile stack-list" aria-label="Records">
            {filtered.map((row, i) => (
              <div className="stack-card stack-card--static data-card" key={row.id ?? i}>
                {columns.map((col, idx) => {
                  const content = col.render
                    ? col.render(row)
                    : (col.accessor ? row[col.accessor] : '—');
                  const isPrimary = idx === 0;
                  if (isPrimary) {
                    return (
                      <div className="data-card-primary" key={col.key || col.label}>
                        <div className="stack-card-title">{content}</div>
                      </div>
                    );
                  }
                  return (
                    <div className="data-card-row" key={col.key || col.label}>
                      <span className="data-card-label">{col.label}</span>
                      <span className="data-card-value">{content}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
