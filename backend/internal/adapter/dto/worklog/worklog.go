package worklog

import (
	"time"

	"github.com/google/uuid"
)

type Row struct {
	Id           uuid.UUID `db:"id" json:"id"`
	TaskId       uuid.UUID `db:"task_id" json:"taskId"`
	Date         time.Time `db:"date" json:"date"`
	StartAt      time.Time `db:"start_at" json:"startAt"`
	EndAt        time.Time `db:"end_at" json:"endAt"`
	TotalMinutes int       `db:"total_minutes" json:"totalMinutes"`
	Description  string    `db:"description" json:"description"`
	ProjectName    string `db:"project_name" json:"projectName"`
	TaskIdentifier int    `db:"task_identifier" json:"taskIdentifier"`
}
