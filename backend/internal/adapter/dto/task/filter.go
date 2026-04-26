package task

import (
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/controller"
)

type FiltersInput struct {
	ProjectId  []int    `json:"projectId"`
	ReleaseId  []int    `json:"releaseId"`
	CategotyId []int    `json:"categoryId"`
	PriorityId []int    `json:"priorityId"`
	StatusId   []int    `json:"statusId"`
	AssigneeId []string `json:"assigneeId"`
	AuthorId   []string `json:"authorId"`
	Identifier int      `json:"identifier"`
}

type Filters struct {
	DateRange  *filters.DateRange
	SortBy     *filters.Sorting
	SearchBy   *filters.Search
	Paging     *filters.Page
	ProjectId  []int    `json:"projectId"`
	ReleaseId  []int    `json:"releaseId"`
	CategotyId []int    `json:"categoryId"`
	PriorityId []int    `json:"priorityId"`
	StatusId   []int    `json:"statusId"`
	AssigneeId []string `json:"assigneeId"`
	AuthorId   []string `json:"authorId"`
	Identifier int      `json:"identifier"`
}

func (in *FiltersInput) ResolveFilters(basic controller.BasicQueryParams) *Filters {
	return &Filters{
		DateRange:  filters.NewDateRange(basic.From, basic.To),
		SortBy:     filters.NewSorting(basic.SortBy, basic.Sort),
		SearchBy:   filters.NewSearching(basic.SearchBy, basic.SearchValue),
		Paging:     filters.NewPaging(basic.PageNumber, basic.PageSize),
		ProjectId:  in.ProjectId,
		ReleaseId:  in.ReleaseId,
		CategotyId: in.CategotyId,
		PriorityId: in.PriorityId,
		StatusId:   in.StatusId,
		AssigneeId: in.AssigneeId,
		AuthorId:   in.AuthorId,
		Identifier: in.Identifier,
	}
}
