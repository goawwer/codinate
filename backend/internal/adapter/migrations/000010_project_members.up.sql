CREATE TABLE IF NOT EXISTS project_members(
    project_id BIGINT NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role BIGINT NOT NULL REFERENCES employee_roles(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user_id ON project_members(user_id);