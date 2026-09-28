export default function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon,
}) {
  return (
    <div className="empty-state">
      {icon !== false && (
        <div className="empty-state-icon" aria-hidden>
          {icon || (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}
