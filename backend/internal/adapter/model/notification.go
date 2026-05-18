package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	Id               uuid.UUID       `db:"id"`
	UserId           uuid.UUID       `db:"user_id"`
	ActorId          uuid.UUID       `db:"actor_id"`
	NotificationType string          `db:"notification_type"`
	Related          json.RawMessage `db:"related"`
	Title            string          `db:"title"`
	Body             string          `db:"body"`
	CreatedAt        time.Time       `db:"created_at"`
}
