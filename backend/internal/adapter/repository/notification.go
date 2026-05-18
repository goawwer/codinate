package repository

import (
	"context"
	"time"

	"github.com/goawwer/codinate/internal/adapter/database"
	notifDto "github.com/goawwer/codinate/internal/adapter/dto/notification"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/google/uuid"
)

type NotificationRepo interface {
	Create(ctx context.Context, n model.Notification) error
	GetForUser(ctx context.Context, userId uuid.UUID, since *time.Time) ([]notifDto.Row, error)
	MarkAsRead(ctx context.Context, notifId, userId uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userId uuid.UUID) error
	GetUnreadCount(ctx context.Context, userId uuid.UUID) (int, error)
	GetMembersForParent(ctx context.Context, parentType string, parentId int, excludeUserId uuid.UUID) ([]uuid.UUID, error)
	GetTasksDueSoon(ctx context.Context) ([]notifDto.DueSoonTask, error)
	GetLeaderboardTop3(ctx context.Context) ([]notifDto.LeaderboardTop, error)
	HasRankNotificationToday(ctx context.Context, userId uuid.UUID) (bool, error)
	DeleteOlderThan(ctx context.Context, before time.Time) error
}

type notificationRepoImpl struct {
	*database.CoreRepository
}

func GetNotificationRepo() NotificationRepo {
	return &notificationRepoImpl{database.GetCoreRepository()}
}

func (r *notificationRepoImpl) Create(ctx context.Context, n model.Notification) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO notifications (id, user_id, actor_id, notification_type, related, title, body)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, n.Id, n.UserId, n.ActorId, n.NotificationType, n.Related, n.Title, n.Body)
	return err
}

func (r *notificationRepoImpl) GetForUser(ctx context.Context, userId uuid.UUID, since *time.Time) ([]notifDto.Row, error) {
	res := make([]notifDto.Row, 0)

	query := `
		SELECT
			n.id,
			COALESCE(u.name, '')    AS actor_name,
			COALESCE(u.surname, '') AS actor_surname,
			COALESCE(u.avatar, '')  AS actor_picture,
			n.notification_type,
			n.related,
			n.title,
			n.body,
			n.read_at,
			n.created_at
		FROM notifications n
		LEFT JOIN users u ON n.actor_id = u.id
		WHERE n.user_id = $1`

	args := []any{userId}

	if since != nil {
		args = append(args, *since)
		query += ` AND n.created_at > $2`
	}

	query += ` ORDER BY n.created_at DESC LIMIT 50`

	err := r.SelectContext(ctx, &res, query, args...)
	return res, err
}

func (r *notificationRepoImpl) MarkAsRead(ctx context.Context, notifId, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		UPDATE notifications SET read_at = now()
		WHERE id = $1 AND user_id = $2 AND read_at IS NULL
	`, notifId, userId)
	return err
}

func (r *notificationRepoImpl) MarkAllAsRead(ctx context.Context, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		UPDATE notifications SET read_at = now()
		WHERE user_id = $1 AND read_at IS NULL
	`, userId)
	return err
}

func (r *notificationRepoImpl) GetUnreadCount(ctx context.Context, userId uuid.UUID) (int, error) {
	var count int
	err := r.GetContext(ctx, &count, `
		SELECT COUNT(*) FROM notifications
		WHERE user_id = $1 AND read_at IS NULL
	`, userId)
	return count, err
}

func (r *notificationRepoImpl) GetMembersForParent(ctx context.Context, parentType string, parentId int, excludeUserId uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	switch parentType {
	case "team":
		err := r.SelectContext(ctx, &ids, `
			SELECT user_id FROM team_members
			WHERE team_id = $1 AND user_id != $2
		`, parentId, excludeUserId)
		return ids, err
	case "project":
		err := r.SelectContext(ctx, &ids, `
			SELECT user_id FROM project_members
			WHERE project_id = $1 AND user_id != $2
		`, parentId, excludeUserId)
		return ids, err
	default:
		return nil, nil
	}
}

func (r *notificationRepoImpl) GetTasksDueSoon(ctx context.Context) ([]notifDto.DueSoonTask, error) {
	var tasks []notifDto.DueSoonTask
	now := time.Now()
	err := r.SelectContext(ctx, &tasks, `
		SELECT t.id, t.title, t.identifier, t.assignee_id, t.due_at
		FROM tasks t
		WHERE t.due_at BETWEEN $1 AND $2
		  AND t.closed_at IS NULL
		  AND NOT EXISTS (
		      SELECT 1 FROM notifications n
		      WHERE n.user_id = t.assignee_id
		        AND n.notification_type = 'due_soon'
		        AND n.related->>'taskId' = t.id::text
		        AND n.created_at > $3
		  )
	`, now, now.Add(48*time.Hour), now.Add(-20*time.Hour))
	return tasks, err
}

func (r *notificationRepoImpl) GetLeaderboardTop3(ctx context.Context) ([]notifDto.LeaderboardTop, error) {
	var top []notifDto.LeaderboardTop
	err := r.SelectContext(ctx, &top, `
		SELECT user_id, rank, total_minutes
		FROM leaderboard_snapshots
		WHERE rank <= 3
		ORDER BY rank
	`)
	return top, err
}

func (r *notificationRepoImpl) DeleteOlderThan(ctx context.Context, before time.Time) error {
	_, err := r.ExecContext(ctx, `DELETE FROM notifications WHERE created_at < $1`, before)
	return err
}

func (r *notificationRepoImpl) HasRankNotificationToday(ctx context.Context, userId uuid.UUID) (bool, error) {
	var count int
	err := r.GetContext(ctx, &count, `
		SELECT COUNT(*) FROM notifications
		WHERE user_id = $1 AND notification_type = 'rank'
		  AND created_at > current_date::timestamptz
	`, userId)
	return count > 0, err
}
