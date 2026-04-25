package file

import "github.com/google/uuid"

type fileUploadResponse struct {
	Id   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Size int64     `json:"size"`
	Url  string    `json:"url"`
}
