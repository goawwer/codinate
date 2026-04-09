CREATE TABLE IF NOT EXISTS projects(
    id BIGSERIAL PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    picture_name TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_At TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);