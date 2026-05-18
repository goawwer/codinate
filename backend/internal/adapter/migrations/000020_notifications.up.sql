CREATE TYPE notification_type AS ENUM('mention', 'post', 'task', 'rank', 'due_soon');

CREATE TABLE IF NOT EXISTS notifications(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    notification_type notification_type NOT NULL DEFAULT 'mention',
    related JSONB NOT NULL,
    title VARCHAR(150),
    body TEXT,
    received_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;