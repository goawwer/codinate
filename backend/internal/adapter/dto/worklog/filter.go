package worklog

import (
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type InputFilters struct {
	TaskId     []string `json:"taskId"`
	Identifier int      `json:"identifier"`
	ProjectId  int      `json:"projectId"`
}

type Filters struct {
	DateRange  *filters.DateRange
	SortBy     *filters.Sorting
	SearchBy   *filters.Search
	Paging     *filters.Page
	TaskId     []uuid.UUID
	ProjectId  int
	Identifier int
}

func (in *InputFilters) ResolveFilters(basic controller.BasicQueryParams) *Filters {
	return &Filters{
		DateRange:  filters.NewDateRange(basic.From, basic.To),
		SortBy:     filters.NewSorting(basic.SortBy, basic.Sort),
		SearchBy:   filters.NewSearching(basic.SearchBy, basic.SearchValue),
		Paging:     filters.NewPaging(basic.PageNumber, basic.PageSize),
		TaskId:     util.ResolveStringsToUUIDs(in.TaskId),
		Identifier: in.Identifier,
		ProjectId:  in.ProjectId,
	}
}
