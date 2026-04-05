include .env

login_db:
	psql ${DB_URL}

login_test_db:
	psql ${DB_TEST_URL}

migrate_create:
	migrate create -ext sql -dir backend/internal/adapter/migrations -seq $(name)

migrate_up:
	migrate -database ${DB_URL} -path backend/internal/adapter/migrations up

migrate_down:
	migrate -database ${DB_URL} -path backend/internal/adapter/migrations down

migrate_force:
	migrate -database ${DB_URL} -path backend/internal/adapter/migrations force $(v)
