CREATE TABLE mentions (
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID        NOT NULL,
    mentioned_user_id UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (entity_type, entity_id, mentioned_user_id)
);

CREATE INDEX idx_mentions_user_id ON mentions(mentioned_user_id);