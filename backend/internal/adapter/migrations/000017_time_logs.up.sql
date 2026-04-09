CREATE TABLE IF NOT EXISTS time_logs(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id BIGINT NOT NULL REFERENCES projects(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    description TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    total_minutes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_time_logs_user_id  ON time_logs(user_id);
CREATE INDEX idx_time_logs_task_id  ON time_logs(task_id);
CREATE INDEX idx_time_logs_project_id  ON time_logs(project_id);