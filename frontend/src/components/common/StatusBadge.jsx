// src/components/common/StatusBadge.jsx
export default function StatusBadge({ status }) {
  if (!status) return null;
  const str = String(status);
  const key = str.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return <span className={`badge badge-${key}`}>{str.replace(/_/g, ' ')}</span>;
}
