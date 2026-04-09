package employee

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/repository"
)

type service struct{}

func (s *service) addNewEmployeeRole(ctx context.Context, name string) error {
	return repository.GetEmplRepo().AddEmployeeRole(ctx, name)
}

func (s *service) getRoles(ctx context.Context) ([]shared.IdWithName, error) {
	return repository.GetEmplRepo().GetEmployeesRoles(ctx)
}

func (s *service) updateEmployeeRoleById(ctx context.Context, id int, newName string) error {
	return repository.GetEmplRepo().UpdateEmployeeRoleById(ctx, id, newName)
}

func (s *service) deleteRoleById(ctx context.Context, id int) error {
	return repository.GetEmplRepo().DeleteEmployeeRoleById(ctx, id)
}

func (s *service) deleteAllRoles(ctx context.Context) error {
	return repository.GetEmplRepo().DeleteAllEmployeeRoles(ctx)
}
