package model

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type PostParent struct {
	ParentType enum.PostParentType
	ParentId   int
}

type Post struct {
	Id               uuid.UUID     `db:"id" json:"id"`
	AuthorId         uuid.UUID     `db:"author_id" json:"authorId"`
	Parents          []PostParent
	PostType         enum.PostType `db:"post_type" json:"postType"`
	Title            string        `db:"title" json:"title"`
	Body             string        `db:"body" json:"body"`
	AttachedFilesIds []uuid.UUID   `db:"attached_files_ids" json:"attachedFilesIds"`
	CreatedAt        time.Time     `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time     `db:"updated_at" json:"updatedAt"`
	DeletedAt        time.Time     `db:"deleted_at" json:"deletedAt"`
}
