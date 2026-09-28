/**
 * Reusable filter system for list pages.
 *
 * filters: [
 *   { key: 'status', label: 'Status', type: 'chips', options: [{ value: 'ALL', label: 'All' }, ...] },
 *   { key: 'urgency', label: 'Urgency', type: 'chips', options: [...] },
 *   { key: 'q', label: 'Search', type: 'search', placeholder: 'Search…' },
 *   { key: 'centerId', label: 'Center', type: 'select', options: [...] },
 *   { key: 'lowStock', label: 'Low stock only', type: 'toggle' },
 * ]
 *
 * values: { [key]: string | boolean }
 * onChange: (key, value) => void
 * onClear?: () => void
 */
export default function FilterBar({ filters = [], values = {}, onChange, onClear, resultCount }) {
  const activeCount = filters.reduce((n, f) => {
    const v = values[f.key];
    if (f.type === 'toggle') return n + (v ? 1 : 0);
    if (f.type === 'search') return n + (v && String(v).trim() ? 1 : 0);
    if (v && v !== 'ALL' && v !== '') return n + 1;
    return n;
  }, 0);

  return (
    <div className="filters-panel">
      <div className="filters-panel-head">
        <div className="filters-panel-title">
          Filters
          {activeCount > 0 && <span className="filters-count">{activeCount} active</span>}
        </div>
        <div className="filters-panel-meta">
          {resultCount != null && (
            <span className="text-muted">{resultCount} result{resultCount === 1 ? '' : 's'}</span>
          )}
          {activeCount > 0 && onClear && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="filters-panel-body">
        {filters.map((f) => {
          if (f.type === 'chips') {
            return (
              <div className="filter-group" key={f.key}>
                {f.label && <span className="filter-group-label">{f.label}</span>}
                <div className="filter-chips">
                  {(f.options || []).map((opt) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string'
                      ? (opt === 'ALL' ? 'All' : opt.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()))
                      : opt.label;
                    const selected = (values[f.key] ?? 'ALL') === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`filter-chip${selected ? ' active' : ''}`}
                        onClick={() => onChange(f.key, value)}
                        aria-pressed={selected}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (f.type === 'search') {
            return (
              <div className="filter-group filter-group--grow" key={f.key}>
                {f.label && <span className="filter-group-label">{f.label}</span>}
                <input
                  type="search"
                  className="form-input filter-search"
                  placeholder={f.placeholder || 'Search…'}
                  value={values[f.key] || ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  aria-label={f.label || 'Search'}
                />
              </div>
            );
          }

          if (f.type === 'select') {
            return (
              <div className="filter-group" key={f.key}>
                {f.label && <span className="filter-group-label">{f.label}</span>}
                <select
                  className="form-select filter-select"
                  value={values[f.key] ?? 'ALL'}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  aria-label={f.label}
                >
                  {(f.options || []).map((opt) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return (
                      <option key={value} value={value}>{label}</option>
                    );
                  })}
                </select>
              </div>
            );
          }

          if (f.type === 'toggle') {
            return (
              <label className="filter-toggle" key={f.key}>
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) => onChange(f.key, e.target.checked)}
                />
                <span>{f.label}</span>
              </label>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
