package post

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/google/uuid"
)

type Row struct {
	Id             uuid.UUID          `db:"id" json:"id"`
	AuthorName     string             `db:"author_name" json:"authorName"`
	AuthorSurname  string             `db:"author_surname" json:"authorSurname"`
	AuthorPicture  string             `db:"author_picture" json:"authorPicture"`
	AuthorUsername string             `db:"author_username" json:"authorUsername"`
	Title          string             `db:"title" json:"title"`
	Body           string             `db:"body" json:"body"`
	AttachedFiles  file.AttachedFiles `db:"attached_files" json:"attachedFiles"`
	CreatedAt      time.Time          `db:"created_at" json:"createdAt"`
	UpdatedAt      time.Time          `db:"updated_at" json:"updatedAt"`
}
