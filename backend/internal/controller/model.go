package controller

type BasicQueryParams struct {
	PageNumber int
	PageSize   int

	From string
	To   string

	SortBy string
	Sort   string

	SearchBy    string
	SearchValue string
}
