package file

import "github.com/google/uuid"

type FileInfo struct {
	Id         uuid.UUID `json:"id"`
	UploaderId uuid.UUID `json:"uploaderId"`
	Name       string    `json:"name"`
	Size       int       `json:"size"`
}
