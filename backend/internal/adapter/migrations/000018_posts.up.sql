CREATE TYPE post_types AS ENUM('poll', 'announcement', 'basic');
CREATE TYPE post_parent_type AS ENUM('project', 'team');

CREATE TABLE IF NOT EXISTS posts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    parent_type post_parent_type NOT NULL,
    parent_id   BIGINT NOT NULL,
    post_type   post_types NOT NULL DEFAULT 'basic',
    title VARCHAR(150) NOT NULL,
    body TEXT,
    attached_files_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_parent ON posts(parent_type, parent_id);