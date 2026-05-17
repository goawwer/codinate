CREATE TABLE post_parents (
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_type post_parent_type NOT NULL,
    parent_id   BIGINT NOT NULL,
    PRIMARY KEY (post_id, parent_type, parent_id)
);

CREATE INDEX idx_post_parents_parent ON post_parents(parent_type, parent_id);