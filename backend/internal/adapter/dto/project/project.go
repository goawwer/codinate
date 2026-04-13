package project

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
)

type Row struct {
	AutorName     string `db:"author_name" json:"authorName"`
	AuthorSurname string `db:"author_surname" json:"authorSurname"`
	Core
	ArchivedAt *time.Time          `db:"archived_at" json:"archivedAt"`
	CreatedAt  time.Time           `db:"created_at" json:"createdAt"`
	UpdatedAt  time.Time           `db:"updated_at" json:"updatedAt"`
	Members    shared.MembersShort `db:"members" json:"members"`
}

type Core struct {
	Name        string `db:"name" json:"projectName"`
	Description string `db:"description" json:"projectDescription"`
	PictureName string `db:"picture_name" json:"projectPictureName"`
}
