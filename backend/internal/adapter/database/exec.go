package database

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/jmoiron/sqlx"
)

// MASTER DATABASE
func CloseMasterDatabase() {
	databaseMasterVariable.close()
}

func GetMasterDatabase() *masterDatabase {
	return databaseMasterVariable
}

// TEST ENVIRONMENT
func GetTestDatabase() *sqlx.DB {
	return testDatabase.DB
}

func CloseTestDatabase() error {
	return testDatabase.Close()
}

// WRAPPER
func GetCoreRepository() *CoreRepository {
	return &CoreRepository{
		databaseWrapper{
			databaseMasterVariable,
		},
	}
}

func (db databaseWrapper) SelectContext(ctx context.Context, dst any, query string, args ...any) error {
	start := time.Now()
	err := db.DB.SelectContext(ctx, dst, query, args...)
	duration := time.Since(start)

	db.logIfNeeded("SelectContext", query, duration, err)
	return err
}

func (db databaseWrapper) Exec(query string, args ...any) (sql.Result, error) {
	start := time.Now()
	result, err := db.DB.Exec(query, args...)
	duration := time.Since(start)

	db.logIfNeeded("Exec", query, duration, err)
	return result, err
}

func (db databaseWrapper) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	start := time.Now()
	result, err := db.DB.ExecContext(ctx, query, args...)
	duration := time.Since(start)

	db.logIfNeeded("ExecContext", query, duration, err)
	return result, err
}

func (db databaseWrapper) Query(query string, args ...any) (*sqlx.Rows, error) {
	start := time.Now()
	rows, err := db.DB.Queryx(query, args...)
	duration := time.Since(start)

	db.logIfNeeded("Query", query, duration, err)
	return rows, err
}

func (db databaseWrapper) QueryContext(ctx context.Context, query string, args ...any) (*sqlx.Rows, error) {
	start := time.Now()
	rows, err := db.DB.QueryxContext(ctx, query, args...)
	duration := time.Since(start)

	db.logIfNeeded("QueryContext", query, duration, err)
	return rows, err
}

func (db databaseWrapper) QueryRowContext(ctx context.Context, query string, args ...any) *sqlx.Row {
	start := time.Now()
	row := db.DB.QueryRowxContext(ctx, query, args...)
	duration := time.Since(start)

	db.logIfNeeded("QueryRowContext", query, duration, nil)

	return row
}

func (db databaseWrapper) NamedQueryContext(ctx context.Context, query string, arg any) (*sqlx.Rows, error) {
	start := time.Now()
	rows, err := db.DB.NamedQueryContext(ctx, query, arg)
	duration := time.Since(start)

	db.logIfNeeded("NamedQueryContext", query, duration, err)

	return rows, err
}

func (db databaseWrapper) GetContext(ctx context.Context, dst any, query string, args ...any) error {
	start := time.Now()
	err := db.GetContext(ctx, dst, query, args...)
	duration := time.Since(start)

	db.logIfNeeded("GetContext", query, duration, err)
	return err
}

func (db databaseWrapper) RunInTransaction(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
	tx, err := db.DB.BeginTxx(ctx, nil)
	if err != nil {
		logger.Errorf("failed to begin transaction: %v", err.Error())
		return err
	}

	defer func() {
		if err != nil {
			if err := tx.Rollback(); err != nil {
				logger.Errorf("failed to rollback transaction: %v", err)
			}
		} else {
			if err := tx.Commit(); err != nil {
				logger.Errorf("failed to commit transaction: %v", err)
			}
		}
	}()

	return fn(tx)
}

func (db *databaseWrapper) logIfNeeded(operation string, query string, duration time.Duration, err error) {
	const maxLen = 400
	const slowTreshold = 2 * time.Second

	cleanQuery := strings.ReplaceAll(query, "\t", " ")
	cleanQuery = strings.ReplaceAll(cleanQuery, "\n", " ")
	if len(cleanQuery) > maxLen {
		cleanQuery = cleanQuery[:maxLen]
	}

	fields := map[string]any{
		"operation": operation,
		"duration":  duration,
		"query":     cleanQuery,
	}

	if err != nil {
		fields["error"] = err.Error()
	}

	if err != nil && !strings.Contains(cleanQuery, "ROLLBACK") {
		logger.ErrorWithFields(fields, "Database query failed")
	} else if duration > slowTreshold {
		logger.WarnWithFields(fields, "Slow query detected")
	}
}
