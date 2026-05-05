package worklog

type CreateLogInput struct {
	UserId      string `json:"userId"`
	StartAt     string `json:"startAt"`
	EndAt       string `json:"endAt"`
	TaskId      string `json:"taskId"`
	Description string `json:"description"`
}

type UpdateLogInput struct {
	*CreateLogInput
}
