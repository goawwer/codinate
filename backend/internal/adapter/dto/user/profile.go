package user

import "github.com/google/uuid"

type Profile struct {
	ID                uuid.UUID            `db:"id" json:"id"`
	Username          string               `db:"username" json:"username"`
	Name              string               `db:"name" json:"name"`
	Surname           string               `db:"surname" json:"surname"`
	Description       *string              `db:"profile_description" json:"description"`
	Avatar            *string              `db:"avatar" json:"avatar"`
	BackgroundPicture *string              `db:"backgroud_profile_picture" json:"backgroundPicture"`
	Role              string               `db:"role" json:"role"`
	RecentMinutes     int                  `db:"recent_minutes" json:"recentMinutes"`
	Projects          []UserProjectProfile `json:"projects"`
}

type UserProjectProfile struct {
	ID             int        `db:"id" json:"id"`
	Name           string     `db:"name" json:"name"`
	ProjectPicture *string    `db:"project_picture" json:"picture"`
	SpentMinutes   int        `db:"spent_minutes" json:"spentMinutes"`
	RecentMinutes  int        `db:"recent_minutes" json:"recentMinutes"`
	Tasks          []TaskRef  `json:"tasks"`
}

type TaskRef struct {
	ID         string `db:"id" json:"id"`
	Identifier int    `db:"identifier" json:"identifier"`
	Title      string `db:"title" json:"title"`
}

type UpdateProfileInput struct {
	Username          *string `json:"username"`
	Description       *string `json:"description"`
	Avatar            *string `json:"avatar"`
	BackgroundPicture *string `json:"backgroundPicture"`
}
