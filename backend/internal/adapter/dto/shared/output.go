package shared

type IdWithName struct {
	Id   int    `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}
