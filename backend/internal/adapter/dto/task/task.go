package task

import (
	"time"

	"github.com/google/uuid"
)

type Row struct {
	Id               uuid.UUID  `db:"id" json:"id"`
	AssigneeUsername string     `db:"assignee_username" json:"assigneeUserame"`
	ProjectPicture   string     `db:"project_picture" json:"projectPicture"`
	CategoryName     string     `db:"category" json:"category"`
	ProjectRelease   string     `db:"release" json:"projectRelease"`
	Priority         string     `db:"priority" json:"priority"`
	Status           string     `db:"status" json:"status"`
	Identifier       int        `db:"identifier" json:"identifier"`
	Title            string     `db:"title" json:"title"`
	Description      string     `db:"description" json:"description"`
	DueAt            *time.Time `db:"due_at" json:"dueAt"`
	CreatedAt        time.Time  `db:"created_at" json:"createdAt"`
	ClosedAt         *time.Time `db:"closed_at" json:"closedAt"`
}

type RowDetailed struct {
	AuthorId uuid.UUID `db:"author_id" json:"authorId"`
	Row
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}
