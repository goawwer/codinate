package model

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type User struct {
	Id                       uuid.UUID           `db:"id" json:"id"`
	Name                     string              `db:"name" json:"name"`
	Surname                  string              `db:"surname" json:"surname"`
	Email                    string              `db:"email" json:"email"`
	Username                 string              `db:"username" json:"username"`
	HashedPassword           string              `db:"hashed_password" json:"-"`
	ProfilePicture           string              `db:"avatar" json:"avatar"`
	About                    string              `db:"about" json:"about"`
	ProfileBackgroundPicture string              `db:"background_profile_picture" json:"backgroundPicture"`
	RoleId                   int64               `db:"role_id" json:"roleId"`
	Permission               enum.PermissionRole `db:"permission_role" json:"permissionRole"`
	Disabled                 bool                `db:"disabled" json:"disabled"`
	CreatedAt                time.Time           `db:"created_at" json:"createdAt"`
	UpdatedAt                time.Time           `db:"updated_at" json:"updatedAt"`
}
