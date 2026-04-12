CREATE TABLE IF NOT EXISTS employee_roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

INSERT INTO employee_roles (name)
VALUES
    ('owner'),
    ('lead'),
    ('manager'),
    ('developer'),
    ('designer'),
    ('qa'),
    ('analyst'),
    ('devops')
ON CONFLICT (name) DO NOTHING;
