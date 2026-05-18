package notification

import (
	"context"
	"time"

	notifDto "github.com/goawwer/codinate/internal/adapter/dto/notification"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) list(ctx context.Context, userId uuid.UUID, since *time.Time) ([]notifDto.Row, error) {
	return repository.GetNotificationRepo().GetForUser(ctx, userId, since)
}

func (s *service) markAsRead(ctx context.Context, notifId, userId uuid.UUID) error {
	return repository.GetNotificationRepo().MarkAsRead(ctx, notifId, userId)
}

func (s *service) markAllAsRead(ctx context.Context, userId uuid.UUID) error {
	return repository.GetNotificationRepo().MarkAllAsRead(ctx, userId)
}

func (s *service) unreadCount(ctx context.Context, userId uuid.UUID) (notifDto.UnreadCount, error) {
	count, err := repository.GetNotificationRepo().GetUnreadCount(ctx, userId)
	return notifDto.UnreadCount{Count: count}, err
}
