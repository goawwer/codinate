CREATE TABLE IF NOT EXISTS task_participants(
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role BIGINT NOT NULL REFERENCES employee_roles(id),
    joined_At TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY(task_id, user_id)
);

CREATE INDEX idx_task_participants_user_id ON task_participants(user_id);