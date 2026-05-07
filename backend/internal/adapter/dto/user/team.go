package user

type TeamMember struct {
	Name        string  `db:"name"            json:"name"`
	Surname     string  `db:"surname"         json:"surname"`
	Username    string  `db:"username"        json:"username"`
	PictureName *string `db:"avatar"    json:"picture"`
	Role        string  `db:"role"       json:"role"`
}
