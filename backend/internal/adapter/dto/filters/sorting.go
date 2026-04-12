package filters

type Sorting struct {
	Column    string
	Direction string
}

func NewSorting(col, dir string) *Sorting {
	return &Sorting{
		Column:    col,
		Direction: resolveSortingDirection(dir),
	}
}
