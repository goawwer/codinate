package user

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type DeleteMultiInput struct {
	IDs []uuid.UUID `json:"ids"`
}

type CreateInput struct {
	Name       string `json:"name"`
	Surname    string `json:"surname"`
	Email      string `json:"email"`
	RoleId     int64  `json:"roleId"`
	Permission string `json:"permission"`
	Password   string `json:"password"`
}

type UpdateInput struct {
	Name           *string `json:"name"`
	Surname        *string `json:"surname"`
	Email          *string `json:"email"`
	Password       *string `json:"password"`
	RoleId         *string `json:"roleId"`
	Permission     *string `json:"permission"`
	Username       *string `json:"username"`
	ProfilePicture *string `json:"profilePicture"`
	Disabled       *bool   `json:"disabled"`
}

type Row struct {
	Id          uuid.UUID           `db:"id"              json:"id"`
	Name        string              `db:"name"            json:"name"`
	Surname     string              `db:"surname"         json:"surname"`
	Email       string              `db:"email"           json:"email"`
	Username    string              `db:"username"        json:"username"`
	PictureName *string             `db:"picture_name"    json:"picture"`
	Role        string              `db:"role"       json:"role"`
	Permission  enum.PermissionRole `db:"permission_role" json:"permission"`
	Disabled    bool                `db:"disabled"        json:"disabled"`
	CreatedAt   time.Time           `db:"created_at"      json:"createdAt"`
	UpdatedAt   time.Time           `db:"updated_at"      json:"updatedAt"`
}
