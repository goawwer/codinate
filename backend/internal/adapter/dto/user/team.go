package user

type TeamMember struct {
	Name        string  `db:"name"            json:"name"`
	Surname     string  `db:"surname"         json:"surname"`
	Username    string  `db:"username"        json:"username"`
	PictureName *string `db:"picture_name"    json:"picture"`
	Role        string  `db:"role"       json:"role"`
}
