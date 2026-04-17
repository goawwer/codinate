package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
)

type TaskRepo interface {

	// Priorities
	GetTaskPriorities(ctx context.Context) ([]shared.IdWithName, error)
	AddTaskPriority(ctx context.Context, name string) error
	UpdateTaskPriority(ctx context.Context, id int, newName string) error
	DeleteTaskPriorityById(ctx context.Context, id int) error

	// Statuses
	GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error)
	AddTaskStatus(ctx context.Context, name string) error
	UpdateTaskStatus(ctx context.Context, id int, newName string) error
	DeleteTaskStatusById(ctx context.Context, id int) error

	// categories
	GetAllCategoriesBy(ctx context.Context, proejctId int) ([]shared.IdWithName, error)
	AddNewCategory(ctx context.Context, name shared.NameInput, projectId int) error
	UpdateCategory(ctx context.Context, name shared.NameInput, id int) error
	DeleteCategorty(ctx context.Context, id int) error
}

type taskRepoImpl struct {
	*database.CoreRepository
}

func GetTaskRepo() TaskRepo {
	r := database.GetCoreRepository()
	return &taskRepoImpl{r}
}

func (r *taskRepoImpl) GetTaskPriorities(ctx context.Context) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_priorities`)

	return res, err
}

func (r *taskRepoImpl) AddTaskPriority(ctx context.Context, name string) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_priorities (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskPriority(ctx context.Context, id int, newName string) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_priorities SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskPriorityById(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_priorities
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_statuses`)

	return res, err
}

func (r *taskRepoImpl) AddTaskStatus(ctx context.Context, name string) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_statuses (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskStatus(ctx context.Context, id int, newName string) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_statuses SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskStatusById(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_statuses
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetAllCategoriesBy(ctx context.Context, proejctId int) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `
		SELECT id, name FROM task_categories
		WHERE project_id = $1
	`, proejctId)

	return res, err
}

func (r *taskRepoImpl) AddNewCategory(ctx context.Context, name shared.NameInput, projectId int) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_categories (name, project_id)
		VALUES ($1, $2)
	`, name, projectId)

	return err
}

func (r *taskRepoImpl) UpdateCategory(ctx context.Context, name shared.NameInput, id int) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_categories SET name = $1
		WHERE id = $2
	`, name, id)

	return err
}

func (r *taskRepoImpl) DeleteCategorty(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_categories
		WHERE id = $1
	`, id)

	return err
}
