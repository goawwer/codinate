package model

import (
	"time"

	"github.com/google/uuid"
)

type Worklog struct {
	Id           uuid.UUID `db:"id" json:"id"`
	TaskId       uuid.UUID `db:"task_id" json:"taskId"`
	UserId       uuid.UUID `db:"user_id" json:"userId"`
	ProjectId    int       `db:"project_id" json:"projectId"`
	Description  string    `db:"description" json:"description"`
	StartAt      time.Time `db:"start_at" json:"startAt"`
	EndAt        time.Time `db:"end_at" json:"endAt"`
	TotalMinutes int       `db:"total_minutes" json:"totalMinutes"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt    time.Time `db:"updated_at" json:"updatedAt"`
}
