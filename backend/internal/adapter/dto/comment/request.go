package comment

import "github.com/goawwer/codinate/internal/adapter/dto/file"

type CreateCommentInput struct {
	Id            string                   `json:"id"`
	EntityType    string                   `json:"entityType"`
	EntityId      string                   `json:"entityId"`
	Body          string                   `json:"body"`
	AttachedFiles []file.AttachedFileInput `json:"attachedFiles"`
}

type UpdateCommentInput struct {
	EntityType       string                   `json:"entityType"`
	EntityId         string                   `json:"entityId"`
	Body             string                   `json:"body"`
	AttachedFiles    []file.AttachedFileInput `json:"attachedFiles"`
	NewAttachedFiles []file.AttachedFileInput `json:"newAttachedFiles"`
}
