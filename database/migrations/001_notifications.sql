-- DRRO migration: notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    type            VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL DEFAULT 'INFO',
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    action_url      VARCHAR(255),
    user_id         BIGINT REFERENCES users(user_id),
    is_read         BOOLEAN DEFAULT FALSE,
    sms_status      VARCHAR(30),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
