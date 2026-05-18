package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
)

func InitLeaderboardWorker(ctx context.Context) {
	recalculate := func() {
		if err := repository.GetWorklogRepo().RecalculateLeaderboard(ctx); err != nil {
			logger.Errorf("leaderboard recalculation failed: %v", err)
			return
		}
		sendRankNotifications(ctx)
		pruneOldNotifications(ctx)
	}

	go recalculate()

	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				recalculate()
			}
		}
	}()
}

func pruneOldNotifications(ctx context.Context) {
	cutoff := time.Now().AddDate(0, -1, 0)
	if err := repository.GetNotificationRepo().DeleteOlderThan(ctx, cutoff); err != nil {
		logger.Errorf("notification pruning failed: %v", err)
	}
}

func sendRankNotifications(ctx context.Context) {
	notifRepo := repository.GetNotificationRepo()

	top, err := notifRepo.GetLeaderboardTop3(ctx)
	if err != nil {
		logger.Errorf("rank notification: failed to get top-3: %v", err)
		return
	}

	for _, entry := range top {
		already, err := notifRepo.HasRankNotificationToday(ctx, entry.UserId)
		if err != nil || already {
			continue
		}

		related, _ := json.Marshal(map[string]any{
			"rank":         entry.Rank,
			"totalMinutes": entry.TotalMinutes,
		})

		medals := map[int]string{1: "🥇", 2: "🥈", 3: "🥉"}
		medal := medals[entry.Rank]

		n := model.Notification{
			Id:               uuid.New(),
			UserId:           entry.UserId,
			ActorId:          entry.UserId,
			NotificationType: "rank",
			Related:          related,
			Title:            fmt.Sprintf("You're #%d on the leaderboard! %s", entry.Rank, medal),
			Body:             fmt.Sprintf("You logged %d minutes total this period.", entry.TotalMinutes),
		}

		if err := notifRepo.Create(ctx, n); err != nil {
			logger.Errorf("rank notification: failed to create for user %s: %v", entry.UserId, err)
		}
	}
}
