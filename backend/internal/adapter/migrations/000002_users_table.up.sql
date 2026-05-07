CREATE TYPE permissions AS ENUM('owner', 'user', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    surname VARCHAR(150) NOT NULL,
    username VARCHAR(64) NOT NULL UNIQUE CHECK (
        LENGTH(username) > 3
        AND LENGTH(username) < 64
    ),
    email VARCHAR(200) NOT NULL UNIQUE CHECK (POSITION('@' IN email) > 1),
    hashed_password TEXT NOT NULL,
    role_id BIGINT NOT NULL REFERENCES employee_roles(id),
    permission_role permissions NOT NULL,
    avatar TEXT,
    profile_description TEXT,
    backgroud_profile_picture TEXT,
    disabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);