CREATE TABLE IF NOT EXISTS tasks(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    project_id BIGINT NOT NULL REFERENCES projects(id),
    release_id BIGINT NOT NULL REFERENCES project_releases(id),
    category_id BIGINT NOT  NULL REFERENCES task_categories(id),
    priority_id BIGINT NOT NULL REFERENCES task_priorities(id),
    status_id BIGINT NOT NULL REFERENCES task_statuses(id),
    identifier BIGINT NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    attached_files_ids UUID[],
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    UNIQUE (project_id, identifier)
);

CREATE INDEX idx_tasks_project_id   ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id  ON tasks(assignee_id);
CREATE INDEX idx_tasks_status_id    ON tasks(status_id);
CREATE INDEX idx_tasks_release_id   ON tasks(release_id);