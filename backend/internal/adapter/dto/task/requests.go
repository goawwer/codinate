package task

type CreateTaskInput struct {
	AuthorId    string `json:"userId"`
	AssigneeId  string `json:"assigneeId"`
	ProjectId   int    `json:"projectId"`
	ReleaseId   int    `json:"releaseId"`
	CategoryId  int    `json:"categoryId"`
	PriorityId  int    `json:"priorityId"`
	StatusId    int    `json:"statusId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	DueAt       string `json:"dueAt"`
}

type UpdateTaskInput struct {
	*CreateTaskInput
	ClosedAt *string `json:"closedAt"`
}
