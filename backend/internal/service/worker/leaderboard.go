package worker

import (
	"context"
	"time"

	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
)

func InitLeaderboardWorker(ctx context.Context) {
	recalculate := func() {
		if err := repository.GetWorklogRepo().RecalculateLeaderboard(ctx); err != nil {
			logger.Errorf("leaderboard recalculation failed: %v", err)
		}
	}

	go recalculate()

	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			recalculate()
		}
	}()
}
