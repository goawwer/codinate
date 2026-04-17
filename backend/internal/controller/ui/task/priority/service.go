package priority

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/repository"
)

type service struct{}

func (s *service) getPriorities(ctx context.Context) ([]shared.IdWithName, error) {
	return repository.GetTaskRepo().GetTaskPriorities(ctx)
}

func (s *service) addPriority(ctx context.Context, name string) error {
	return repository.GetTaskRepo().AddTaskPriority(ctx, name)
}

func (s *service) updatePriority(ctx context.Context, id int, newName string) error {
	return repository.GetTaskRepo().UpdateTaskPriority(ctx, id, newName)
}

func (s *service) deletePriorityById(ctx context.Context, id int) error {
	return repository.GetTaskRepo().DeleteTaskPriorityById(ctx, id)
}
