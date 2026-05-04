package worklog

type CreateLogInput struct {
	StartAt     string `json:"startAt"`
	EndAt       string `json:"endAt"`
	TaskId      string `json:"taskId"`
	Description string `json:"description"`
}

type UpdateLogInout struct {
	*CreateLogInput
}
