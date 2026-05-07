package model

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type User struct {
	Id             uuid.UUID           `db:"id"`
	Name           string              `db:"name"`
	Surname        string              `db:"surname"`
	Email          string              `db:"email"`
	Username       string              `db:"username"`
	HashedPassword string              `db:"hashed_password"`
	ProfilePicture string              `db:"avatar"`
	RoleId         int64               `db:"role_id"`
	Permission     enum.PermissionRole `db:"permission_role"`
	Disabled       bool                `db:"disabled"`
	CreatedAt      time.Time           `db:"created_at"`
	UpdatedAt      time.Time           `db:"updated_at"`
}
