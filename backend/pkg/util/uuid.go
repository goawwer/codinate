package util

import (
	"fmt"

	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/google/uuid"
)

func ParseAttachedFileIds(files []file.AttachedFileInput) ([]uuid.UUID, error) {
	if len(files) == 0 {
		return []uuid.UUID{}, nil
	}

	ids := make([]uuid.UUID, 0, len(files))

	for _, file := range files {
		id, err := uuid.Parse(file.Id)
		if err != nil {
			return nil, fmt.Errorf("invalid attached file id %q: %w", file.Id, err)
		}

		ids = append(ids, id)
	}

	return ids, nil
}
