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

type TaskRow struct {
	Id           uuid.UUID `db:"id" json:"id"`
	TaskId       uuid.UUID `db:"task_id" json:"taskId"`
	StartAt      time.Time `db:"start_at" json:"startAt"`
	EndAt        time.Time `db:"end_at" json:"endAt"`
	TotalMinutes int       `db:"total_minutes" json:"totalMinutes"`
	Description  string    `db:"description" json:"description"`
	UserId       uuid.UUID `db:"user_id" json:"userId"`
	UserName     string    `db:"user_name" json:"userName"`
	UserSurname  string    `db:"user_surname" json:"userSurname"`
	UserAvatar   string    `db:"user_avatar" json:"userAvatar"`
}

type LeaderboardEntry struct {
	UserId       uuid.UUID `db:"user_id" json:"userId"`
	Username     string    `db:"username" json:"username"`
	Name         string    `db:"name" json:"name"`
	Surname      string    `db:"surname" json:"surname"`
	Avatar       string    `db:"avatar" json:"avatar"`
	TotalMinutes int64     `db:"total_minutes" json:"totalMinutes"`
	LogCount     int       `db:"log_count" json:"logCount"`
	Rank         int       `db:"rank" json:"rank"`
}
