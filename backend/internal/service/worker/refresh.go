package worker

import (
	"context"
	"time"

	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
)

func InitRefreshTokensWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Minute * 10)
	go func() {
		for range ticker.C {
			if err := repository.GetAuthRepo().CleanupExpiredRefreshTokens(ctx); err != nil {
				logger.Errorf("failed to delete refresh token: %v", err)
			}
		}
	}()
}
