package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
)

type EmployeeRepo interface {
	AddEmployeeRole(ctx context.Context, name string) error
	GetEmployeesRoles(ctx context.Context) ([]shared.IdWithName, error)
	UpdateEmployeeRoleById(ctx context.Context, id int, newName string) error
	DeleteEmployeeRoleById(ctx context.Context, id int) error
}

type emplRepoImpl struct {
	*database.CoreRepository
}

func GetEmplRepo() EmployeeRepo {
	r := database.GetCoreRepository()
	return &emplRepoImpl{r}
}

func (r *emplRepoImpl) AddEmployeeRole(ctx context.Context, name string) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO employee_roles (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *emplRepoImpl) GetEmployeesRoles(ctx context.Context) ([]shared.IdWithName, error) {
	var result []shared.IdWithName

	err := r.SelectContext(ctx, &result, `SELECT * FROM employee_roles`)

	return result, err
}

func (r *emplRepoImpl) UpdateEmployeeRoleById(ctx context.Context, id int, newName string) error {
	_, err := r.QueryContext(ctx, `
		UPDATE employee_roles SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *emplRepoImpl) DeleteEmployeeRoleById(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM employee_roles
		WHERE id = $1
	`, id)

	return err
}
