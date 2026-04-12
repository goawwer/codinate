package controller

type BasicQueryParams struct {
	PageNumber int
	PageSize   int

	SortBy string
	Sort   string

	SearchBy    string
	SearchValue string
}
