CREATE TABLE IF NOT EXISTS teams(
    id BIGSERIAL PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    picture_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);