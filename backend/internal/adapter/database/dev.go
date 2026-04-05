package database

import (
	"context"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/jmoiron/sqlx"
	"github.com/spf13/viper"
)

type testDb struct {
	*sqlx.DB
}

var testDatabase *testDb

func loadTestDatabase() (*configTest, error) {
	var cfg configTest

	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func InitializeTestDatabase(ctx context.Context) error {
	cfg, err := loadTestDatabase()
	if err != nil {
		logger.Errorf("failed to load test database config - %v", err)
		return err
	}

	db, err := sqlx.Open("postgres", cfg.TestURL)
	if err != nil {
		logger.Errorf("failed to validate arguments for test database connection - %v", err)
		return err
	}

	if err := db.PingContext(ctx); err != nil {
		logger.Errorf("failed to ping test database - %v", err)
		return err
	}

	testDatabase = &testDb{db}

	logger.Infof("Test database successfully initialized with: %+v", cfg)

	return nil
}
