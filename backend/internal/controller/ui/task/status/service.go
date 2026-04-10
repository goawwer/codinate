package status

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/repository"
)

type service struct{}

func (s *service) getStatuses(ctx context.Context) ([]shared.IdWithName, error) {
	return repository.GetTaskRepo().GetTaskStatuses(ctx)
}

func (s *service) addStatus(ctx context.Context, name string) error {
	return repository.GetTaskRepo().AddTaskStatus(ctx, name)
}

func (s *service) updateStatus(ctx context.Context, id int, newName string) error {
	return repository.GetTaskRepo().UpdateTaskStatus(ctx, id, newName)
}

func (s *service) deleteStatusById(ctx context.Context, id int) error {
	return repository.GetTaskRepo().DeleteTaskStatusById(ctx, id)
}

func (s *service) deleteAllTaskStatuses(ctx context.Context) error {
	return repository.GetTaskRepo().DeleteAllTaskStatuses(ctx)
}
