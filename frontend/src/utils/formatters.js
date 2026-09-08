// src/utils/formatters.js
export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatQty = (n, unit = '') => {
  if (n == null) return '—';
  return `${Number(n).toLocaleString()} ${unit}`.trim();
};

export const statusLabel = (s) => (s || '').replace(/_/g, ' ');

export const urgencyColor = (u) => {
  const map = { CRITICAL: 'danger', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
  return map[u] || 'low';
};
