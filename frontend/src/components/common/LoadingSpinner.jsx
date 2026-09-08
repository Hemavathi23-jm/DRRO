export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="empty-state">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
