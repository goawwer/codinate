package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/google/uuid"
)

type FileRepo interface {
	InsertFile(ctx context.Context, id, uploaderId uuid.UUID, name string, size int64) error
	DeleteFile(ctx context.Context, id uuid.UUID) error
}

type fileRepoImpl struct {
	*database.CoreRepository
}

func GetFileRepo() FileRepo {
	return &fileRepoImpl{database.GetCoreRepository()}
}

func (r *fileRepoImpl) InsertFile(ctx context.Context, id, uploaderId uuid.UUID, name string, size int64) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO files (id, uploader_id, name, size)
		VALUES ($1, $2, $3, $4)
	`, id, uploaderId, name, size)
	return err
}

func (r *fileRepoImpl) DeleteFile(ctx context.Context, id uuid.UUID) error {
	_, err := r.ExecContext(ctx, `DELETE FROM files WHERE id = $1`, id)
	return err
}
