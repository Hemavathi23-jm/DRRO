export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden />;
}

export function DashboardSkeleton() {
  return (
    <div className="bento-grid" aria-busy="true" aria-label="Loading dashboard">
      <div className="bento-tile bento-tile--map">
        <Skeleton className="skeleton-line lg" />
        <Skeleton className="skeleton-tile" style={{ height: 280 }} />
      </div>
      <div className="bento-tile bento-tile--queue">
        <Skeleton className="skeleton-line lg" />
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-tile" style={{ height: 80 }} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div className="bento-tile bento-tile--stat" key={i}>
          <Skeleton className="skeleton-line" style={{ width: '60%' }} />
          <Skeleton className="skeleton-line lg" />
        </div>
      ))}
    </div>
  );
}
