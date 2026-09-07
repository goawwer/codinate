# Codinate

A platform for managing projects and teams: tasks, releases, statistics, activity feed, and notifications.

## Tech Stack

| Layer | Technologies |
|------|-------------|
| Backend | Go 1.25, chi, sqlx, PostgreSQL, JWT |
| Frontend | Angular 20, Taiga UI, nginx |
| Infrastructure | Docker Compose, golang-migrate |

All services are started via `docker compose`. nginx in the frontend container serves the SPA and proxies API requests to the backend, so only a single port is exposed externally.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) 24+
- Docker Compose v2+

---

## Quick Start

### 1. Configure the environment

```bash
mv .env.example .env
````

 Make sure to fill in the following variables in `.env`:

 | Variable | Description |
| --- | --- |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database credentials |
| `SECRET_KEY` | JWT signing key — `openssl rand -hex 32` |
| `OWNER_*` | Initial owner details (see step 3) |

 The remaining variables have working default values.

 ### 2\. Start the application

```
docker compose up --build -d
```

 Three containers will be started: `codinate_db`, `codinate_backend`, and `codinate_frontend`.

 Database migrations are applied automatically when the backend starts.

 The application will be available at `http://localhost` (the port is configured via `FRONTEND_PORT`).

 ### 3\. Create the owner

 The first name, last name, username, and email are taken from `.env` (`OWNER_NAME`, `OWNER_SURNAME`, `OWNER_USERNAME`, `OWNER_EMAIL`). The password is entered interactively and is not stored anywhere:

```
docker exec -it codinate_backend ./codinate-backend create_owner
```

 > The `-it` flags are required — without them, the terminal cannot prompt for the password.

 After that, you can log in using the newly created owner account.

---

 ## Backend Build Modes

 The backend is built with build tags controlled by the `BUILD_TAGS` environment variable:

 | Tag | Description |
| --- | --- |
| `prod` | Reads configuration from environment variables (required for Docker). Without it, the backend requires a `-config` file. |
| `swagger` | Enables Swagger UI at `/swagger/index.html`. |

 **Production (default):**

```
docker compose up --build -d
```

 **With Swagger (for development):**

```
BUILD_TAGS="prod swagger" docker compose build backend
docker compose up -d backend
```

 Swagger will be available at `http://localhost/swagger/index.html`.

---

 ## Migrations

 The `Makefile` commands run locally (`migrate` CLI and a populated `.env` are required):

```
make migrate_create name=add_something   # create a migration
make migrate_up                          # apply migrations
make migrate_down                        # roll back the last migration
make migrate_force v=<version>           # manually set the migration version
```

 In Docker, migrations are applied automatically when the backend starts.

---

 ## Management

```
docker compose logs backend --tail=50    # backend logs
docker compose restart backend           # restart the service
docker compose down                      # stop services (data is preserved)
docker compose down -v                   # stop services and remove database data
```

 Uploaded files and logs are stored on the host in `${UPLOADS_DIR}` and `${LOG_DIR}` (by default, `./data/uploads` and `./data/logs`).

---
