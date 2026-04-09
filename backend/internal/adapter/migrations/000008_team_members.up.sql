CREATE TABLE IF NOT EXISTS team_members(
    team_id BIGINT NOT NULL REFERENCES teams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role BIGINT NOT NULL REFERENCES employee_roles(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY(team_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);