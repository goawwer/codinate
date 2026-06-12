package notification

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// JSONField is a JSONB column that scans from the database and marshals as raw JSON.
type JSONField map[string]any

func (j *JSONField) Scan(src any) error {
	if src == nil {
		*j = JSONField{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	}
	return json.Unmarshal(data, j)
}

type Row struct {
	Id               uuid.UUID  `db:"id" json:"id"`
	ActorName        string     `db:"actor_name" json:"actorName"`
	ActorSurname     string     `db:"actor_surname" json:"actorSurname"`
	ActorPicture     *string    `db:"actor_picture" json:"actorPicture"`
	NotificationType string     `db:"notification_type" json:"notificationType"`
	Related          JSONField  `db:"related" json:"related"`
	Title            string     `db:"title" json:"title"`
	Body             string     `db:"body" json:"body"`
	ReadAt           *time.Time `db:"read_at" json:"readAt"`
	CreatedAt        time.Time  `db:"created_at" json:"createdAt"`
}

type UnreadCount struct {
	Count int `json:"count"`
}

type DueSoonTask struct {
	Id         uuid.UUID `db:"id"`
	Title      string    `db:"title"`
	Identifier int       `db:"identifier"`
	AssigneeId uuid.UUID `db:"assignee_id"`
	DueAt      time.Time `db:"due_at"`
}

type LeaderboardTop struct {
	UserId       uuid.UUID `db:"user_id"`
	Rank         int       `db:"rank"`
	TotalMinutes int64     `db:"total_minutes"`
}
