package model

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
)

type Release struct {
	Id         int                `db:"id" json:"id"`
	ProjectId  int                `db:"project_id" json:"projectId"`
	Title      string             `db:"title" json:"title"`
	Decription string             `db:"description" json:"description"`
	Status     enum.ReleaseStatus `db:"status" json:"status"`
	StartAt    time.Time          `db:"start_at" json:"startAt"`
	EndAt      time.Time          `db:"end_at" json:"endAt"`
	CreatedAt  time.Time          `db:"created_at" json:"createdAt"`
	UpdatedAt  time.Time          `db:"updated_at" json:"updatedAt"`
}
