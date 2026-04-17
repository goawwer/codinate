package project

type CreateProjectInput struct {
	AuthorId string `db:"author_id" json:"authorId"`
	Core
	MembersIds []string `json:"projectMembers"`
}

type UpdateProjectInput struct {
	Name        *string `db:"name"         json:"name,omitempty"`
	Description *string `db:"description"  json:"description,omitempty"`
	PictureName *string `db:"picture_name" json:"pictureName,omitempty"`
}

type CreateReleaseInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StartAt     string `json:"startAt"`
	EndAt       string `json:"endAt"`
}

type UpdateReleaseInput struct {
	Name        *string `db:"name"         json:"name,omitempty"`
	Description *string `db:"description"  json:"description,omitempty"`
	Status      *string `db:"status" json:"status,omitempty"`
	StartAt     *string `db:"start_at" json:"startAt,omitempty"`
	EndAt       *string `db:"update_at" json:"updateAt,omitempty"`
}
