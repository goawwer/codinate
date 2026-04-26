package model

import (
	"time"

	"github.com/google/uuid"
)

type Task struct {
	Id               uuid.UUID   `db:"id" json:"id"`
	AuthorId         uuid.UUID   `db:"author_id" json:"authorId"`
	AssigneeId       uuid.UUID   `db:"assignee_id" json:"assigneeId"`
	ProjectId        int         `db:"project_id" json:"projectId"`
	ReleaseId        int         `db:"release_id" json:"releaseId"`
	CategoryId       int         `db:"category_id" json:"categoryId"`
	PriotiryId       int         `db:"priority_id" json:"priorityId"`
	StatusId         int         `db:"status_id" json:"statusId"`
	Identifier       int         `db:"identifier" json:"identifier"`
	Title            string      `db:"title" json:"title"`
	Description      string      `db:"description" json:"description"`
	DueAt            time.Time   `db:"due_at" json:"dueAt"`
	AttachedFilesIds []uuid.UUID `db:"attached_files_ids" json:"attachedFilesIds"`
	ClosedAt         time.Time   `db:"closed_at" json:"closedAt"`
	CreatedAt        time.Time   `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time   `db:"updated_at" json:"updatedAt"`

	Participants []uuid.UUID `db:"-"`
}
