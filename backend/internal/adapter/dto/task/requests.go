package task

import "github.com/goawwer/codinate/internal/adapter/dto/file"

type CreateTaskInput struct {
	Id            string                   `json:"id"`
	AuthorId      string                   `json:"authorId"`
	AssigneeId    string                   `json:"assigneeId"`
	ProjectId     int                      `json:"projectId"`
	ReleaseId     int                      `json:"releaseId"`
	CategoryId    int                      `json:"categoryId"`
	PriorityId    int                      `json:"priorityId"`
	StatusId      int                      `json:"statusId"`
	Title         string                   `json:"title"`
	Description   string                   `json:"description"`
	DueAt         string                   `json:"dueAt"`
	AttachedFiles []file.AttachedFileInput `json:"attachedFiles"`
}

type UpdateTaskInput struct {
	*CreateTaskInput
	ClosedAt     *string `json:"closedAt"`
	CommentBody  string  `json:"commentBody"`
	AssigneeName string  `json:"assigneeName"`
	StatusName   string  `json:"statusName"`
	CategoryName string  `json:"categoryName"`
	PriorityName string  `json:"priorityName"`
	ReleaseName  string  `json:"releaseName"`
}
