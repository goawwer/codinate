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

func InitDueSoonWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Hour)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				sendDueSoonNotifications(ctx)
			}
		}
	}()
}

func sendDueSoonNotifications(ctx context.Context) {
	notifRepo := repository.GetNotificationRepo()

	tasks, err := notifRepo.GetTasksDueSoon(ctx)
	if err != nil {
		logger.Errorf("due_soon worker: failed to get tasks: %v", err)
		return
	}

	for _, t := range tasks {
		related, _ := json.Marshal(map[string]any{
			"taskId":         t.Id.String(),
			"taskTitle":      t.Title,
			"taskIdentifier": t.Identifier,
			"dueAt":          t.DueAt.Format(time.RFC3339),
		})

		dueIn := time.Until(t.DueAt)
		var dueLabel string
		switch {
		case dueIn < 24*time.Hour:
			dueLabel = "today"
		default:
			dueLabel = fmt.Sprintf("in %d hours", int(dueIn.Hours()))
		}

		n := model.Notification{
			Id:               uuid.New(),
			UserId:           t.AssigneeId,
			ActorId:          t.AssigneeId,
			NotificationType: "due_soon",
			Related:          related,
			Title:            "Task due soon",
			Body:             fmt.Sprintf(`"%s" is due %s`, t.Title, dueLabel),
		}

		if err := notifRepo.Create(ctx, n); err != nil {
			logger.Errorf("due_soon worker: failed to create notification for task %s: %v", t.Id, err)
		}
	}
}
