package database

import (
	"context"
	"database/sql"
	"errors"
	"sync/atomic"
	"time"

	"github.com/jmoiron/sqlx"
)

type database interface {
	Exec(query string, args ...any) (sql.Result, error)
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sqlx.Rows, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sqlx.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sqlx.Row
	GetContext(ctx context.Context, dst any, query string, args ...any) error
	NamedQueryContext(ctx context.Context, query string, arg any) (*sqlx.Rows, error)

	RunInTransaction(ctx context.Context, fn func(tx *sqlx.Tx) error) error
}

type CoreRepository struct {
	database
}

type config struct {
	Name               string `mapstructure:"DB_NAME"`
	Host               string `mapstructure:"DB_HOST"`
	Port               int    `mapstructure:"DB_PORT"`
	User               string `mapstructure:"DB_USER"`
	Password           string `mapstructure:"DB_PASSWORD"`
	PoolSize           int    `mapstructure:"DB_POOLSIZE"`
	IdleTimeoutMinute  int    `mapstructure:"DB_IDLE_TIMEOUT_MINUTE"`
	MaxIdleConns       int    `mapstructure:"DB_MAX_IDLE_CONNS"`
	MaxRetries         int    `mapstructure:"DB_MAX_RETRIES"`
	ReadTimeoutMinute  int    `mapstructure:"DB_READ_TIMEOUT_MINUTE"`
	WriteTimeoutMinute int    `mapstructure:"DB_WRITE_TIMEOUT_MINUTE"`

	URL string `mapstructure:"DB_URL"`
}

// database for unit tests
type configTest struct {
	TestName string `mapstructure:"DB_TEST_NAME"`
	Host     string `mapstructure:"DB_HOST"`
	TestPort int    `mapstructure:"DB_TEST_PORT"`
	User     string `mapstructure:"DB_USER"`
	Password string `mapstructure:"DB_PASSWORD"`

	TestURL string `mapstructure:"DB_TEST_URL"`
}

type masterDatabase struct {
	DB         *sqlx.DB
	isAlive    atomic.Bool
	pingTicker *time.Ticker
	config     *config
}

type healthStatus struct {
	LastPingSuccess time.Time
	LastPingFailure time.Time
	LastError       string
	FailureCount    int64
}

type databaseWrapper struct {
	*masterDatabase
}

var (
	ErrorAllPingRetries = errors.New("failed to ping database after all retries")
)
