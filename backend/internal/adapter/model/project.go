package model

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	Id          int       `db:"id" json:"id"`
	AuthorId    uuid.UUID `db:"author_id" json:"authorId"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description:" json:"description"`
	PictureName string    `db:"picture_name" json:"pictureName"`
	ArchivedAt  time.Time `db:"archived_at" json:"archivedAt"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time `db:"updated_at" json:"updatedAt"`
}
