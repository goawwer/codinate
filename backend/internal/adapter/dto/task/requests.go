package task

type CreateTaskInput struct {
	Id            string              `json:"id"`
	AuthorId      string              `json:"authorId"`
	AssigneeId    string              `json:"assigneeId"`
	ProjectId     int                 `json:"projectId"`
	ReleaseId     int                 `json:"releaseId"`
	CategoryId    int                 `json:"categoryId"`
	PriorityId    int                 `json:"priorityId"`
	StatusId      int                 `json:"statusId"`
	Title         string              `json:"title"`
	Description   string              `json:"description"`
	DueAt         string              `json:"dueAt"`
	AttachedFiles []AttachedFileInput `json:"attachedFiles"`
}

type UpdateTaskInput struct {
	*CreateTaskInput
	ClosedAt *string `json:"closedAt"`
}
