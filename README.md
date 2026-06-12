# Codinate

Платформа для управления проектами и командами: задачи, релизы, статистика, лента активности и уведомления.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Go 1.25, chi, sqlx, PostgreSQL, JWT |
| Frontend | Angular 20, Taiga UI, nginx |
| Инфраструктура | Docker Compose, golang-migrate |

Все сервисы поднимаются через `docker compose`. nginx во frontend-контейнере отдаёт SPA и проксирует API на backend, поэтому наружу торчит только один порт.

---

## Требования

- [Docker](https://docs.docker.com/get-docker/) 24+
- Docker Compose v2+

---

## Быстрый старт

### 1. Настроить окружение

```bash
mv .env.example .env
```

Обязательно заполни в `.env`:

| Переменная | Описание |
|-----------|----------|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Доступы к базе |
| `SECRET_KEY` | Ключ подписи JWT — `openssl rand -hex 32` |
| `OWNER_*` | Данные первого владельца (см. шаг 3) |

Остальное имеет рабочие значения по умолчанию.

### 2. Запустить

```bash
docker compose up --build -d
```

Поднимутся три контейнера: `codinate_db`, `codinate_backend`, `codinate_frontend`.
Миграции БД накатываются автоматически при старте backend.

Приложение откроется на `http://localhost` (порт задаётся в `FRONTEND_PORT`).

### 3. Создать владельца

Имя, фамилия, username и email берутся из `.env` (`OWNER_NAME`, `OWNER_SURNAME`, `OWNER_USERNAME`, `OWNER_EMAIL`). Пароль вводится интерактивно и нигде не сохраняется:

```bash
docker exec -it codinate_backend ./codinate-backend create_owner
```

> Флаг `-it` обязателен — без него терминал не сможет запросить пароль.

После этого можно войти в систему под созданным владельцем.

---

## Режимы сборки backend

Backend собирается с build-тегами, которые управляются переменной `BUILD_TAGS`:

| Тег | Что делает |
|-----|-----------|
| `prod` | Конфиг читается из переменных окружения (нужно для Docker). Без него backend требует файл `-config`. |
| `swagger` | Включает Swagger UI на `/swagger/index.html`. |

**Прод (по умолчанию):**

```bash
docker compose up --build -d
```

**Со Swagger (для разработки):**

```bash
BUILD_TAGS="prod swagger" docker compose build backend
docker compose up -d backend
```

Swagger будет доступен на `http://localhost/swagger/index.html`.

---

## Миграции

Команды в `Makefile` работают локально (нужны `migrate` CLI и заполненный `.env`):

```bash
make migrate_create name=add_something   # создать миграцию
make migrate_up                          # накатить
make migrate_down                        # откатить
make migrate_force v=<version>           # выставить версию вручную
```

В Docker миграции применяются автоматически при запуске backend.

---

## Управление

```bash
docker compose logs backend --tail=50    # логи backend
docker compose restart backend           # перезапустить сервис
docker compose down                      # остановить (данные сохраняются)
docker compose down -v                   # остановить и удалить данные БД
```

Загруженные файлы и логи лежат на хосте: `${UPLOADS_DIR}` и `${LOG_DIR}` (по умолчанию `./data/uploads` и `./data/logs`).

---