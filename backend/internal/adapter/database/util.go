package database

import (
	"context"
	"fmt"
	"time"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/jmoiron/sqlx"
)

func pingWithRetry(ctx context.Context, db *sqlx.DB, maxRetries int) error {
	for i := range maxRetries {

		err := db.PingContext(ctx)

		if err == nil {
			return nil
		}

		fmt.Print(err.Error())

		stats.LastError = err.Error()

		logger.Warnf("failed ping after %d attempt", i)

		// only if not the last attempt
		if i < maxRetries-1 {
			select {
			case <-time.After(time.Second * 2):
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}

	return ErrorAllPingRetries
}
