package team

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/google/uuid"
)

type CreateTeamInput struct {
	AuthorId    string   `db:"author_id" json:"authorId"`
	Name        string   `db:"name" json:"name"`
	Description string   `db:"description" json:"description"`
	PictureName string   `db:"picture_name" json:"pictureName"`
	MembersIds  []string `json:"members"`
}

type UpdateTeamInput struct {
	Id          int     `db:"id" json:"id"`
	AuthorId    *string `db:"author_id" json:"authorId"`
	Name        *string `db:"name" json:"name"`
	Description *string `db:"description" json:"description"`
	PictureName *string `db:"description" json:"pictureName"`
}

type UpdateLinksInput struct {
	Links TeamLinks `json:"links"`
}

type Row struct {
	Id          int                 `db:"id" json:"id"`
	AuthorId    uuid.UUID           `db:"author_id" json:"authorId"`
	Name        string              `db:"name" json:"name"`
	Description string              `db:"description" json:"description"`
	PictureName *string             `db:"picture_name" json:"pictureName"`
	Links       TeamLinks           `db:"links" json:"links"`
	CreatedAt   time.Time           `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time           `db:"updated_at" json:"updatedAt"`
	Members     shared.MembersShort `db:"members" json:"members"`
}
