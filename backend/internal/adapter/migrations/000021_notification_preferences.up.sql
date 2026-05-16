CREATE TABLE IF NOT EXISTS notification_preferences(
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type notification_type NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY(user_id, notification_type)
);