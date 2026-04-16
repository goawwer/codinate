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
