export function BentoGrid({ children, className = '' }) {
  return <div className={`bento-grid ${className}`.trim()}>{children}</div>;
}

export function BentoTile({ title, action, children, span = 'stat', className = '' }) {
  return (
    <section className={`bento-tile bento-tile--${span} ${className}`.trim()}>
      {(title || action) && (
        <div className="bento-tile-head">
          {title && <h2 className="bento-tile-title">{title}</h2>}
          {action}
        </div>
      )}
      <div className="bento-tile-body">{children}</div>
    </section>
  );
}
