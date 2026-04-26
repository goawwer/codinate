package file

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/internal/service/uploads"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

type service struct{}

func (s *service) uploadFile(ctx context.Context, fileId, uploaderId uuid.UUID, entityType, entityId, baseURL string, file multipart.File, header *multipart.FileHeader) (*fileUploadResponse, error) {
	entityUUID, err := uuid.Parse(entityId)
	if err != nil {
		return nil, fmt.Errorf("invalid entity id")
	}

	if _, err := uploads.SaveFile(file, header, entityType, entityId, fileId); err != nil {
		return nil, err
	}

	if err := repository.GetFileRepo().InsertFile(ctx, fileId, uploaderId, header.Filename, header.Size); err != nil {
		return nil, err
	}

	if entityType == "tasks" {
		if err := repository.GetTaskRepo().AttachFilesToTask(ctx, entityUUID, []uuid.UUID{fileId}); err != nil {
			return nil, err
		}
	}

	return &fileUploadResponse{
		Id:   fileId,
		Name: header.Filename,
		Size: header.Size,
		Url:  fmt.Sprintf("%s/api/files/%s/%s/%s", baseURL, entityType, entityId, fileId.String()),
	}, nil
}

func (s *service) removeFile(ctx context.Context, entityType, entityId, fileId string) error {
	fileUUID, err := uuid.Parse(fileId)
	if err != nil {
		return fmt.Errorf("invalid file id")
	}

	entityUUID, err := uuid.Parse(entityId)
	if err != nil {
		return fmt.Errorf("invalid entity id")
	}

	pattern := filepath.Join(viper.GetString("UPLOADS_DIR"), entityType, entityId, fileId+"*")
	if matches, err := filepath.Glob(pattern); err == nil {
		for _, match := range matches {
			os.Remove(match)
		}
	}

	if err := repository.GetFileRepo().DeleteFile(ctx, fileUUID); err != nil {
		return err
	}

	if entityType == "tasks" {
		if err := repository.GetTaskRepo().DetachFileFromTask(ctx, entityUUID, fileUUID); err != nil {
			return err
		}
	}

	return nil
}

func (s *service) getFilePath(entityType, entityId, fileId string) (string, error) {
	pattern := filepath.Join(viper.GetString("UPLOADS_DIR"), entityType, entityId, fileId+"*")

	matches, err := filepath.Glob(pattern)
	if err != nil || len(matches) == 0 {
		return "", fmt.Errorf("file not found")
	}

	return matches[0], nil
}
