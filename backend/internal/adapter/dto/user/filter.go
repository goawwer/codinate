package user

import (
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/controller"
)

type DashBoardInput struct {
	Disabled string `json:"disabled"`
}

type Filters struct {
	Disabled *bool
	SortBy   *filters.Sorting
	SearchBy *filters.Search
}

func (in *DashBoardInput) ResolveFilters(basic controller.BasicQueryParams) *Filters {
	return &Filters{
		Disabled: resolveDisabledState(in.Disabled),
		SortBy:   filters.NewSorting(basic.SortBy, basic.Sort),
		SearchBy: filters.NewSearching(basic.SearchBy, basic.SearchValue),
	}
}
