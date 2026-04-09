CREATE TABLE IF NOT EXISTS post_mentions(
    post_id UUID REFERENCES posts(id),
    mentioned_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY(post_id, mentioned_user_id)
);

CREATE INDEX idx_post_mentions_user_id ON post_mentions(mentioned_user_id);