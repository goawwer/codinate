package database

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

var (
	databaseMasterVariable *masterDatabase
	stats                  *healthStatus
)

func Initialize(ctx context.Context) error {
	cfg, err := loadDabaseConfig()
	if err != nil {
		logger.Errorf("failed to load database configuration: %v", err)
		return err
	}

	db, err := sqlx.Open("postgres", cfg.URL)
	if err != nil {
		logger.Errorf("failed to open database connection: %v", err)
		return err
	}

	db.SetMaxOpenConns(cfg.PoolSize)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxIdleTime(time.Duration(cfg.IdleTimeoutMinute) * time.Minute)
	db.SetConnMaxLifetime(time.Duration(cfg.MaxRetries) * time.Minute)

	if err := pingWithRetry(ctx, db, 3); err != nil {
		logger.Errorf("failed to ping database after retries: %v", err)
		db.Close()
		return err
	}

	databaseMasterVariable = &masterDatabase{
		DB:         db,
		pingTicker: time.NewTicker(time.Second * 30),
		config:     cfg,
	}

	databaseMasterVariable.isAlive.Store(true)

	stats = &healthStatus{
		LastPingSuccess: time.Now(),
	}

	go databaseMasterVariable.healthMonitor(ctx)

	logger.Infof("Database successfully initialized with: %+v", cfg)

	return nil
}

func loadDabaseConfig() (*config, error) {
	var cfg config

	if err := viper.Unmarshal(&cfg); err != nil {
		logger.Errorf("failed to load database config: %v", err)
		return nil, err
	}

	setupDefaults(&cfg)

	return &cfg, nil
}

func setupDefaults(cfg *config) {
	if util.IsAnyStringEmpty(cfg.Name, cfg.Host, strconv.Itoa(cfg.Port), cfg.User, cfg.Password) {
		logger.Errorf("database configuration is incomplete: name=%s host=%s port=%d user=%s password=%s",
			cfg.Name, cfg.Host, cfg.Port, cfg.User, cfg.Password)
		panic(fmt.Errorf("database configuration is incomplete: name=%s host=%s port=%d user=%s password=%s",
			cfg.Name, cfg.Host, cfg.Port, cfg.User, cfg.Password))
	}

	if cfg.PoolSize == 0 {
		cfg.PoolSize = 10
	}

	if cfg.IdleTimeoutMinute == 0 {
		cfg.IdleTimeoutMinute = 5
	}

	if cfg.MaxIdleConns == 0 {
		cfg.MaxIdleConns = 2
	}

	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = 3
	}

	if cfg.ReadTimeoutMinute == 0 {
		cfg.ReadTimeoutMinute = 3
	}

	if cfg.WriteTimeoutMinute == 0 {
		cfg.WriteTimeoutMinute = 5
	}
}
