package auth

type loginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
