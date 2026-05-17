CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username     VARCHAR NOT NULL,
    name         VARCHAR NOT NULL DEFAULT '',
    surname      VARCHAR NOT NULL DEFAULT '',
    avatar       VARCHAR NOT NULL DEFAULT '',
    total_minutes BIGINT NOT NULL DEFAULT 0,
    log_count    INTEGER NOT NULL DEFAULT 0,
    rank         INTEGER NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS leaderboard_snapshots_rank_idx ON leaderboard_snapshots(rank);
