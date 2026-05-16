package post

import (
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/controller"
)

type InputFilters struct {
	ParentType string `json:"parentType"`
	ParentId   int    `json:"parentId"`
}

type Filters struct {
	DateRange  *filters.DateRange
	SortBy     *filters.Sorting
	SearchBy   *filters.Search
	Paging     *filters.Page
	ParentType string
	ParentId   int
}

func (in *InputFilters) ResolveFilters(basic controller.BasicQueryParams) *Filters {
	return &Filters{
		DateRange:  filters.NewDateRange(basic.From, basic.To),
		SortBy:     filters.NewSorting(basic.SortBy, basic.Sort),
		SearchBy:   filters.NewSearching(basic.SearchBy, basic.SearchValue),
		Paging:     filters.NewPaging(basic.PageNumber, basic.PageSize),
		ParentType: in.ParentType,
		ParentId:   in.ParentId,
	}
}
