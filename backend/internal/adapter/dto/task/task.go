package task

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/google/uuid"
)

type Row struct {
	Id               uuid.UUID  `db:"id" json:"id"`
	AssigneeUsername string     `db:"assignee_username" json:"assigneeUsername"`
	ProjectName      string     `db:"project_name" json:"projectName"`
	ProjectPicture   string     `db:"project_picture" json:"projectPicture"`
	ProjectRelease   string     `db:"release" json:"projectRelease"`
	CategoryName     string     `db:"category" json:"category"`
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
	Row
	ProjectId       int                 `db:"project_id" json:"projectId"`
	ReleaseId       int                 `db:"release_id" json:"releaseId"`
	CategoryId      int                 `db:"category_id" json:"categoryId"`
	AuthorId        uuid.UUID           `db:"author_id" json:"authorId"`
	AuthorName      string              `db:"author_name" json:"authorName"`
	AuthorSurname   string              `db:"author_surname" json:"authorSurname"`
	AssigneeId      uuid.UUID           `db:"assignee_id" json:"assigneeId"`
	AssigneeName    string              `db:"assignee_name" json:"assigneeName"`
	AssigneeSurname string              `db:"assignee_surname" json:"assigneeSurname"`
	Members         shared.MembersShort `db:"members" json:"members"`
	AttachedFiles   file.AttachedFiles  `db:"attached_files" json:"attachedFiles"`
	UpdatedAt       time.Time           `db:"updated_at" json:"updatedAt"`
}

type Suggestion struct {
	Id         uuid.UUID `db:"id" json:"id"`
	Identifier int       `db:"identifier" json:"identifier"`
	Title      string    `db:"title" json:"title"`
}
