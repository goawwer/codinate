package user

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/models/enum"
)

type Row struct {
	Id             string    `db:"id" json:"id"`
	Name           string    `db:"name" json:"name"`
	Surname        string    `db:"surname" json:"surname"`
	Email          string    `db:"email" json:"email"`
	Username       string    `db:"username" json:"username"`
	ProfilePicture *string   `db:"profile_picture_path" json:"profilePicture"`
	Role           enum.Role `db:"role" json:"role"`
	Disabled       bool      `db:"disabled" json:"disabled"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
}
