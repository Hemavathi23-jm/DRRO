// src/components/common/StatusBadge.jsx
export default function StatusBadge({ status }) {
  if (!status) return null;
  const str = String(status);
  const key = str.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const label = str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`badge badge-${key}`}>{label}</span>;
}
