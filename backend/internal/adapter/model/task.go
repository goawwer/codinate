package model

import (
	"time"

	"github.com/google/uuid"
)

type TaskSnapshot struct {
	Id              uuid.UUID `db:"id"`
	AssigneeId      uuid.UUID `db:"assignee_id"`
	AssigneeName    string    `db:"assignee_name"`
	AssigneeSurname string    `db:"assignee_surname"`
	ProjectId       int       `db:"project_id"`
	ReleaseId       int       `db:"release_id"`
	ReleaseName     string    `db:"release_name"`
	CategoryId      int       `db:"category_id"`
	CategoryName    string    `db:"category_name"`
	PriotiryId      int       `db:"priority_id"`
	PriorityName    string    `db:"priority_name"`
	StatusId        int       `db:"status_id"`
	StatusName      string    `db:"status_name"`
	Title           string    `db:"title"`
	Description     string    `db:"description"`
	DueAt           time.Time `db:"due_at"`
}

type TaskHistory struct {
	Id        uuid.UUID  `db:"id"`
	TaskId    uuid.UUID  `db:"task_id"`
	UserId    uuid.UUID  `db:"user_id"`
	CommentId *uuid.UUID `db:"comment_id"`
	FieldName string     `db:"field_name"`
	OldValue  string     `db:"old_value"`
	NewValue  string     `db:"new_value"`
}

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
