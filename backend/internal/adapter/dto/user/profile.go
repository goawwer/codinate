package user

import (
	"time"

	"github.com/google/uuid"
)

type Profile struct {
	ID                uuid.UUID            `db:"id" json:"id"`
	Username          string               `db:"username" json:"username"`
	Name              string               `db:"name" json:"name"`
	Surname           string               `db:"surname" json:"surname"`
	About             *string              `db:"about" json:"about"`
	Avatar            *string              `db:"avatar" json:"avatar"`
	BackgroundPicture *string              `db:"background_profile_picture" json:"backgroundPicture"`
	CreatedAt         time.Time            `db:"created_at" json:"createdAt"`
	Role              string               `db:"role" json:"role"`
	RecentMinutes     int                  `db:"recent_minutes" json:"recentMinutes"`
	Projects          []UserProjectProfile `json:"projects"`
}

type UserProjectProfile struct {
	ID             int       `db:"id" json:"id"`
	Name           string    `db:"name" json:"name"`
	ProjectPicture *string   `db:"project_picture" json:"picture"`
	ProjectAbout   *string   `db:"project_about" json:"about"`
	SpentMinutes   int       `db:"spent_minutes" json:"spentMinutes"`
	RecentMinutes  int       `db:"recent_minutes" json:"recentMinutes"`
	Tasks          []TaskRef `json:"tasks"`
}

type TaskRef struct {
	ID         string `db:"id" json:"id"`
	Identifier int    `db:"identifier" json:"identifier"`
	Title      string `db:"title" json:"title"`
}

type UpdateProfileInput struct {
	Username                 *string `json:"username"`
	About                    *string `json:"about"`
	ProfilePicture           *string `json:"avatar"`
	ProfileBackgroundPicture *string `json:"backgroundPicture"`
}

type ProfileStats struct {
	WorkDynamics []DailyWorkStat    `json:"workDynamics"`
	ProjectFocus []ProjectFocusStat `json:"projectFocus"`
}

type DailyWorkStat struct {
	Date         string `json:"date" db:"date"`
	SpentMinutes int    `json:"spentMinutes" db:"spent_minutes"`
}

type ProjectFocusStat struct {
	ProjectID    int    `json:"projectId" db:"project_id"`
	ProjectName  string `json:"projectName" db:"project_name"`
	SpentMinutes int    `json:"spentMinutes" db:"spent_minutes"`
}

type UserHoursStat struct {
	UserID       string `json:"userId" db:"user_id"`
	TotalMinutes int    `json:"totalMinutes" db:"total_minutes"`
}
