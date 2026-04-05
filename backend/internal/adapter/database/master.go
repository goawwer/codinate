package database

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/jmoiron/sqlx"
)

func (d *masterDatabase) GetDatabase() *sqlx.DB {
	return d.DB
}

func (d *masterDatabase) IsAlive() bool {
	return d.isAlive.Load()
}

func (d *masterDatabase) close() {
	d.isAlive.Store(false)
	d.pingTicker.Stop()

	if err := d.DB.Close(); err != nil {
		logger.Infof("Failed to close database connection: %v", err)
	}
}

func (d *masterDatabase) healthMonitor(ctx context.Context) {
	var failCounter int64
	var lastErr string

	for {
		select {
		case <-d.pingTicker.C:
			err := d.DB.PingContext(ctx)

			if err == nil {
				d.isAlive.Store(true)
				stats.LastPingSuccess = time.Now()
			} else {
				failCounter++
				atomic.AddInt64(&stats.FailureCount, 1)
				stats.LastPingFailure = time.Now()
				lastErr = err.Error()

				// new error
				if lastErr != stats.LastError {
					logger.Errorf("Database ping failed - %v", lastErr)
					stats.LastError = lastErr
				} else if failCounter%10 == 0 {
					logger.Errorf("Database still down in health monitor after %d failures", failCounter)
				}

				if failCounter >= 2 {
					d.isAlive.Store(false)
				}
			}
		case <-ctx.Done():
			logger.Info("Stopping database health monitor")
			d.pingTicker.Stop()
			return
		}
	}
}
