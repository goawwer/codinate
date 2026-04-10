package user

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type CreateInput struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

type UpdateInput struct {
	Name           *string `json:"name"`
	Surname        *string `json:"surname"`
	Email          *string `json:"email"`
	Password       *string `json:"password"`
	Role           *string `json:"role"`
	Username       *string `json:"username"`
	ProfilePicture *string `json:"profilePicture"`
	Disabled       *bool   `json:"disabled"`
}

type Row struct {
	Id             uuid.UUID `db:"id" json:"id"`
	Name           string    `db:"name" json:"name"`
	Surname        string    `db:"surname" json:"surname"`
	Email          string    `db:"email" json:"email"`
	Username       string    `db:"username" json:"username"`
	HashedPassword string    `db:"hashed_password" json:"password"`
	PictureName    *string   `db:"picture_name" json:"picture"`
	Role           enum.Role `db:"role" json:"role"`
	Disabled       bool      `db:"disabled" json:"disabled"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt      time.Time `db:"updated_at" json:"updatedAt"`
}
