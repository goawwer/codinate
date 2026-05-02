package file

import (
	"encoding/json"

	"github.com/google/uuid"
)

type FileInfo struct {
	Id         uuid.UUID `json:"id"`
	UploaderId uuid.UUID `json:"uploaderId"`
	Name       string    `json:"name"`
	Size       int       `json:"size"`
}

type AttachedFileInfo struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type AttachedFileInput struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Size int64  `json:"size"`
}

type AttachedFiles []AttachedFileInfo

func (a *AttachedFiles) Scan(src any) error {
	if src == nil {
		*a = AttachedFiles{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	}
	return json.Unmarshal(data, a)
}
