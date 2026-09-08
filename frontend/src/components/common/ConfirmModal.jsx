// src/components/common/ConfirmModal.jsx
export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmClass = 'btn btn-danger', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p className="modal-title">{title}</p>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={confirmClass} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
