import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

export default function CriticalAlertModal() {
  const { criticalAlert, dismissCritical } = useNotifications();
  const navigate = useNavigate();

  if (!criticalAlert) return null;

  return (
    <div className="alert-overlay" role="alertdialog" aria-modal="true">
      <div className="alert-modal">
        <div className="alert-modal-header">
          <h3>{criticalAlert.title}</h3>
        </div>
        <p style={{ fontSize: '0.857rem', color: 'var(--text-secondary)' }}>{criticalAlert.message}</p>
        <div className="alert-modal-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              dismissCritical(criticalAlert);
              navigate(criticalAlert.actionUrl || '/requests');
            }}
          >
            Review Request
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => dismissCritical(criticalAlert)}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
