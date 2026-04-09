CREATE TYPE release_status AS ENUM('active', 'finished', 'archived', 'closed');

CREATE TABLE IF NOT EXISTS project_releases(
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status release_status,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    UNIQUE (project_id, title)
);