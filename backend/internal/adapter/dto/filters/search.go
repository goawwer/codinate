package filters

type Search struct {
	Column string
	Value  string
}

func NewSearching(col, val string) *Search {
	return &Search{
		Column: col,
		Value:  val,
	}
}
