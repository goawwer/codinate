CREATE TABLE IF NOT EXISTS task_history(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    comment_id UUID REFERENCES comments(id),
    field_name  TEXT NOT NULL,
    old_value   jsonb,
    new_value   jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_comment_id ON task_history(comment_id);