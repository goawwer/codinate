CREATE TABLE IF NOT EXISTS files(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES users(id),   -- missing
    name        TEXT NOT NULL,
    size        BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp  -- missing
);