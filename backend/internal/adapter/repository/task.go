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
	DeleteAllTaskPriorities(ctx context.Context) error

	// Statuses
	GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error)
	AddTaskStatus(ctx context.Context, name string) error
	UpdateTaskStatus(ctx context.Context, id int, newName string) error
	DeleteTaskStatusById(ctx context.Context, id int) error
	DeleteAllTaskStatuses(ctx context.Context) error
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

func (r *taskRepoImpl) DeleteAllTaskPriorities(ctx context.Context) error {
	_, err := r.QueryContext(ctx, `DELETE FROM task_priorities`)

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

func (r *taskRepoImpl) DeleteAllTaskStatuses(ctx context.Context) error {
	_, err := r.QueryContext(ctx, `DELETE FROM task_statuses`)

	return err
}
