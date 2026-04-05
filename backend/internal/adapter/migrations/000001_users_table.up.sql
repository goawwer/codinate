CREATE TYPE user_role AS ENUM('owner', 'user', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    surname VARCHAR(150) NOT NULL,
    username VARCHAR(64) NOT NULL UNIQUE CHECK (
        LENGTH(username) > 3
        AND LENGTH(username) < 64
    ),
    email VARCHAR(200) NOT NULL UNIQUE CHECK (POSITION('@' IN email) > 1),
    hashed_password TEXT NOT NULL,
    role user_role NOT NULL,
    profile_picture_path TEXT,
    disabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);