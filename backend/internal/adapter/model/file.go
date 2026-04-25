package model

import (
	"time"

	"github.com/google/uuid"
)

type File struct {
	Id         uuid.UUID `db:"id"`
	UploaderId uuid.UUID `db:"uploader_id"`
	Name       string    `db:"name"`
	Size       int64     `db:"size"`
	CreatedAt  time.Time `db:"created_at"`
}
