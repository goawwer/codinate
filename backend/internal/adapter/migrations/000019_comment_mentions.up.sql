CREATE TABLE IF NOT EXISTS comment_mentions(
    comment_id UUID REFERENCES task_comments(id),
    mentioned_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY(comment_id, mentioned_user_id)
);

CREATE INDEX idx_comment_mentions_user_id ON comment_mentions(mentioned_user_id);