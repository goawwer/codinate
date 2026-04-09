CREATE TABLE IF NOT EXISTS task_categories(
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    name VARCHAR(200) NOT NULL,
    UNIQUE (project_id, name)
);