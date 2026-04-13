package file

import (
	"context"
	"fmt"
	"path"
	"path/filepath"

	"github.com/spf13/viper"
)

type service struct{}

func (s *service) getFilePath(ctx context.Context, entityType, entityId, id string) (string, error) {
	filesDir := path.Join(viper.GetString("UPLOADS_DIR"), entityType, entityId, id)

	files, err := filepath.Glob(filesDir)
	if err != nil {
		return "", fmt.Errorf("failed to load task file")
	}

	if len(files) == 0 {
		return "", fmt.Errorf("file not found")
	}

	return files[0], nil
}
